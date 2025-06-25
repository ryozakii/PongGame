"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

export const TwoFactorSettings = () => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [otpSecret, setOtpSecret] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [error, setError] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch current 2FA status
    const fetchStatus = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/2fa/status/`,
          {
            credentials: "include",
          }
        );
        const data = await response.json();
        console.log("data", data);
        setIs2FAEnabled(data.is_2fa_enabled);
      } catch (error) {
        console.error("Error fetching 2FA status:", error);
      }
    };
    fetchStatus();
  }, []);

  const initiate2FASetup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/2fa/enable/`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      console.log(response);
      if (!response.ok) throw new Error("Failed to initiate 2FA setup");

      const data = await response.json();
      setQrCodeUrl(data.qr_code);
      setOtpSecret(data.secret);
      setError("");
    } catch (error) {
      setError("Failed to initiate 2FA setup");
    } finally {
      setIsLoading(false);
    }
  };

  const enable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate token format
    if (!/^\d{6}$/.test(otpToken)) {
      setError("Please enter a valid 6-digit code");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/2fa/enable/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ otp_code: otpToken }),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify code");
      }

      setIs2FAEnabled(true);
      setBackupCodes(data.backup_codes || []);
      setShowBackupCodes(true);
      setError("");
      setOtpToken("");
    } catch (error) {
      console.error("Error enabling 2FA:", error);
      setError(
        error instanceof Error ? error.message : "Failed to verify code"
      );
    } finally {
      setIsLoading(false);
    }
  };
  const disable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/2fa/disable/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ otp_code: otpToken }),
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("Failed to disable 2FA");

      setIs2FAEnabled(false);
      setOtpToken("");
      setQrCodeUrl("");
      setError("");
    } catch (error) {
      setError("Failed to disable 2FA");
    } finally {
      setIsLoading(false);
    }
  };
  console.log("is2FAEnabled", is2FAEnabled);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {!is2FAEnabled ? (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                Enable Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-500">
                Protect your account with 2FA using an authenticator app.
              </p>
              {!qrCodeUrl ? (
                <Button onClick={initiate2FASetup} disabled={isLoading}>
                  {isLoading ? "Setting up..." : "Set up 2FA"}
                </Button>
              ) : (
                <form onSubmit={enable2FA} className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="relative w-[200px] h-[200px]">
                        {qrCodeUrl && (
                          <Image
                            src={
                              qrCodeUrl.startsWith("data:image")
                                ? qrCodeUrl
                                : `data:image/png;base64,${qrCodeUrl}`
                            }
                            alt="2FA QR Code"
                            width={200}
                            height={200}
                            style={{ objectFit: "contain" }}
                            priority
                          />
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm mb-2">
                        Secret key (if QR code doesn't work):
                      </p>
                      <code className="bg-gray-100 p-2 rounded text-sm font-mono">
                        {otpSecret}
                      </code>
                    </div>
                    {/* <div className="space-y-2">
                      <Label htmlFor="token">Verification Code</Label>
                      <Input
                        id="token"
                        placeholder="Enter 6-digit code"
                        value={otpToken}
                        onChange={(e) => {
 
                        const value = e.target.value.replace(/[^\d]/g, '');
                        if (value.length <= 6) {
                            setOtpToken(value);
                        }
                        }}
                        maxLength={6}
                        pattern="\d{6}"
                        inputMode="numeric"
                        className="text-center"
                        />
                    </div> */}
                    <div className="space-y-10 flex items-center justify-around">
                      <div className="flex-row items-center justify-center text-primary">
                        <Label htmlFor="token">Verification Code</Label>
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
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || otpToken.length !== 6}
                  >
                    {isLoading ? "Verifying..." : "Verify and Enable"}
                  </Button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Two-factor authentication is enabled for your account.
              </AlertDescription>
            </Alert>
            <form onSubmit={disable2FA} className="space-y-4">
              {/* <div className="space-y-2">
                <Label htmlFor="disable-token">Enter Code to Disable 2FA</Label>
                <Input
                  id="disable-token"
                  placeholder="Enter 6-digit code"
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value)}
                  maxLength={6}
                  className="text-center"
                />
              </div> */}
              <div className="space-y-10 flex items-center justify-around">
                <div className="flex-row items-center justify-center text-primary">
                  <Label htmlFor="disable-token">Enter Code to Disable 2FA</Label>
                  <InputOTP
                    id="disable-token"
                    maxLength={6}
                    pattern={REGEXP_ONLY_DIGITS}
                    value={otpToken}
                    onChange={(value) => {
                      // Ensure only numeric values are allowed
                      // const numericValue = value.replace(/[^\d]/g, '');
                      // if (numericValue.length <= 6) {
                      setOtpToken(value);
                      // console.log(value);
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
                variant="destructive"
                className="w-full"
                disabled={isLoading || otpToken.length !== 6}
              >
                {isLoading ? "Disabling..." : "Disable 2FA"}
              </Button>
            </form>
          </div>
        )}

        {showBackupCodes && backupCodes.length > 0 && (
          <div className="space-y-4 mt-8">
            <h4 className="font-medium">Backup Codes</h4>
            <Alert className="bg-yellow-50">
              <AlertDescription className="text-yellow-800">
                Save these backup codes in a secure place. Each code can be used
                once to access your account if you lose your authenticator
                device.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <code
                  key={index}
                  className="bg-gray-100 p-2 rounded text-center font-mono text-sm"
                >
                  {code}
                </code>
              ))}
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};
