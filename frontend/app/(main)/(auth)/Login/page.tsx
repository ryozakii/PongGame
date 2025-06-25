"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
// import { DotLottieReact } from '@lottiefiles/dotlottie-react';
// import DotLottiePlayer from "@dotlottie/react-player";
import { DotLottiePlayer } from "@dotlottie/react-player";
// import "@dotlottie/react-player/dist/index.css";
import Lottie from "lottie-react";
import animationData from "@/assets/lottie/animation4.json";
import style from "@/styles/login_page.module.css";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

interface LoginData {
  access?: string;
  requires_2fa?: boolean;
  qr_code?: string;
}

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  otp_token: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;
type LoginState = "initial" | "verifying_2fa";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { callApi, loading, error } = useApi<LoginData>();
  const [loginState, setLoginState] = useState<LoginState>("initial");
  const [tempCredentials, setTempCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [otpToken, setOtpToken] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  const onSubmit = async (data: LoginFormData) => {
    try {
      if (loginState === "verifying_2fa") {
        // Attempt 2FA verification
        const response = await callApi("/api/login", {
          method: "POST",
          mode: "cors",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: tempCredentials?.email,
            password: tempCredentials?.password,
            otp_token: otpToken,
          }),
        });

        if (response?.data?.access) {
          localStorage.setItem("access", response.data.access);
          router.push("/Game");
          return;
        }
      }

      // Initial login attempt
      const response = await callApi("/api/login", {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      if (response?.requires_2fa) {
        setLoginState("verifying_2fa");
        setTempCredentials({ email: data.email, password: data.password });
        if (response.qr_code) {
          setQrCodeUrl(response.qr_code);
        }
        return;
      }

      if (response?.data?.access) {
        localStorage.setItem("access", response.data.access);
        const params = new URLSearchParams(window.location.search);
        const redirectTo = "/Game";

        // Force a full page reload to ensure cookie is set
        window.location.href = redirectTo;
      }
    } catch (err) {
      if (err instanceof Error) {
        console.log("Login error:", err.message);
      } else {
        console.log("Unexpected error:", err);
      }
    }
  };

  const resetLogin = () => {
    setLoginState("initial");
    setTempCredentials(null);
    setOtpToken("");
    setQrCodeUrl("");
    reset();
  };

  return (
    <div className={style.main}>
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>
            {loginState === "verifying_2fa"
              ? "Two-Factor Authentication"
              : "Login"}
          </CardTitle>
          {loginState === "verifying_2fa" && (
            <CardDescription>
              Enter the verification code from your authenticator app
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          {loginState === "initial" ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...register("email")}
                    disabled={loading}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    {...register("password")}
                    disabled={loading}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <div className="flex justify-start items-start space-x-2">
                  <span className="text-sm text-gray-500">
                    forget your password?
                  </span>
                  <Button
                    variant="link"
                    type="button"
                    className="text-sm"
                    onClick={() => router.push("/reset-password")}
                    >
                    Reset Password
                  </Button>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                {/* <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otpToken}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpToken(value);
                  }}
                  maxLength={6}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.5em]"
                  disabled={loading}
                  autoComplete="off"
                  autoFocus
                />
                <p className="text-sm text-muted-foreground text-center">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div> */}

                <div className="space-y-10 flex items-center justify-around">
                  <div className="flex-row items-center justify-center text-primary">
                    <Label htmlFor="otp">Verification Code</Label>
                    <InputOTP
                      id="otp"
                      maxLength={6}
                      pattern={REGEXP_ONLY_DIGITS}
                      value={otpToken}
                      onChange={(value) => {
                        // Ensure only numeric values are allowed
                        // const numericValue = value.replace(/[^\d]/g, '');
                        // if (numericValue.length <= 6) {
                        setOtpToken(value);
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

                <div className="space-y-2">
                  <Button
                    onClick={() =>
                      onSubmit({
                        ...tempCredentials!,
                        otp_token: otpToken,
                      } as LoginFormData)
                    }
                    disabled={otpToken.length !== 6 || loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Code"
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={resetLogin}
                    className="w-full"
                    disabled={loading}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        {loginState === "initial" && (
          <CardFooter>
            <div className="w-full space-y-4">
              <div className="flex justify-center space-x-4">
                <Button variant="outline" asChild>
                  <Link href={process.env.NEXT_PUBLIC_42_AUTH_URL || "#"}>
                    <Mail className="mr-2 h-4 w-8" />
                    42 Login
                  </Link>
                </Button>
              </div>
              <div className="flex justify-center items-center space-x-2">
                <span className="text-sm text-gray-500">
                  Don't have an account?
                </span>
                <Link href="/Signup">
                  <Button variant="link" className="text-sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
      <Lottie
        animationData={animationData}
        loop
        autoplay
        style={{ height: 1000, width: 800 }}
      />
    </div>
  );
};

export default LoginPage;

//setTempCredentials({ email: data.email, password: data.password });
