"use client";
import React, { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
// Create a separate component for the auth logic
const AuthComponent = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [requires2FA, setRequires2FA] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const authCalled = useRef(false);
  const router = useRouter();
  const { toast } = useToast();
  useEffect(() => {
    if (performance.navigation.type === 1) {
      router.push("/Login");
    }
  }, []);

  const auth = async (otp?: string) => {
    if (authCalled.current && !otp) return; // Allow for OTP verification
    authCalled.current = true;

    try {
      setLoading(true);
      setError(null);

      const code = searchParams.get("code");
      if (!code && !otp) return;

      const url =
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/` +
        (otp ? `?otp_token=${otp}` : `?code=${code}`);

      console.log("Making request to:", url); // Debug log

      const authResponse = await fetch(url, {
        credentials: "include",
      });

      const data = await authResponse.json();
      console.log("Auth response:", data); // Debug log
      if (data?.data?.access) {
        localStorage.setItem("access", data.data.access);
      }
      if (data.requires_2fa) {
        setRequires2FA(true);
        if (data.qr_code) {
          setQrCodeUrl(data.qr_code);
        }
        return;
      }

      if (!authResponse.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      router.push("/Game");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "error auth: ",
        description: error.message,
      });
      router.push("/Login");
      console.log("Auth error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission
    authCalled.current = false; // Reset to allow another attempt
    await auth(otpToken);
  };

  useEffect(() => {
    if (pathname === "/42auth") {
      auth();
    }
  }, [pathname]);

  if (requires2FA) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md space-y-4">
          <h2 className="text-2xl font-bold text-center">
            Two-Factor Authentication
          </h2>
          <form onSubmit={handleOTPSubmit} className="space-y-4">
            {/* <p className="text-center text-gray-600">
                            Please enter your authentication code
                        </p>
                        <Input
                            type="text"
                            value={otpToken}
                            onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            className="text-center text-2xl tracking-[0.5em]"
                        /> */}

            <div className="space-y-10 flex items-center justify-around">
              <div className="flex-row items-center justify-center text-primary">
                {/* <Label htmlFor="token">Verification Code</Label> */}
                <p>
                Please enter your authentication code
                </p>
                <InputOTP
                  id="token"
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={otpToken}
                  onChange={(value) => {
                    // Ensure only numeric values are allowed
                    // const numericValue = value.replace(/[^\d]/g, '');
                    // if (numericValue.length <= 6) {
                    setOtpToken(value);
                    console.log(value);
                    // }
                  }}
                  className="justify-center" // Center the OTP input
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading || otpToken.length !== 6}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
            {error && <p className="text-red-500 text-center">{error}</p>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <span className="loading loading-spinner loading-lg"></span>
    </div>
  );
};

// Main component wrapped with Suspense
const Page = () => {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      }
    >
      <AuthComponent />
    </Suspense>
  );
};

export default Page;
