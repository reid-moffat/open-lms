"use client"

import IDProfile from "./IDProfile";
import IDCourse from "./IDCourse";
import IDCoursesEnrolled from "./IDEnrolled"
import { useRouter } from 'next/navigation';


export default function Profile() {

    const TEMP_PROFILE_DATA = [
        { name: "Jennie Kim", dateMonth: "November", dateDay: "11", dateYear: "2024", email: "jenniekim@gmail.com", link:"yes", id: 1 },
    ]

    const TEMP_COURSE_DATA = [
        { title: "CISC 498", grade: 22, completion: 10, link: "no", id: 1 },
        { title: "ANAT 100", grade: 22, completion: 10, link: "no", id: 1 },
        { title: "CISC 101", grade: 22, completion: 10, link: "no", id: 1 },
        { title: "CISC 121", grade: 22, completion: 10, link: "no", id: 1 },
        { title: "CISC 271", grade: 22, completion: 10, link: "no", id: 1 },
        { title: "CISC 235", grade: 22, completion: 10, link: "no", id: 1 },
        { title: "CISC 324", grade: 22, completion: 10, link: "no", id: 1 },
        { title: "CISC 251", grade: 22, completion: 10, link: "no", id: 1 },
        { title: "CISC 110", grade: 22, completion: 10, link: "no", id: 1 },
    ]

    const TEMP_COMPLETED_DATA = [
        { title: "CISC 423", completionDate: "Jan 1, 2023", link: "no", id: 1 },
        { title: "CISC 365", completionDate: "Jan 2, 2023", link: "no", id: 1 },
        { title: "CISC 422", completionDate: "Jan 3, 2023", link: "no", id: 1 },
        { title: "CISC 322", completionDate: "Jan 4, 2023", link: "no", id: 1 },
    ]

    const profileData = () => {
        return ( TEMP_PROFILE_DATA.map((profile,key) => (
            <IDProfile
                key={key}
                name={profile.name}
                dateMonth={profile.dateMonth}
                dateDay={profile.dateDay}
                dateYear={profile.dateYear}
                email={profile.email}
                link={profile.link}
                id={profile.id}
            />
        )))
    }

    const coursesEnrolledData = () => {
        return (
            <>
                {TEMP_COURSE_DATA.map((course,key) => (
                    <IDCourse
                        key={key}
                        title={course.title}
                        grade={course.grade}
                        completion={course.completion}
                        link={course.link}
                        id={course.id}
                />
                ))}
            </>
        )
    }

    const courseData = () => {
        return (
            <>
                {TEMP_COMPLETED_DATA.map((coursesEnrolled,key) => (
                    <IDCoursesEnrolled
                        key={key}
                        title={coursesEnrolled.title}
                        completionDate={coursesEnrolled.completionDate}
                        link={coursesEnrolled.link}
                        id={coursesEnrolled.id}
                />
                ))}
            </>
        )
    }

    return (
        <main className="flex-col justify-center items-center">
            <div className="flex flex-row mb-0">
                    {/* Account Details section */}
                    <div className="flex flex-col bg-white w-[50%] h-[50vh] p-12 rounded-2xl shadow-custom mr-8 overflow-y-scroll sm:no-scrollbar mb-4">
                        <div className="text-lg mb-2">Account Details</div>
                        { profileData() }
                    </div>

                    <div className="flex flex-col h-[50vh] bg-white w-[50%] p-12 rounded-2xl shadow-custom overflow-y-scroll sm:no-scrollbar">
                        {/* Completed Courses section */}
                        <div className="text-lg mb-4">Completed Courses</div>
                        <div className="overflow-y-scroll">
                            <div className="flex flex-col mr-auto text-lg w-[100%]">
                                <table className="flex-col border-collapse border w-full">
                                        <thead>
                                        <tr className="bg-gray-200">
                                            <th className="border p-2">Name</th>
                                            <th className="border p-2">Date of Completion</th>
                                        </tr>
                                        </thead>
                                </table>
                            </div>
                            {courseData()}
                        </div>
                    </div>
            </div>

            {/* Enrolled Courses Section */}
            <div className="flex flex-col h-[60vh] bg-white p-12 rounded-2xl shadow-custom mb-8">
                <div className="flex flex-row justify-end items-center mb-4">
                    <div className="text-lg mb-2 mr-auto">Enrolled Courses</div>
                </div>
                <div className="flex flex-row flex-wrap justify-between gap-4 overflow-y-scroll sm:no-scrollbar">
                    {coursesEnrolledData()} 
                </div>
            </div>

        </main>  
    );
}
