"use client"
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const VerifyEmail = () => {
    const [status, setStatus] = useState('verifying');
    const params = useParams<{ tag: string; item: string }>()

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/verify-email/${params['verify-email']}`);
                if (response.ok) {
                    setStatus('verified');
                } else {
                    setStatus('error');
                }
            } catch (error) {
                setStatus('error');
            }
        };
        verifyEmail();
    }, [params['verify-email']]);

    return (
        <div>
            {status === 'verifying' && <p>Verifying your email...</p>}
            {status === 'verified' && <p>Email verified successfully!</p>}
            {status === 'error' && <p>Verification failed</p>}
        </div>
    );
};

export default VerifyEmail;