import { Button } from "./ui/button"


interface ButtonProps {
    type?: "button" | "submit" | "reset"
    disabled?: boolean
    onClick?: () => void
    loading?: boolean
    children: React.ReactNode
  }
  
  const LoadingButton: React.FC<ButtonProps> = ({ type = "button", disabled, loading, children, ...props }) => {
    return (
      <Button type={type} disabled={disabled || loading} {...props}>
        {loading ? "Loading..." : children}
      </Button>
    )
  }
  
  export default LoadingButton
  