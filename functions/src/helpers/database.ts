// All database collections
enum DatabaseCollections {
    User = "User",
    Course = "Course",
    EnrolledCourse = "EnrolledCourse",
    ReportedCourse = "ReportedCourse",
    QuizQuestion = "QuizQuestion",
    CourseAttempt = "CourseAttempt",
    QuizAttempt = "QuizAttempt",
    QuizQuestionAttempt = "QuizQuestionAttempt",
    Email = "Email",
}

interface UserDocument {
    email: string;
    name: string;
    admin: boolean;
}

export { DatabaseCollections };
