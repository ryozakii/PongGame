import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { jwtVerify } from 'jose';
import { createContext } from "react";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function verifyToken(token: string) {
  try {
    // Replace 'your-secret-key' with your actual JWT secret key
    // Make sure to use the same secret key you used to sign the token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY);
    // alert(process.env.JWT_SECRET_KEY)
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

