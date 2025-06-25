import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import nookies from 'nookies';

const useAuth = () => {
  const [isClient, setIsClient] = useState(false); // Track client-side rendering
  const router = useRouter();

  useEffect(() => {
    setIsClient(true); // Set to true after the component mounts
  }, []);

  useEffect(() => {
    if (!isClient) return; // Only run after client-side rendering

    const cookies = nookies.get();
    const token = cookies.authToken;

    if (!token) {
      router.push('/login'); // Redirect if no token found
    }
  }, [isClient, router]); // Trigger when client-side state or router changes
};

export default useAuth;
