"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import "./test.css";
// import 'bootstrap/dist/css/bootstrap.min.css';
import Link from 'next/link';
// import { useRouter } from 'next/compat/router'
import { Suspense } from "react";

import { set } from "zod";
import GameInfo from "@components/gameInfo";

import {useSearchParams} from 'next/navigation';
const GameState = {
    GAME_IN_PROGRESS : 1,
    GAME_ENDED : 2,
    GAME_NOT_STARTED : 3
}

const tic_tac = {turn : false, logo : "", table : ['','','','','','','','',''], combo : "", winner : "",state : GameState.GAME_NOT_STARTED, cls : '', message : 'Tic Tac Toe'}


function Table({game, socketRef})
{
  let tableStyle = `wrapper rounded active:border-2 p-1 border-black   aspect-square	 gap-1 cursor-pointer w-60 md:w-[420px]  2xl:w-[620px] ${socketRef.current && game.logo != '' && ((game.winner == game.logo ? 'bg-blue-500' : (game.winner == 'draw' ? 'bg-gray-500' : ( game?.winner ? 'bg-red-500' : (game.turn ? 'bg-blue-500' : 'bg-gray-500'))) )) || 'bg-black'} `
  let blockStyle = "md:text-5xl 2xl:text-8xl   select-none rounded   flex justify-center items-center 		align-text-bottom		 text-4xl font-black  active:border-[3px] 	border-black "
  console.log("logo = ",game.logo , "end")
  return (
    <>
    <div className= {tableStyle} >
    { Array(9).fill(0).map((current, index) => (
    <div onClick = { () => {game.turn && game.table[index] == '' && socketRef.current != null && socketRef.current.send(JSON.stringify({"index" : index}))}} key={index} className={ `${(game.combo.includes(index) ? (game.winner == game.logo ? 'bg-blue-300 ' : 'bg-red-300') : 'bg-white')} ${blockStyle} ${(game?.winner || game.logo == "" || game.table[index] != '') ?  "" : (game.logo == 'X'  ? "x-hover" : "o-hover")}`} >
      {game.table[index]}
    </div>
  ))}
    </div>
    </>
  )
}

