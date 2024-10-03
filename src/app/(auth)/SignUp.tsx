import AuthForm from "@/components/AuthForm.tsx";
import Button from "@/components/Button.tsx";
import { callAPI, signIn, signUp } from "@/config/supabase.ts";
import React, { useState } from "react";

export default function SignUp({ setIsSignIn }) {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showVerifyEmailPopup, setShowVerifyEmailPopup] = useState(false);

    const submitSignUp = () => {
        console.log(`Email: ${email}, Password: ${password}, Name: ${name}`);

        signUp(email, password).then((rsp) => {
            const { data, error } = rsp;
            console.log(`Sign up data: ${JSON.stringify(data, null, 4)}`);
            console.log(`Sign up error: ${JSON.stringify(error, null, 4)}`);
        });


        // callAPI('create-account', { email, password, name })
        //     .then((r) => {
        //         if (!r.error) {
        //             setShowVerifyEmailPopup(true);
        //         }
        //     });
    }

    const VerifyEmailPopup = () => {
        return (
            <div className="fixed flex justify-center items-center w-screen h-screen top-0 left-0 bg-gray-900 bg-opacity-50 z-50">
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">Verify Your Email</h2>
                    <p className="text-lg mb-4">Thank you for creating an account! Please verify your email address before signing in.</p>
                    <Button text="Close" onClick={() => setShowVerifyEmailPopup(false)} />
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="text-xl font-bold mb-4">Create Account</div>
            <AuthForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPass={setPassword}
                name={name}
                setName={setName}
                showName={true}
                isSignUpPage={true}
            />
            {/*{isInvalidName && (*/}
            {/*    <p className="text-red-500 mt-2" style={{maxWidth: "300px"}}>*/}
            {/*        Name must be at least one character long.*/}
            {/*    </p>*/}
            {/*)}*/}
            {/*{isInvalidEmail && (*/}
            {/*    <p className="text-red-500 mt-2" style={{maxWidth: "300px"}}>*/}
            {/*        Invalid email format.*/}
            {/*    </p>*/}
            {/*)}*/}
            {/*{isInvalidPass && (*/}
            {/*    <p className="text-red-500 mt-2" style={{maxWidth: "300px"}}>*/}
            {/*        Password must be at least ten characters long, contain at least one uppercase letter, one*/}
            {/*        lowercase letter, one number, and one special character.*/}
            {/*    </p>*/}
            {/*)}*/}

            <div className="flex justify-between mt-6">
                <Button
                    text="Sign In"
                    onClick={() => setIsSignIn(true)}
                    style="border-[3px] border-red-800"
                    icon="arrow-back"
                    iconBefore
                />

                <Button
                    text="Sign Up"
                    onClick={() => submitSignUp()}
                    style=""
                    icon="arrow"
                    filled
                />
            </div>
            {showVerifyEmailPopup && <VerifyEmailPopup />}
        </>
    );
}
