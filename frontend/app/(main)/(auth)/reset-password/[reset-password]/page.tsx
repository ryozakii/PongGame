'use client'
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle,
  } from "@/components/ui/card";
const ResetPassword = () => {
    const params = useParams<{ tag: string; item: string }>()
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reset-password/${params['reset-password']}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                }
            );
            if (response.ok) {
                router.push('/login');
            }
        } catch (error) {
            setError('Failed to reset password');
        }
    };

    return (
        <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>
           Change Password
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form>
            <div className="space-y-4">
                <div className="space-y-2">
            <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
            />
            </div>
            <div className="space-y-2">
            <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
            />
            </div>
            {error && <p className="text-destructive">{error}</p>}
            <Button type="button" onClick={handleSubmit}>Reset Password</Button>
        </div>
        </form>
        </CardContent>
    </Card>
    );
};

export default ResetPassword;