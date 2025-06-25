import { useState, useEffect } from 'react';

// Define the shape of the user data
interface User {
  id: number;
  name: string;
  email: string;
  [key: string]: any; // Optional for additional properties
}

interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const useUser = (apiUrl: string): UseUserReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(apiUrl, { credentials: 'include' });

        if (!response.ok) {
          throw new Error(`Failed to fetch user: ${response.statusText}`);
        }

        const userData: User = await response.json();
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [apiUrl]);

  return { user, loading, error };
};

export default useUser;
