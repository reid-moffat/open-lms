import IService from "../IService.ts";

class _quizAttemptService extends IService {

    TABLE_NAME = "quiz_attempt";

    /**
     * Gets the latest quiz attempt given a list of quiz attempts
     */
    public getLatest(quizAttempts: object[]): object {
        if (quizAttempts.length === 0) {
            return null;
        }

        return quizAttempts.reduce((latest, current) => new Date(current.start_time) > new Date(latest.start_time) ? current : latest)
    }

    /**
     * Given a quiz that's marked handle the status of it in relation to the course attempt (it may cause the attempt to
     * pass or fail)
     *
     * Note the quiz attempt must have all questions marked (can't have unmarked short answers), and the 'score' and
     * 'pass' fields are defined too. This doesn't update the quiz attempt, it (possibly) updates the course attempt
     *
     * @param quizAttemptId ID of the marked quiz attempt to handle
     */
    public async handleMarkedQuiz(quizAttemptId: number) {
        const timestamp = getCurrentTimestampTz();

        const quizAttempt = await QuizAttemptService.getById(quizAttemptId);
        const courseAttempt = await CourseAttemptService.getById(quizAttempt.course_attempt_id);

        // If the quiz passes, the course attempt passes
        if (quizAttempt.pass === true) {
            const { data, error } = await adminClient.from('course_attempt').update({ pass: true, end_time: timestamp }).eq('id', courseAttempt.id);
            await EnrollmentService.updateStatus(courseAttempt.course_id, courseAttempt.user_id, CourseStatus.COMPLETED);

            if (error) {
                log(`Error updating course attempt to pass: ${error.message}`);
                return ErrorResponse(`Error updating course attempt to pass: ${error.message}`);
            }

            return;
        }

        // If the quiz attempt fails, check if they're out of attempts (fail the course), otherwise they can try again
        const course = await CourseService.getById(quizAttempt.course_id);

        const maxQuizAttempts = course.max_quiz_attempts;
        if (quizAttemptQuery.length >= maxQuizAttempts) {
            const { data, error } = await adminClient.from('course_attempt').update({ pass: false, end_time: timestamp }).eq('id', courseAttempt.id);
            await EnrollmentService.updateStatus(courseAttempt.course_id, courseAttempt.user_id, CourseStatus.FAILED);

            if (error) {
                log(`Error updating course attempt to failure: ${error.message}`);
                return ErrorResponse(`Error updating course attempt to failure: ${error.message}`);
            }
        }
    }
}

export default _quizAttemptService;
