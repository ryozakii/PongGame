

'use client'
import React from "react"
import FormInput from "@/components/FormInput"
import LoadingButton from "@/components/LoadingButton"
import { useForm } from "@/hooks/useForm"
import { useApi } from "@/hooks/useApi"
import { z } from "zod"
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SignUpSchema } from "@type/schema"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@components/ui/button"
import { Mail } from "lucide-react"
import Lottie from "lottie-react";
import animationData from "@/assets/lottie/animation4.json";
import style from "@/styles/login_page.module.css";
// Validation schema

type SignUpFormData = z.infer<typeof SignUpSchema>

const Page: React.FC = () => {
  const { formData, handleChange, errors, setErrors } = useForm<SignUpFormData>({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    re_password: "",
  })
  const router = useRouter(); 
  
  const { data, error, loading, callApi } = useApi<{ message: string }>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form data
    const result = SignUpSchema.safeParse(formData)
    if (!result.success) {
      const validationErrors: Record<string, string> = {}
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          validationErrors[err.path[0]] = err.message
        }
      })
      setErrors(validationErrors)
      return
    }
    
    // Make API call
    const data = await callApi("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result.data),
    })
    if (data) {
      router.push("/Login")
    }

  }

  return (
    <div className={style.main}>

  <Card className="w-[350px]">
    <CardHeader>
      <CardTitle>Create an account</CardTitle>
      <CardDescription>Enter your details below to create your account.</CardDescription>
    </CardHeader>
    <CardContent>
    <form onSubmit={handleSubmit}>
    <div className="grid w-full items-center gap-4">
      <FormInput
        id="first_name"
        label="First name"
        placeholder="First name"
        value={formData.first_name}
        onChange={handleChange}
        error={errors.first_name}
      />
      <FormInput
        id="last_name"
        label="Last name"
        placeholder="Last name"
        value={formData.last_name}
        onChange={handleChange}
        error={errors.last_name}
      />
      <FormInput
        id="username"
        label="Username"
        placeholder="Username"
        value={formData.username}
        onChange={handleChange}
        error={errors.username}
      />
      <FormInput
        id="email"
        label="Email"
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
      />
      <FormInput
        id="password"
        label="Password"
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
      />
      <FormInput
        id="re_password"
        label="Confirm Password"
        type="password"
        placeholder="Confirm Password"
        value={formData.re_password}
        onChange={handleChange}
        error={errors.re_password}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {data && <p className="text-green-500 text-sm">{data.message}</p>}
      <LoadingButton type="submit" loading={loading}>
        Sign Up
      </LoadingButton>
      </div>
    </form>
        {data && <p className="text-green-500 text-sm">{data.message}</p>}
        {error && <p className="mt-4 text-center text-red-500">{error}</p>}
      </CardContent>
       <CardFooter>         <div className="flex-col">
          <div className="flex justify-around">
            <Button variant="outline">
               <Mail className="mr-2 h-4 w-4" /> Intra
             </Button>
             <Button variant="outline">
               <Mail className="mr-2 h-4 w-4" /> Google
             </Button>
           </div>
           <div className="flex justify-center items-center space-x-2">
              <span className="text-sm text-gray-500">
              Already have an account?
              </span>
              <Link href="/Login">
                <Button variant="link" className="text-sm">Login
                </Button>
              </Link>
            </div>
         </div>
       </CardFooter>
     </Card>
     <Lottie animationData={animationData} loop autoplay style={{width: 1000, height: 1000}}/>
    </div>
  )
}

export default Page