export default function TicTac() {
  const hash = useSearchParams().get('hash');
  const socketRef = useRef(null);
  const [game, setgame] = useState(tic_tac);
  const [Play, setPlay] = useState(false);
  // let xx2 = 
  let xx = '   select-none  flex rounded	border-black  font-black   justify-center items-center   border-[2px] text-1xl md:text-3xl 2xl:text-5xl 2xl:border-[6px] aspect-[6/1] '
  // let xx1 = 'select-none  rounded	border-black  font-black  flex justify-center items-center  size-10/12 h-10 w-48	 border-[2px] text-1xl md:text-3xl  2xl:text-5xl 2xl:border-[4px]    md:h-12 2xl:h-16 md:w-[340px]  2xl:w-[540px]'
  let xx1 = 'select-none  flex rounded	border-black  font-black   justify-center items-center   border-[2px] text-1xl md:text-3xl 2xl:text-5xl 2xl:border-[6px] aspect-[1/1]'
  useEffect(() => {
  
    return () => {
      if (socketRef.current != null)
        socketRef.current.close();
      // console.log("closingqweqweqweq")
    }
  },[]);
  let start_game_button = () => {
    if (socketRef.current != null)
      {
        if (game.state == GameState.GAME_NOT_STARTED)
        {
          socketRef.current.close();
          socketRef.current = null;
          setPlay(false)
          return ;
        }
      
          return ;
      }
      setPlay(true)
      setgame(tic_tac)
      // require('.env').config();
      console.log("log ",process.env.NEXT_PUBLIC_WS_BASE_URL)
      if (hash)
        {
          socketRef.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_BASE_URL}/ws/tic_tac/${hash}/`,['json',localStorage.getItem("access")]);
        }
      else
      socketRef.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_BASE_URL}/ws/tic_tac/`,['json',localStorage.getItem("access")]);
      socketRef.current.onopen = () => console.log("WebSocket connection established!");
      socketRef.current.onclose = () => {socketRef.current = null;setPlay(false);console.log("WebSocket connection closed!"); };
      socketRef.current.onmessage = (event) => {
        let data = JSON.parse(event.data)
        
        switch (data.type)
        {
          case 'start':
            setgame((prev) => {
              let x = {...prev, ...data}
              if (x['turn'])
                x['message'] = "your turn!" 
              else 
                x['message'] = "opponent's turn."
              return x}
            );
            break;
          case 'play':
            setgame((prev) => {
              let x = {...prev, ...data}
                if (x['turn'])
                  x['message'] = "your turn!" 
                else 
                  x['message'] = "opponent's turn."
              return x}
            );
            break;
          case 'end':
            setgame((prev) => {
              let x = {...prev, ...data}
              x['message'] = `${x['winner'] == x['logo'] ? 'you win!' : (x['winner'] == 'draw' ? 'draw' : 'you lose')}`
              x['cls'] =  x['winner'] == x.logo ? 'bg-blue-500' : (x.winner != 'DRAW') ? 'bg-red-500' : 'bg-gray-500'
              return x}
            );
            setPlay(false)
            if ((socketRef.current != null)
              && (socketRef.current.readyState === WebSocket.OPEN))
              socketRef.current.close()
            break;
        }
  }
}
  console.log("llgame",game);
  let c1 = useMemo(() => {
    return <GameInfo message={game.message} Opponent={game.player2} playerType = {'player1'}/>
  }, [Play, game.player2, game.message]);
  let gameMenuStyle = ` ${Play && game.logo != '' ? 'hidden' : ''} select-none flex  border-2 border-black rounded w-60 md:w-[420px]  2xl:w-[620px] text-1xl md:text-3xl 2xl:text-5xl 2xl:border-[6px] aspect-[8/1]`
  let gameMenuElementsStyle = ` ${Play && game.logo == '' ?  'dots ' : ''} ${Play && game.logo != '' ? 'hidden' : ''} active:border-[1px] select-none text-black no-underline bg-black  text-white grow flex justify-center items-center hover:border-2 hover:border-black cursor-pointer text-xl md:text-2xl lg:text-4xl  hover:text-2xl hover:md:text-3xl hover:lg:text-5xl `;
  let timerStyle = `${Play && game.logo != '' ? '' : 'hidden'} text-center select-none   border-2 border-black rounded w-60 md:w-[420px]  2xl:w-[620px] text-1xl md:text-3xl 2xl:text-5xl 2xl:border-[6px] aspect-[6/1] `
  let gameMenuButtonPress = start_game_button;
  useEffect(() => {
    if (hash)
  gameMenuButtonPress();
  },[hash]);
  return (
    <Suspense fallback={<div>Loading...</div>}>
        <main className="flex content-center  items-center flex-col gap-2 w-[90%] mt-[50px] ">
        <div className='z-0 relative'>{c1}</div> 
            <Table game={game} socketRef={socketRef} />
            <main className={gameMenuStyle } >
            <div className={gameMenuElementsStyle} onClick = {gameMenuButtonPress}>{Play ? '' : "Find Game"} </div>
            </main>
            {/* <div id='tools' className={` pl-[2%] pr-[2%] wrapper1 rounded  sm:mb-2 md:mb-4 2xl:mb-6   max-[620px]:gap-1 sm:gap-1 md:gap-3 2xl:gap-5 w-60 md:w-[420px]  2xl:w-[620px] cursor-pointer  `} > */}
            <div  className={`${timerStyle} ${game.logo == '' || !game.turn ? 'bg-gray-400' : 'bg-white	'} ` }>Timer<br></br>{ game.logo != '' && socketRef.current && <CountdownTimer start={10} end={0} message = {game} /> || '00'} </div>
            
            {/* </div> */}
            {/* <div id='tools' className={`  wrapper2 rounded  sm:mb-2 md:mb-4 2xl:mb-6   max-[620px]:gap-1 sm:gap-1 md:gap-3 2xl:gap-5 w-60 md:w-[420px]  2xl:w-[620px] cursor-pointer  `} > */}
              {/* <div  className={`${xx} bg-white` }>{`${game.user1?.user && game.user1.user || '' }  vs  ${game.user2?.user && game.user2.user || '' }`}</div> */}
            {/* </div>  */}
        </main>
        </Suspense>
  )
    }

const CountdownTimer = ({ start, end,message }) => {
  // Initialize the state with the start value
  const [timeLeft, setTimeLeft] = useState(start);
  const timer = useRef(null);
  useEffect(() => {
  timer.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= end)
        {
          clearInterval(timer.current)
          timer.current = null
          return prev
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timer.current)
        clearInterval(timer.current)
    }
},[]);
useEffect(() => {
  if (message.message != 'your turn!' && message.message != "opponent's turn.")
    {
      if (message.message != 'Tic Tac Toe')
      {
        if (timer.current)
          clearInterval(timer.current)
      
        setTimeLeft(0)
      }
      return ;
    }
  clearInterval(timer.current)
  setTimeLeft(start)
  timer.current = setInterval(() => {
    // setTimeLeft(10)
    setTimeLeft((prev) => {
      if (prev <= end)
      {
        clearInterval(timer.current)
        timer.current = null
        return prev
      }
      return prev - 1
    })
  }, 1000)
}, [message.message]);

  return (
    <>
     {timeLeft.toString().padStart(2, '0')}
    </>
  );
};

// export default function Example() {
  
// }
