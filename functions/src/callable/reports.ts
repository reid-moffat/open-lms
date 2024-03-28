import { HttpsError, onCall } from "firebase-functions/v2/https";
import { verifyIsAdmin } from "../helpers/helpers";
import { logger } from "firebase-functions";
import {
    CourseAttemptDocument,
    DatabaseCollections,
    EnrolledCourseDocument,
    getCollection,
    getCollectionDocs,
    QuizAttemptDocument,
    QuizQuestionDocument,
    QuizQuestionAttemptDocument,
    UserDocument, getDocData, CourseDocument,
} from "../helpers/database";
import { object, string } from "yup";

/**
 * Returns a list of all learners on the platform with their:
 * -uid
 * -name
 * -Number of courses completed
 */
const getUserReports = onCall(async (request) => {

    logger.info("Verifying user is an admin...");

    await verifyIsAdmin(request);

    logger.info("User is an admin, querying database for user reports...");

    const users = await getCollectionDocs(DatabaseCollections.User) as UserDocument[];
    const courseEnrollments = await getCollectionDocs(DatabaseCollections.EnrolledCourse) as EnrolledCourseDocument[];
    const courseAttempts = await getCollectionDocs(DatabaseCollections.CourseAttempt) as CourseAttemptDocument[];

    logger.info("Successfully queried database data, translating to user data...");

    return users.map((user) => {

        const userEnrollments = courseEnrollments.filter((enrollment) => enrollment.userId === user.id);
        const userAttempts = courseAttempts.filter((attempt) => attempt.userId === user.id);
        const completedAttempts = courseAttempts.filter((attempt) => attempt.userId == user.id && attempt.pass === true);

        return {
            uid: user.id,
            name: user.name,
            email: user.email,
            coursesEnrolled: userEnrollments.length,
            coursesAttempted: userAttempts.length,
            coursesComplete: completedAttempts.length,
        };
    }).sort((a, b) => b.coursesEnrolled - a.coursesEnrolled);
});

/**
 * Returns a list of all courses on the platform with their:
 * -course ID
 * -name
 * -active status
 * -Number of enrolled learners
 * -Number of learners who completed the course
 * -Average course completion time (not including quiz attempt(s))
 */
const getCourseReports = onCall(async (request) => {

    logger.info("Verifying user is an admin...");

    await verifyIsAdmin(request);

    logger.info("User is an admin, querying database for course reports...");

    const courses = await getCollection(DatabaseCollections.Course)
        .where("active", "==", true)
        .get()
        .then((result) => result.docs)
        .catch((error) => {
            logger.error(`Error querying courses: ${error}`);
            throw new HttpsError('internal', "Error getting course reports, please try again later");
        });

    const enrollments = await getCollectionDocs(DatabaseCollections.EnrolledCourse) as EnrolledCourseDocument[];
    const courseAttempts = await getCollectionDocs(DatabaseCollections.CourseAttempt) as CourseAttemptDocument[];
    const quizAttempts = await getCollectionDocs(DatabaseCollections.QuizAttempt) as QuizAttemptDocument[];

    logger.info("Successfully queried database collections");

    return courses.map((course) => {

        const courseEnrollments: EnrolledCourseDocument[] = enrollments.filter((enrollment) => enrollment.courseId === course.id);

        const completedAttempts: CourseAttemptDocument[] = courseAttempts.filter((attempt) => attempt.courseId === course.id && attempt.pass === true);

        const completionTimes: number[] = completedAttempts.map((attempt) => {
            const milliseconds = (attempt.endTime?.toMillis() ?? 0) - attempt.startTime.toMillis();
            return Math.floor(milliseconds / 1000 / 60); // In minutes
        });
        let averageTime = null;
        if (completionTimes.length > 0) {
            averageTime = Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length * 10) / 10;
        }

        const quizScores: number[] = quizAttempts
            .filter((attempt) => attempt.courseId === course.id && attempt.pass === true)
            .map((attempt) => {
                if (attempt.score === null) {
                    throw new HttpsError('internal', `Completed quiz attempt (${attempt.id}) score is null`);
                }
                return attempt.score;
            });
        let averageScore = null;
        if (quizScores.length > 0) {
            const totalQuizMarks = course.data().quiz.totalMarks;
            const totalScore = quizScores.reduce((total, curr) => total + curr, 0);

            averageScore = Math.round((totalScore / quizScores.length / totalQuizMarks) * 100 * 10) / 10;
        }

        return {
            courseId: course.id,
            name: course.data().name,
            numEnrolled: courseEnrollments.length,
            numComplete: completedAttempts.length,
            avgTime: averageTime,
            avgQuizScore: averageScore,
        };
    }).sort((a, b) => b.numEnrolled - a.numEnrolled);
});

/**
 * Returns a list of statistics for the course on the platform:
 * -List of enrolled users
 *      -Status of completion
 *      -Quiz to be marked?
 * -Number of enrolled learners
 * -Number of learners who completed the course
 * -Average course completion time (not including quiz attempt(s))
 * -List of question fail rate amongst all the questions for a distribution
 */
