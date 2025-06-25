import { useState } from "react"

export function useForm<T>(initialState: T) {
  const [formData, setFormData] = useState<T>(initialState)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
    setErrors((prev) => ({ ...prev, [e.target.id]: undefined }))
  }

  return { formData, setFormData, errors, setErrors, handleChange }
}
