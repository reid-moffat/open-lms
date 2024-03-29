"use client"

import Button from "@/components/Button"
import { ApiEndpoints, callApi } from "@/config/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation"
import { useState } from "react";
import { useAsync } from "react-async-hook";
import { LuExternalLink } from "react-icons/lu";


export default function Insights({ params }: { params: { id: string } }) {

    const statusNames = {
        2: "To do",
        3: "In progress",
        4: "Awaiting marking",
        5: "Failed",
        6: "Completed",
    }

    const router = useRouter();

    const courseData = useAsync(() =>
        callApi(ApiEndpoints.GetCourseInsightReport, {courseId: params.id})  // @ts-ignore
            .then((rsp) => { setData(rsp.data); console.log(rsp); return rsp; }),
        []);

    const [data, setData] = useState();

    const getEnrolledLearners = () => {
        if (data) {
            return (
                <div className="flex flex-wrap w-full justify-start overflow-y-scroll sm:no-scrollbar">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-black text-left">
                                <th className="py-1">Name</th>
                                <th className="py-1">Status</th>
                                <th className="py-1">Quiz</th>
                            </tr>
                        </thead>
                        <tbody>
                            { /* @ts-ignore */}
                            { data.learners.map((learner: any, key: number) => (
                                <tr key={key} className="border">
                                    <td className="border p-2">
                                        <Link href={"/admin/profile/"+learner.userId} className="flex flex-row items-center hover:opacity-60">
                                            {learner.name}
                                            <LuExternalLink className="ml-1" color="rgb(153 27 27)"/>
                                        </Link>
                                    </td>
                                    <td className="border p-2">
                                        {/* @ts-ignore */}
                                        {statusNames[learner.completionStatus]}
                                    </td>
                                    <td className="border p-2">
                                        <Link href={"/admin/mark/"+learner.quizAttemptId} className="flex flex-row items-center hover:opacity-60">
                                            {new Date(learner.quizAttemptTime*1000).toLocaleString()}
                                            <LuExternalLink className="ml-1" color="rgb(153 27 27)"/>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
    }

    const getQuizQuestions = () => {
        if (data) {
            return (
                <div className="flex flex-wrap w-full justify-start overflow-y-scroll sm:no-scrollbar">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-black text-left">
                                <th className="py-1">Question</th>
                                <th className="py-1"><div className="w-max">% Correct</div></th>
                            </tr>
                        </thead>
                        <tbody>
                            { /* @ts-ignore */}
                            { data.questions.map((question: any, key: number) => (
                                <tr key={key} className="border">
                                    <td className="border p-2">
                                        {question.question}
                                    </td>
                                    <td className="border p-2">
                                        {question.stats.totalScore ? Math.round((question.stats.totalScore/(question.stats.numAttempts*question.marks))*100)/100 : null}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
    }

    const loadingPopup = () => {
        if (courseData.result?.data) {
            return <></>;
        }

        return (
            <div
                className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 bg-white bg-opacity-50">
                <div className="flex flex-col w-1/2 bg-white p-12 rounded-xl text-lg shadow-xl">
                    <div className="text-lg">
                        {courseData.loading ? "Loading course data..." : "Error loading course data."}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="w-full h-full pb-4">
            <div className="h-full overflow-y-scroll rounded-2xl sm:no-scrollbar">
                <div className="flex flex-row bg-white w-full p-12 rounded-2xl shadow-custom overflow-y-scroll sm:no-scrollbar mb-4">
                    <div className="flex flex-col">
                        {/* @ts-ignore */}
                        <div className="text-xl font-bold mb-4">{data ? data.courseName : ""}</div>
                        <div className="flex flex-row space-x-6">
                            <div className="flex flex-col items-center">
                                <div>Learners Enrolled</div>
                                {/* @ts-ignore */}
                                <div className="text-3xl font-bold">{data ? data.numEnrolled : ""}</div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div>Course Completions</div>
                                {/* @ts-ignore */}
                                <div className="text-3xl font-bold">{data ? data.numComplete : ""}</div>
                            </div>
                        </div>
                    </div>
                    <Button text="Edit Course Details" onClick={() => router.push("/admin/course/"+params.id)} style="ml-auto" />
                </div>
                <div className="flex flex-row space-x-6">
                    <div className="flex flex-col bg-white w-1/2 p-12 rounded-2xl shadow-custom overflow-y-scroll sm:no-scrollbar">
                        <div className="text-lg mb-2">Enrolled Learners</div>
                        { getEnrolledLearners() }
                    </div>
                    <div className="flex flex-col bg-white w-1/2 p-12 rounded-2xl shadow-custom overflow-y-scroll sm:no-scrollbar">
                        <div className="text-lg mb-2">Quiz Questions</div>
                        { getQuizQuestions() }
                    </div>
                </div>
            </div>

            { loadingPopup() }
        </main>
    )
}