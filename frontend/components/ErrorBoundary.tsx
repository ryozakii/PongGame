import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
interface ErrorBoundaryProps {
    children: React.ReactNode;
   }
   
   export const ErrorBoundary = ({ children }: ErrorBoundaryProps) => {
    const [hasError, setHasError] = useState(false);
   
    useEffect(() => {
      const checkHealth = async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/health-check`);
          if (!response.ok) throw new Error();
        } catch {
          setHasError(true);
        }
      };
      checkHealth();
    }, []);
   
    if (hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Alert variant="destructive" className="max-w-lg">
            <AlertTitle>API Connection Error</AlertTitle>
            <AlertDescription>
              Unable to connect to the server. Please check your connection or try again later.
            </AlertDescription>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Retry Connection
            </Button>
          </Alert>
        </div>
      );
    }
   
    return <>{children}</>;
   };