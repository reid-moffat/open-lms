import { expect } from "chai";
import { callOnCallFunctionWithAuth } from "../helpers/helpers";
import { dummyAdminAccount, dummyLearnerAccount } from "../helpers/testData";

suite("Add course", () => {
    suite('Success cases', () => {

        interface TestInput {
            name: string,
            description: string,
            link: string,
            minTime: number,
            maxQuizAttempts: number,
            quizTimeLimit: number,
            active: boolean,
        }

        let course: TestInput;
        const runTest = (description: string) => {
            const inputCopy = course; // Original may be updated by later test case before running
            return (
                test(description, function() {
                    this.timeout(7_000);

                    console.log(`Adding course: ${JSON.stringify(inputCopy, null, 4)}\n`);
                    return callOnCallFunctionWithAuth("addCourse", inputCopy, dummyAdminAccount.email, dummyAdminAccount.password)
                        .then((id) => console.log(`Successfully added new course: ${id.data}`));
                })
            );
        }

        course = {
            name: "Unit test",
            description: "Unit test",
            link: "www.unittest.com",
            minTime: 1,
            maxQuizAttempts: 1,
            quizTimeLimit: 1,
            active: true,
        };
        runTest("Simple active course");

        course = {
            name: "Unit test",
            description: "Unit test",
            link: "www.unittest.com",
            minTime: 1,
            maxQuizAttempts: 1,
            quizTimeLimit: 1,
            active: false,
        };
        runTest("Simple inactive course");
    });

    suite('Failure cases', () => {

        let course: any;
        const runTest = (description: string, expectedError: string) => {
            const inputCopy = course; // Original may be updated by later test case before running
            return (
                test(description, () => {
                    console.log(`Adding course: ${JSON.stringify(inputCopy, null, 4)}\n`);
                    return callOnCallFunctionWithAuth("addCourse", inputCopy, dummyAdminAccount.email, dummyAdminAccount.password)
                        .then(() => { throw new Error("Test case should fail") })
                        .catch((err) => { expect(err.message).to.equal(expectedError) });
                })
            );
        }

        suite("Invalid course structure", () => {
            const courses = [undefined, null, "", 12345, 10.5, "unit test", []];
            for (const course of courses) {
                runTest(String(course), "ValidationError: this cannot be null");
            }
        });

        course = {};
        runTest("Empty object course input", "ValidationError: active is a required field");
    });
});

suite("Get courses", () => {
    suite('Success cases', () => {

        const runTest = (description: string, admin: boolean) => {
            const email = admin ? dummyAdminAccount.email : dummyLearnerAccount.email;
            const password = admin ? dummyAdminAccount.password : dummyLearnerAccount.password;

            return (
                test(description, () => {
                    console.log(`Getting courses...\n`);
                    return callOnCallFunctionWithAuth("getCourses", {}, email, password)
                        .then((courses) => {
                            console.log(`Courses: ${JSON.stringify(courses.data, null, 4)}`);
                        });
                })
            );
        }
    });

    suite('Failure cases', () => {


    });
});

suite("Get course info", () => {

});

suite("Update course", () => {

});

suite("Enroll in course", () => {

});

suite("Unenroll from course", () => {

});