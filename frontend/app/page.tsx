"use client"
import Image from 'next/image'
import logo from '@assets/icons/ping-pong_1.png'
import style from '@styles/home_page.module.css'
import test from '@assets/images/test.png'
import test1 from '@assets/images/test1.png'
import test2 from '@assets/images/test2.png'
import {Heading } from '@components/Heading';
import { cn, verifyToken } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from 'next/link'
import { useScrollTop } from "@/hooks/use-scroll-top";
import Cookies from 'js-cookie';
//cn(`${style.nav_bar} fixed top-0`, scrolled && "border-b shadow-sm") ${style.header} ${style.container}

function home_page() {
    const scrolled = useScrollTop();
    const token = Cookies.get('authToken');
    const payload = verifyToken(token);
    
  return (
	<div className={`h-full ${style.home_page}`}>
		<div className = {cn(`${style.header} ${style.container} bg-background z-10 fixed top-0 p-4`, scrolled && "border-b shadow-sm")}>
            <div></div>
			{!payload && <div className={`${style.header__btns}`}>
            <Button className='hover:bg-black'>

				<Link href="/Signup " >Sign up </Link>
            </Button>
            <Button className='hover:bg-black'>

				<Link href="/Login"  >Log in</Link>
            </Button>
			</div>}
		</div>
        <main className='h-full pt-40'>
		<Heading/>
        <div className="flex flex-col items-center justify-center max-w-6xl">
        <div className="flex items-center">            
        </div>
    </div> 
    </main>
    {/* <Footer/> */}
	</div>
  )
}

export default home_page