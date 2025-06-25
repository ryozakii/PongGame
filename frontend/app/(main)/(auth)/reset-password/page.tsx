"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApi } from "@/hooks/useApi";
import { ApiResponse } from "@type/type";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface RestpasswordData {
  access?: string;
  requires_2fa?: boolean;
  qr_code?: string;
}

const restpasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type RestpasswordFormData = z.infer<typeof restpasswordSchema>;

const RestpasswordPage: React.FC = () => {
  const router = useRouter();
  const { callApi, loading, error } = useApi<RestpasswordData>();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<RestpasswordFormData>({
    resolver: zodResolver(restpasswordSchema)
  });

  const onSubmit = async (data: RestpasswordFormData) => {
    try {
      const response = await callApi("/api/request-reset-password", {
        method: "POST",
        mode: 'cors',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
        }),
      });
      
    } catch (err) {
      if (err instanceof Error) {
        console.log("Restpassword error:", err.message);
      } else {
        console.log("Unexpected error:", err);
      }
    }
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>
           Rest Password
        </CardTitle>
      </CardHeader>
      
      <CardContent>
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
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                Rest Password
            </Button>
            </div>
            </form>
      </CardContent>
    </Card>
  );
};

export default RestpasswordPage;