import { ApiResponse, UseApiResponse } from "@type/type"
import { useState } from "react"

export function useApi<T>(): UseApiResponse<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  // const handleApiErrorr = (error: any): string => {
  //   if (typeof error === 'string') return error;
  //   if (error?.message) return error.message;
  //   if (error?.error) return error.error;
  //   if (Array.isArray(error)) return error[0];
  //   return 'An unexpected error occurred';
  // };
  const handleApiError = async (response: ApiResponse<T>) => {
    try {
      console.log("res",response);
      // const response = await response.json();
      if (typeof response === 'string') return response;
      if (response?.message) return response.message;
      if (response?.error) return response.error;
      return Object.values(response)[0] as string;
    } catch {
      return 'Failed to process server response';
    }
  }

  const callApi = async (
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T> | null> => {
    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`;
    console.log("url",url);
    
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(url, options);
      const isJson = response.headers.get('content-type')?.includes('application/json');
      
      if (!isJson) {
        throw new Error('Server configuration error. Please check API settings.');
      }
      console.log(response);
      const result: ApiResponse<T> = await response.json();
      // console.log("result",result);
      
      if (!response.ok) {
        const errorMessage = await handleApiError(result);
        throw new Error(errorMessage);
      }

      setData(result.data || null);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw errorMessage;
    } finally {
      setLoading(false);
    }
  };

  return { data, error, loading, callApi };
}