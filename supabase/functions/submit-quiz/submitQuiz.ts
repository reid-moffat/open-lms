import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { ErrorResponse, getCurrentTimestampTz } from "../_shared/helpers.ts";
import { getRows } from "../_shared/database.ts";
import {
    CourseService,
    EnrollmentService,
    QuizAttemptService,
    QuizQuestionService
} from "../_shared/Service/Services.ts";
import { adminClient } from "../_shared/adminClient.ts";
import { CourseStatus } from "../_shared/Enum/CourseStatus.ts";
import { handleMarkedQuiz } from "../_shared/functionality.ts";
import PermissionError from "../_shared/Error/PermissionError.ts";

const submitQuiz = async (request: EdgeFunctionRequest) => {

    const timestamp = getCurrentTimestampTz();

    request.log(`Starting submitQuiz with timestamp ${timestamp}`);

    const userId = request.getRequestUserId();
    const { quizAttemptId, responses } = request.getPayload();

    request.log(`Request user id: ${userId} Quiz attempt id: ${quizAttemptId} Responses: ${JSON.stringify(responses)}`);

    const quizAttempt = await QuizAttemptService.getById(quizAttemptId);

    request.log(`Quiz attempt: ${JSON.stringify(quizAttempt)}`);

    if (quizAttempt.user_id !== userId) {
        throw new PermissionError(`User ${userId} does not have access to quiz attempt ${quizAttemptId} (owning user: ${quizAttempt.userId})`);
    }

    const [course, quizQuestions] = await Promise.all([
        CourseService.getById(quizAttempt.course_id),
        QuizQuestionService.getByColumn('course_id', quizAttempt.course_id)
    ]);

    request.log(`Course: ${JSON.stringify(course)} Quiz questions: ${JSON.stringify(quizQuestions)}`);

    if (quizQuestions.length !== responses.length) {
        return ErrorResponse(`There are ${quizQuestions.length} quiz questions, but only ${responses.length} responses were provided`);
    }
    if (!responses.every((r) => quizQuestions.some((q) => q.id === r.questionId))) {
        return ErrorResponse(`Quiz question IDs and response IDs don't fully match`);
    }

    request.log(`Responses verification passed!`);

    // Mark quiz questions
    let marksAchieved = 0;
    let autoMark = true;
    const quizQuestionAttempts = quizQuestions.map((q) => {

        const response = responses.find((r) => r.questionId === q.id);

        let marks = null;
        if (q.type === "MC" || q.type === "TF") {
            marks = q.correct_answer === response.answer ? q.marks : 0;
            marksAchieved += marks;
        } else if (q.type === "SA") {
            autoMark = false;
        } else {
            return ErrorResponse(`Unknown question type: ${q.type}`);
        }

        return {
            course_id: quizAttempt.course_id,
            user_id: userId,
            quiz_question_id: q.id,
            course_attempt_id: quizAttempt.course_attempt_id,
            quiz_attempt_id: quizAttemptId,

            type: q.type,

            response: response.answer,
            max_marks: q.marks,
            marks_achieved: marks
        };
    });
    if (quizQuestionAttempts instanceof Response) return quizQuestionAttempts;

    const { data, error } = await adminClient.from('quiz_question_attempt').insert(quizQuestionAttempts);

    if (error) {
        return ErrorResponse(`Error adding quiz questions attempts: ${error.message}`);
    }

    if (marksAchieved >= course.min_quiz_score) {
        autoMark = true; // If the user gets enough marks to pass without the short answers, pass them
    }

    // Update quiz attempt
    const update = {
        end_time: timestamp,
        ...(autoMark && { pass: marksAchieved >= course.min_quiz_score }),
        ...(autoMark && { score: marksAchieved })
    };
    const { data: data2, error: error2 } = await adminClient.from('quiz_attempt').update(update).eq('id', quizAttemptId);

    if (!autoMark) {
        await EnrollmentService.updateStatus(courseID, userId, CourseStatus.AWAITING_MARKING);
    }

    if (error2) {
        return ErrorResponse(`Error updating quiz attempts: ${error2.message}`);
    }

    if (autoMark) {
        const markRsp = await handleMarkedQuiz(quizAttemptId);
        if (markRsp instanceof Response) return markRsp;
    }

    return data2;
}

export default submitQuiz;
