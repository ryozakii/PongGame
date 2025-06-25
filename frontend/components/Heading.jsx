"use client";
import { Button } from "@/components/ui/button";
import {ArrowRight} from "lucide-react"
import Image from 'next/image'
import Link from 'next/link'

export const Heading = () => {
    return (
        <div className="flex flex-col items-center justify-center max-w-7xl border-border  p-12 h-[250px] w-[90vw] rounded">
        <div className="flex items-center">
        <div className="max-w-6xl ">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-primary hover:text-black select-none	">
              Transcendance
            </h1>
            <h3 className=" text-base sm:text-l md:text-xl font-medium mb-3 ">Welcome to Transcendance! Get ready to have fun and showcase your skills in Pong and Tic-Tac-Toe, locally, remotely, or against AI. Why wait? Jump in, play games, chat with friends, and make the most of your time here!
            </h3>
            {/* <div className='center  flex '> */}
            <Link href="/Game" ><div className=' flex h-4 w-[200px] '> <Button className='grow text-[25px] bg-black hover:bg-primary'>Start<ArrowRight className="h-6 w-6 ml-2"/> </Button></div>
        </Link>
        {/* </div> */}
        </div>
        <div className="relative w-[300px] h-[300px] sm:w-[350px] sm:h-[350px] md:h-[400px] md:w-[400px]">
                {/* <Image
                src={test}
                fill
                className="object-contain dark:hidden"
                alt="Document"
                /> */}
        </div>
        </div>
            
        </div>
     );
}