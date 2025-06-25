import { useState,useEffect } from "react";

import "../app/template/test.css";

export default function GameInfo({message,Opponent,playerType}) {
    const [User, setUser] = useState(null);
    console.log("fetching")
    useEffect(() => {
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
    // console.log(Opponent)
    let imgStyle = "rounded border-[1px] border-black    w-[20%] min-w-[50px]  min-h-[50px] aspect-square ";
    let mainStyle = "flex   items-center h-[10%] w-[100%] ";
    let name1Style = " text-center  pt-[4px] text-sm md:text-lg lg:text-xl ";
    let messageStyle = "   w-[60%] h-[5%] grow text-center text-xl md:text-2xl lg:text-4xl select-none";
    let name2Style = "  text-center  pt-[4px] text-sm md:text-lg lg:text-xl";
    let containerStyle = "w-[100%] whitespace-nowrap z-10 flex flex-col items-center justify-center";
    return(
      <main className={mainStyle}>
        {
          playerType == 'player1' && 
          <>
      <div className={containerStyle}><img src={User?.image && `${process.env.NEXT_PUBLIC_API_BASE_URL}${User.image}` || '/images/unknown.png'} className={imgStyle}></img><div className={name1Style}>{User?.username || 'you'}</div></div>
      <div className={messageStyle}>{message}</div>
      <div className={`${containerStyle} `}><img src={Opponent?.image && `${process.env.NEXT_PUBLIC_API_BASE_URL}${Opponent.image}` || '/images/unknown.png'} className={imgStyle}></img><div className={name2Style}>{Opponent?.username || 'Opponent'}</div></div>
      </>
        }
        {
          playerType == 'player2' && 
          <>
      <div className={`${containerStyle} `}><img src={Opponent?.image && `${process.env.NEXT_PUBLIC_API_BASE_URL}${Opponent.image}` || '/images/unknown.png'} className={imgStyle}></img><div className={name2Style}>{Opponent?.username || 'Opponent'}</div></div>
      <div className={messageStyle}>{message}</div>
      <div className={containerStyle}><img src={User?.image && `${process.env.NEXT_PUBLIC_API_BASE_URL}${User.image}` || '/images/unknown.png'} className={imgStyle}></img><div className={name1Style}>{User?.username || 'you'}</div></div>
      </>
        }        
    </main>
    )
  }