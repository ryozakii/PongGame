'use client'
import SideBar from '@components/side_bar'
import NavBar from '@components/nav_bar'
import { usePathname } from 'next/navigation';
import { UserContext } from '@hooks/useContext';
import useSWR from 'swr';
import { Suspense, use } from "react";
import { useEffect,useRef,useState,useContext,useMemo } from 'react';
import Notification from "@/components/notification";
export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const fetcher = (url) => fetch(url,{
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
  }).then((res) => res.json());
  const socketRef = useRef(null);
  const [reconnect, setReconnect] = useState(1);
  const [update,setUpdate] = useState(0)
  const [notifs,setNotifs] = useState({count : 0,notifications : []});
  useEffect(() => {
    if (socketRef.current != null) {
      return;
    }
    socketRef.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_BASE_URL}/ws/notification/`, ['json', localStorage.getItem("access")]);
    const ws = socketRef.current;
    ws.onopen = () => {
      console.log('connected');
    };
    ws.onmessage = (e) => {
      console.log('message', e.data);
      const data = JSON.parse(e.data);
      console.log('abv12',data)
      setNotifs(data);
    };
    ws.onclose = () => {
      console.log('disconnected');
      //create event to reconnect
      setTimeout(() => {
      setReconnect((prev) => prev + 1);
      }, 1000);
      // automatically try to reconnect on connection loss
      socketRef.current = null;
    };
    console.log("MainLayout useEffect")
    return () => {
      if (socketRef.current != null) {
        socketRef.current.close();
        socketRef.current = null;
      }
    }

  }, [reconnect]);




  let c1 = useMemo(() =>
    {
      return (
            <UserContext.Provider value = {{update,setUpdate  }}>
            <Suspense fallback={<div>Loading...</div>}>
              {children}
              </Suspense>
              </UserContext.Provider> 
      );
    },[]);
  // console.log("MainLayout")
  // const { data, error } = useSWR(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/`, fetcher);
  return (
<UserContext.Provider value={{ IsUpdated: false }}>
        <div className='flex w-full min-h-screen bg-background'>
          {/* Sidebar - hidden on smaller screens */}
          <div className='max-[1100px]:hidden z-[101]'>
            <SideBar />
          </div>
          
          {/* Main content area */}
          <div className='flex-1 flex flex-col min-h-screen'>
            {/* Navbar */}
            <div className='h-[100px] w-full border-b border-border z-[100]'>
              <NavBar notifications={notifs}/>
              {/* <Notification test={socketRef}></Notification> */}
            </div>
            
            {/* Page content */}
            <div className='flex-1 flex justify-center items-center p-6'>
{c1}
            </div>
          </div>
        </div>
    </UserContext.Provider>
  );
}