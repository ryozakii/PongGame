

// lib/withAuth.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { parseCookies } from 'nookies';

export function withAuth(Component) {
  return (props) => {
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();
    
    // Ensure that useRouter is only invoked on the client side
    useEffect(() => {
      setIsClient(true);  // Indicate that we're on the client side
    }, []);

    // If we're not on the client side, return null or a loading spinner
    if (!isClient) {
      return null;
    }

    // Get the cookies on the client side
    const cookies = parseCookies();
    const accessToken = cookies['Authorization'];  // Adjust the cookie name as needed

    // If there's no access token, redirect to login page
    if (!accessToken) {
      router.push('/login');  // Redirect to the login page
      return null;  // Optionally return null while redirecting
    }

    // If authenticated, render the component
    return <Component {...props} />;
  };
}
