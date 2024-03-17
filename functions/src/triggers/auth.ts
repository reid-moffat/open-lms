import { HttpsError } from "firebase-functions/v2/https";
import * as functions from "firebase-functions";
import { logger } from "firebase-functions";
import { auth } from "../helpers/setup";
import { DatabaseCollections, getCollection, getDoc, sendEmail } from "../helpers/helpers";

/**
 * Logic run before a user can be created (throw errors to block account creation):
 */
const beforeCreate = functions.auth.user().beforeCreate(async (user) => {
    // TODO
});

/**
 * Logic run when a new user signs up:
 * -Create a default document for them in firestore with their email
 * -Send them a verification email
 */
const onUserSignup = functions.auth.user().onCreate(async (user) => {
    if (user.email == null) {
        throw new HttpsError(
            'invalid-argument',
            `User email is null: ${JSON.stringify(user, null, 4)}`
        );
    }

    // Create a default db document for the user
    const defaultDoc = {
        email: user.email,
    };
    await getDoc(DatabaseCollections.User, user.uid)
        .set(defaultDoc)
        .then(() => logger.log(`Default db data successfully created for user: ${user.uid}`))
        .catch((err) => {
            throw new HttpsError('internal', `Error creating default db data for ${user.uid}: ${err}`);
        });

    // Create a verification email
    const verifyLink = await auth
        .generateEmailVerificationLink(user.email)
        .then((link) => link)
        .catch((err) => {
            throw new HttpsError('internal', `Error generating verification link: ${err}`);
        });

    const emailHtml =
        `<p style="font-size: 16px;">Thanks for signing up!</p>
            <p style="font-size: 16px;">Verify your account here: ${verifyLink}</p>
            <p style="font-size: 12px;">If you didn't sign up, please disregard this email</p>
            <p style="font-size: 12px;">Best Regards,</p>
            <p style="font-size: 12px;">-The OpenLMS Team</p>`;

    return sendEmail(user.email, 'Verify your email for OpenLMS', emailHtml, 'email address verification');
});

/**
 * Logic run before a user is able to sign in (throw errors here to block sign in):
 * -User's email must be verified
 */
const beforeSignIn = functions.auth.user().beforeSignIn((user) => {
    if (!user.emailVerified) {
        throw new functions.auth.HttpsError(
            'permission-denied',
            `The email "${user.email}" has not been verified. Please check your email`
        );
    }
});

/**
 * Logic that's run when a user is deleted:
 * -Delete user document from firestore
 * -Delete all emails sent to the user
 * -Delete all courses created by the user
 */
const onUserDelete = functions.auth.user().onDelete(async (user) => {

    logger.info(`Getting documents for ${user.uid}...`);

    const promises = [];

    const userDoc = getDoc(DatabaseCollections.User, user.uid);
    promises.push(userDoc.delete());

    const emails = await getCollection(DatabaseCollections.Email)
        .where('to', '==', user.email)
        .get()
        .then((result) => result.docs)
        .catch((err) => { throw new HttpsError('internal', `Error getting user emails: ${err}`) });
    promises.concat(emails.map((email) => email.ref.delete()));

    if (user.customClaims && user.customClaims["admin"] === true) {
        const userCourses = await getCollection(DatabaseCollections.Course)
            .where('userID', '==', user.uid)
            .get()
            .then((result) => result.docs)
            .catch((err) => { throw new HttpsError('internal', `Error getting user courses: ${err}`) });

        logger.info(`Queried ${userCourses.length} courses created by the user '${user.uid}'`);
        promises.concat(userCourses.map((course) => course.ref.delete()));
    }

    const numDocs = promises.length;

    return Promise.all(promises)
        .then(() => logger.log(`Successfully deleted ${numDocs} user docs (user profile, courses, course attempts, etc) for user '${user.uid}'`))
        .catch((err) => { throw new HttpsError('internal', `Error deleting user data for user '${user.uid}': ${err}`) });
});

export { beforeCreate, onUserSignup, beforeSignIn, onUserDelete };
