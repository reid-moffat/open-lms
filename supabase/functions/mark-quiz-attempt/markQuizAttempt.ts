import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { getCurrentTimestampTz } from "../_shared/helpers.ts";
import { adminClient } from "../_shared/adminClient.ts";
import {
    CourseService,
    NotificationService,
    QuizAttemptService,
    QuizQuestionAttemptService
} from "../_shared/Service/Services.ts";

const markQuizAttempt = async (request: EdgeFunctionRequest) => {

    const timestamp = getCurrentTimestampTz();

    const userId = request.getRequestUserId();

    const { quizAttemptId, marks }: { quizAttemptId: number, marks: { questionAttemptId: number, marksAchieved: number }[] } = request.getPayload();

    // Mark questions
    await Promise.all(marks.map(async (mark) => {
        return await adminClient.from('quiz_question_attempt').update({ marks_achieved: mark.marks }).eq('id', mark.questionAttemptId);
    }));

    // Update quiz attempt: get total score and check if it passed
    const quizQuestionAttempts = await QuizQuestionAttemptService.query('*', ['eq', 'quiz_attempt_id', quizAttemptId]);
    const totalMarks = quizQuestionAttempts.reduce((sum, attempt) => sum + attempt.marks_achieved, 0);

    const course = await CourseService.getById(quizQuestionAttempts[0].course_id);

    const update = {
        marker_id: userId,
        marking_time: timestamp,
        pass: totalMarks >= course.min_quiz_score,
        score: totalMarks
    };
    const { error } = await adminClient.from('quiz_attempt').update(update).eq('id', quizAttemptId);

    if (error) {
        request.log(`Error updating quiz attempt: ${error.message}`);
        throw new Error(`Error updating quiz attempt: ${error.message}`);
    }

    await QuizAttemptService.handleMarkedQuiz(quizAttemptId);

    const notification = {
        user_id: quizQuestionAttempts[0].user_id,
        direct: true,
        title: `Your ${course.name} quiz has been marked`,
        link: `/course/${course.id}`,
        read: false
    };
    await NotificationService.addNotification(notification);

    return null;
}

export default markQuizAttempt;