const getCourseInsightReport = onCall(async (request) => {

    logger.info("Verifying user is an admin...");

    await verifyIsAdmin(request);

    logger.info("User is an admin, querying database for this course's report...");

    const schema = object({
        courseId: string().required(),
    }).required().noUnknown(true);

    await schema.validate(request.data, { strict: true })
        .catch((err) => {
            logger.error(`Error validating request: ${err}`);
            throw new HttpsError('invalid-argument', err);
        });

    const { courseId } = request.data;

    const courseData = await getDocData(DatabaseCollections.Course, courseId) as CourseDocument;

    const courseAttempts: CourseAttemptDocument[] = await getCollection(DatabaseCollections.CourseAttempt)
        .where("courseId", "==", courseId)
        .get()
        .then((result) => result.docs.map(doc => doc.data() as CourseAttemptDocument))
        .catch((error) => {
            logger.error(`Error querying course attempts: ${error}`);
            throw new HttpsError('internal', "Error getting this course insight report, please try again later")
        });

    // Use a Map to track the latest attempt for each userId
    const latestAttemptsByUser: Map<string, CourseAttemptDocument> = new Map();

    courseAttempts.forEach((attempt) => {
        const existingAttempt = latestAttemptsByUser.get(attempt.userId);
        if (!existingAttempt || attempt.startTime > existingAttempt.startTime) {
            latestAttemptsByUser.set(attempt.userId, attempt);
        }
    });

    // Convert the Map values back to an array
    const filteredAttempts: CourseAttemptDocument[] = Array.from(latestAttemptsByUser.values());

    // Fetch quiz attempts that need marking
    const markingStatusMap: Map<string, boolean> = new Map();

    // Fetch all QuizQuestionAttempts for the course
    const quizQuestionAttempts: QuizQuestionAttemptDocument[] = await getCollection(DatabaseCollections.QuizQuestionAttempt)
        .where("courseId", "==", courseId)
        .get()
        .then((result) => result.docs.map(doc => doc.data() as QuizQuestionAttemptDocument));

    quizQuestionAttempts.forEach((attempt) => {
        if (attempt.marksAchieved === null) {
            markingStatusMap.set(attempt.userId, true);
        }
    });

    // Fetch user details
    const userDetails: Map<string, { name: string }> = new Map();
    // @ts-ignore
    const users: UserDocument[] = await getCollection(DatabaseCollections.User)
        .get()
        .then((result) => result.docs.forEach(doc => {
            userDetails.set(doc.id, { name: doc.data().name });
        }));

    // Fetch active QuizQuestions for the course
    const quizQuestions: QuizQuestionDocument[] = await getCollection(DatabaseCollections.QuizQuestion)
        .where("courseId", "==", courseId)
        .where("active", "==", true)
        .get()
        .then(result => result.docs.map(doc => doc.data() as QuizQuestionDocument));

    // Map to store question texts
    let questionTexts: string[] = quizQuestions.map(question => question.question);

    // Prepare to calculate average marks and match responses
    let questionStats: { [key: string]: { marks: number, averageMarksAchieved: number, numAttempts: number, totalScore: number } } = {};
    quizQuestions.forEach(question => {
        questionStats[question.id] = { marks: question.marks, averageMarksAchieved: 0, numAttempts: 0, totalScore: 0 };
    });

    // Process quiz question attempts
    quizQuestionAttempts.forEach(attempt => {
        if (questionStats[attempt.questionId]) {
            questionStats[attempt.questionId].numAttempts += 1;
            if (attempt.marksAchieved !== null) {
                questionStats[attempt.questionId].totalScore += attempt.marksAchieved ? 1 : 0;
            }
        }
    });

    // Calculate averages
    Object.keys(questionStats).forEach(questionId => {
        const stat = questionStats[questionId];
        stat.averageMarksAchieved = stat.numAttempts > 0 ? (stat.totalScore / stat.numAttempts) * stat.marks : 0;
    });

    const enrollments = await getCollectionDocs(DatabaseCollections.EnrolledCourse) as EnrolledCourseDocument[];

    const courseEnrollments = enrollments.filter((enrollment) => enrollment.courseId === courseId);

    const completedAttempts = courseAttempts.filter((attempt) => {
        return attempt.courseId === courseId && attempt.pass === true;
    });

    const completionTimes = completedAttempts.map((attempt) => {
        // @ts-ignore
        const milliseconds = attempt.endTime.toMillis() - attempt.startTime.toMillis();
        return Math.floor(milliseconds / 1000 / 60); // In minutes
    });
    const averageTime = completionTimes.length === 0 ? null : (1 / completionTimes.length) * completionTimes.reduce((a, b) => a + b, 0);

    // Combine data to create the courseLearners array
    const courseLearners = filteredAttempts.map((attempt) => {
        const completionStatus = attempt.pass;
        const markingStatus = markingStatusMap.get(attempt.userId) || false;
        const userName = userDetails.get(attempt.userId)?.name || "Unknown User";

        return {
            name: userName,
            completionStatus: completionStatus,
            markingStatus: markingStatus,
        };
    });

    // Combine all stats for the return array
    return {
        courseName: courseData.name,
        courseId: courseData.id,
        learners: courseLearners,
        questions: questionTexts,
        questionStats: Object.values(questionStats).map(stat => ({
            marks: stat.marks,
            averageMarksAchieved: stat.averageMarksAchieved.toFixed(2),
        })),
        numEnrolled: courseEnrollments.length,
        numComplete: completedAttempts.length,
        avgTime: averageTime
    };
});

export { getUserReports, getCourseReports, getCourseInsightReport };
