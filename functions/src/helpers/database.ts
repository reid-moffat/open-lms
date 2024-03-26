import { firestore } from "firebase-admin";
import { db } from "./setup";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";

/**
 * Syntactic sugar for Firestore interactions (error handling, reduce params, logging, etc)
 */

// Helpers for getting a doc/collection
const getCollection = (collection: DatabaseCollections) => db.collection(`/${collection}/`);
const getDocRef = (collection: DatabaseCollections, docId: string) => db.doc(`/${collection}/${docId}/`);

// Emails are metadata - should only be needed in special cases (e.g. cron jobs)
const getEmailCollection = () => db.collection(`/Email/`);

// Adds a document to a given collection (random id given)
const addDoc = (collection: DatabaseCollections, data: any) => {
    return getCollection(collection).add(data)
        .then((docRef) => {
            return docRef.id;
        })
        .catch(err => {
            logger.error(`Error adding document to collection '${collection}': ${err}`);
            throw new HttpsError("internal", `Error adding document to collection '${collection}'`);
        });
}

// Adds a document to a given collection with a specific id
const addDocWithId = (collection: DatabaseCollections, docId: string, data: any) => {
    return getDocRef(collection, docId)
        .set(data)
        .then(() => {
            return "Document added successfully";
        })
        .catch(err => {
            logger.error(`Error adding document '${docId}' to collection '${collection}': ${err}`);
            throw new HttpsError("internal", `Error adding document '${docId}' to collection '${collection}'`);
        });
}

// Checks if a document exists in a collection
const docExists = async (collection: DatabaseCollections, docId: string) => {
    return getDocRef(collection, docId).get()
        .then((doc) => {
            return doc.exists && doc.data();
        })
        .catch(err => {
            logger.error(`Error checking if document '${docId}' exists in collection '${collection}': ${err}`);
            throw new HttpsError("internal", `Error checking if document '${docId}' exists in collection '${collection}'`);
        });
}

// Returns the document data for a given document in the database (error handling included for not finding the doc)
const getDocData = (collection: DatabaseCollections, docId: string) => {
    return getDocRef(collection, docId).get()
        .then((doc) => {
            if (!doc.exists) {
                logger.error(`Document '${docId}' not found in collection '${collection}'`);
                throw new HttpsError("not-found", `Document '${docId}' not found in collection '${collection}'`);
            }
            const docData = doc.data();
            if (!docData) {
                logger.error(`Document '${docId}' in collection '${collection}' has no data (value: ${docData})`);
                throw new HttpsError("internal", `Document '${docId}' in collection '${collection}' has no data`);
            }
            return docData;
        })
        .catch(err => {
            logger.error(`Error getting document '${docId}' from collection '${collection}': ${err}`);
            throw new HttpsError("internal", `Error getting document '${docId}' from collection '${collection}'`);
        });
}

// Updates a document in the database (error handling included)
const updateDoc = (collection: DatabaseCollections, docId: string, data: any) => {
    return getDocRef(collection, docId)
        .update(data)
        .then(() => {
            return "Document updated successfully";
        })
        .catch(err => {
            logger.error(`Error updating document '${docId}' in collection '${collection}': ${err}`);
            throw new HttpsError("internal", `Error updating document '${docId}' in collection '${collection}'`);
        });
}

const deleteDoc = (collection: DatabaseCollections, docId: string) => {
    return getDocRef(collection, docId)
        .delete()
        .then(() => {
            return "Document deleted successfully";
        })
        .catch(err => {
            logger.error(`Error deleting document '${docId}' in collection '${collection}': ${err}`);
            throw new HttpsError("internal", `Error deleting document '${docId}' in collection '${collection}'`);
        });
}

/**
 * Database collections and document interfaces
 */

// All database collections (excluding email, use the sendEmail helper function for that)
enum DatabaseCollections {
    User = "User",
    Course = "Course",
    EnrolledCourse = "EnrolledCourse",
    QuizQuestion = "QuizQuestion",
    ReportedCourse = "ReportedCourse",
    CourseAttempt = "CourseAttempt",
    QuizAttempt = "QuizAttempt",
    QuizQuestionAttempt = "QuizQuestionAttempt",
}

interface UserDocument {
    email: string;
    name: string;
    admin: boolean;
    signUpTime: firestore.Timestamp;
}

interface CourseDocument {
    name: string;
    description: string;
    link: string;
    active: boolean;
    minTime: number | null;
    userId: string;
    quiz: {
        maxAttempts: number | null;
        minScore: number | null;
        preserveOrder: boolean;
        timeLimit: number | null;
    } | null;
}

interface EnrolledCourseDocument {
    userId: string;
    courseId: string;
}

interface QuizQuestionDocument {
    courseId: string;
    question: string;
    type: "tf" | "mc" | "sa";
    marks: number;
    answers?: string[];
    correctAnswer?: number;
    active: boolean;
    stats: {
        numAttempts: number;
        totalScore?: number;
        distribution?: { [key: string]: number };
    };
}

interface ReportedCourseDocument { // TODO

}

interface CourseAttemptDocument {
    userId: string;
    courseId: string;
    startTime: firestore.Timestamp;
    endTime: firestore.Timestamp | null;
    pass: boolean | null;
}

interface QuizAttemptDocument {
    userId: string;
    courseId: string;
    courseAttemptId: string;
    startTime: firestore.Timestamp;
    endTime: firestore.Timestamp | null;
    pass: boolean | null;
}

interface QuizQuestionAttemptDocument {
    userId: string;
    courseId: string;
    courseAttemptId: string;
    questionId: string;
    response: string | number;
    marksAchieved: number | null;
}

export {
    getCollection,
    getEmailCollection,
    getDocRef,
    addDoc,
    addDocWithId,
    docExists,
    getDocData,
    updateDoc,
    deleteDoc,

    DatabaseCollections,
    UserDocument,
    CourseDocument,
    EnrolledCourseDocument,
    ReportedCourseDocument,
    QuizQuestionDocument,
    CourseAttemptDocument,
    QuizAttemptDocument,
    QuizQuestionAttemptDocument
};