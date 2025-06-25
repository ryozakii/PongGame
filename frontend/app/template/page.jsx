'use client'
import { useState,useEffect } from "react";
import Link from "next/link";
import "./test.css";




function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  let navStyle = "select-none flex h-[5vh] mb-[10vh] border-[1px] border-black ";
  let navElementsStyle = "bg-white max-[800px]:hidden select-none text-black no-underline grow flex justify-center items-center hover:border-2 hover:border-black cursor-pointer text-sm md:text-lg lg:text-xl";
  

  let navMenu = "min-[800px]:hidden  select-none text-black no-underline  grow flex justify-center items-center hover:border-2 hover:border-black cursor-pointer text-sm md:text-lg lg:text-xl max[800]:text-lg";

  const clickDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  }
  let menuStyle = "absolute top-[5vh] left-0  border-2 border-black   w-full";
  let menuElementsStyle = "bg-white border-[1px] border-black h-[5vh] select-none  no-underline grow flex justify-center items-center hover:border-[2px] hover:border-black cursor-pointer text-sm md:text-lg lg:text-xl";
  return (
    <main className={navStyle}>
    <Link href="/" className={navElementsStyle}>HOME</Link>
    <Link href="/dashboard" className={navElementsStyle}>DASHBOARD</Link>
    <Link href="/chat" className={navElementsStyle}>CHAT</Link>
    <Link href="/tictac" className={navElementsStyle}>TIC-TAC</Link>
    <Link href="/blank1" className={navElementsStyle}>PING-PONG</Link>
    <Link href="/Signup" className={navElementsStyle}>SIGN UP</Link>
    <Link href="/Login" className={navElementsStyle}>LOGIN</Link>

    <div className={navMenu} onClick={clickDropdown}>MENU<img src={`${isDropdownOpen ? '/images/arrow-up.png' : '/images/arrow-down.png'}`} className="nav-arrow"></img></div>
    {isDropdownOpen && (
      <div className={menuStyle}>
    <Link href="/" className={menuElementsStyle}>HOME</Link>
    <Link href="/dashboard" className={menuElementsStyle}>DASHBOARD</Link>
    <Link href="/chat" className={menuElementsStyle}>CHAT</Link>
    <Link href="/tictac" className={menuElementsStyle}>TIC-TAC</Link>
    <Link href="/blank1" className={menuElementsStyle}>PING-PONG</Link>
    <Link href="/Signup" className={menuElementsStyle}>SIGN UP</Link>
    <Link href="/Login" className={menuElementsStyle}>LOGIN</Link>
      </div>
    )}
  </main>
  )
}


function GameInfo({message,Opponent}) {
  const [User, setUser] = useState(null);
  useEffect(() => {
    console.log("fetching")
    const fetchData = async () => {
      try {
        setUser(await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/`, {
          method: "GET",
          credentials: "include", // Ensures cookies are sent
        }).then((res) =>  res.json()))
        

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        console.log("what") 
        // const u = response;
        // setUser(response);
      } catch (err) {
      }
    };

    fetchData();
    return () => {
      // if ((socketRef.current != null)
      // &&(socketRef.current.readyState === WebSocket.OPEN))
      //   socketRef.current.close();
    }
  },[]);
  let imgStyle = "rounded image-fit border-[1px] border-black";
  let mainStyle = "flex  justify-around items-center h-[5vh]";
  let name1Style = "self-start pl-[10px] pt-[4px] text-sm md:text-lg lg:text-xl";
  let name2Style = "self-start pr-[10px] pt-[4px] text-sm md:text-lg lg:text-xl";
  return(
    <main className={mainStyle}>
    <img src={User?.image || '/images/unknown.png'} className={imgStyle}></img>
    <div className={name1Style}>{User?.username || 'you'}</div>
    <div className="grow text-center">{message}</div>
    <div className={name2Style}>{Opponent?.username || 'Opponent'}</div>
    <img src={Opponent?.image || '/images/unknown.png'} className={imgStyle}></img>
  </main>
  )
}

export default function Main() {
  // Define styles

  
  let gameMenuStyle = "select-none flex h-[5vh] mb-[10vh] border-2 border-black rounded";
  let gameMenuElementsStyle = "select-none text-black no-underline bg-green-500 grow flex justify-center items-center hover:border-2 hover:border-black cursor-pointer text-sm md:text-lg lg:text-xl";


  return (
    <>
      {/* Navigation bar */}
      {/* Player status */}
      <Navbar />
      <GameInfo message="vs" />

      {/* Main content */}
      <main className="flex border-2 justify-around items-center h-[50vh]">
        main content
      </main>

      {/* Start game menu */}
      <main className={gameMenuStyle}>
        <div className={gameMenuElementsStyle}>start game</div>
      </main>
    </>
  );
}