"use client"

import Link from "next/link"
import link from './link.png'
import Image from 'next/image'
import plus from './plus.png'
import Button from "@/components/Button"


export default function IDCourse({
    title,          // string
    status,         // string
    description,    // string
    time,           // string - elapsed time?
    id
} : {
    title: string,
    status: string,
    description: string,
    time: string,
    id: number
}) {

    return (
        <main>
            <div className="flex flex-row border-4 rounded-2xl p-8">
                <div className="flex flex-col">
                    <div className="text-2xl font-bold">{title}</div>
                    <div className="mt-2 text-2xl">{description}</div>
                    <div className="flex flex-row space-x-4 mt-4">
                        <Button text="Go to course" onClick={() => alert("go to course")} filled icon="link" />
                        <Button text="Enroll" onClick={() => alert("enroll")} icon="plus" />
                    </div>
                </div>
                <div className="flex flex-col justify-center items-center ml-auto border-2 rounded-xl px-10 py-4 shadow-lg">
                    <div className="text-sm -mb-1"> elapsed time:</div>
                    <div className="text-3xl">{time}</div>
                    <div className="text-sm mt-2 -mb-1">status:</div>
                    <div className="text-2xl"> {status}</div>
                </div>
            </div>
        </main>
    )
}
