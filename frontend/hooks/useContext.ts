
"use client"
import { createContext, useContext } from "react";

export const UserContext = createContext<any | null>(null);
export function useUser() {
  return useContext(UserContext);
}