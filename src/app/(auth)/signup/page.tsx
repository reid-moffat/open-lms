"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { callApi } from "@/config/firebase";
import Button from "@/components/Button";
import AuthForm from "@/components/AuthForm";

export default function SignUpPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isInvalidName, setInvalidName] = useState(false);
    const [isInvalidEmail, setInvalidEmail] = useState(false);
    const [isInvalidPass, setInvalidPass] = useState(false);

    const signUp = async () => {
        setInvalidPass(false);
        setInvalidName(false);
        setInvalidEmail(false);
        const hasUpperCase = /[A-Z]/;
        const hasLowerCase = /[a-z]/;
        const hasNumbers = /[0-9]/;
        const hasSpecialChars = /[!#$%&@?]/;

        if (!(hasUpperCase.test(password) && hasLowerCase.test(password) && hasNumbers.test(password) && hasSpecialChars.test(password))) {
            console.error("Password must be at least ten characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character");
            setInvalidPass(true);
            return;
        }

        if (name.length < 1) {
            console.error("Name must be at least one character long.");
            setInvalidName(true);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.error("Invalid email format.");
            setInvalidEmail(true);
            return;
        }

        try {
            const response = await callApi('createAccount', {
                name: name,
                email: email,
                password: password
            });
            if (response && response.data) {
                console.log("Account created successfully.");
                router.push('/');
            } else {
                console.error("Error creating account:", response);
            }
        } catch (error) {
            console.error("Error creating account:", error);
        }
    };

    return (
        <main className="flex h-[100vh] items-center justify-center">
            <div className="flex bg-white p-12 rounded-2xl shadow-custom">
                <div className="flex flex-col h-full w-full space-y-4">
                    <div className="border-2 p-6 rounded-2xl">
                        <div className="text-xl font-bold mb-4">Sign up with email</div>
                        <AuthForm
                            email={email}
                            setEmail={setEmail}
                            password={password}
                            setPass={setPassword}
                            name={name}
                            setName={setName}
                            showName={true}
                        />
                        {isInvalidName && (
                            <p style={{ maxWidth: "300px" }}>
                                Name must be at least one character long.
                            </p>
                        )}
                        {isInvalidEmail && (
                            <p style={{ maxWidth: "300px" }}>
                                Invalid email format.
                            </p>
                        )}
                        {isInvalidPass && (
                            <p style={{ maxWidth: "300px" }}>
                                Password must be at least ten characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.
                            </p>
                        )}
                        <Button text="sign up" onClick={signUp} style="mt-4 ml-auto" icon="arrow" filled/>
                    </div>
                    <div>or</div>
                    <Button text="back to login" onClick={() => router.push('/')} style="border-[3px] border-red-800" filled={false}/>
                </div>
            </div>
        </main>
    );
}