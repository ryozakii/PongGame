import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormInputProps } from "@type/type"



const FormInput: React.FC<FormInputProps> = ({
  id,
  label,
  type = "text",
  value,
  placeholder,
  error,
  onChange,
}) => {
  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} placeholder={placeholder} value={value} onChange={onChange} />
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  )
}

export default FormInput