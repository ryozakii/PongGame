"use client";
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Search, X, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@hooks/useContext";
import { set } from "zod";

export default function Notification({ notifications }) {
  // const notifs = notifications.notifications;
  const [notifs, setNotifs] = useState(notifications.notifications);
  // console.log("Notification")
  // const [notifs, setNotifs] = useState([]);
  const handleClick = async (openState) => {
    if (!openState) {
      setNotifs(notifications.notifications);
    }
    console.log("Notification");
    if (!notifications?.count || notifications.count == 0) return;
    // setTest((prev)=>prev + 1);
    setNotifs(notifications.notifications);
    const resetNotifications = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/notification_reset/`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        if (!response.ok)
          throw new Error(`Failed to fetch online status: ${response.status}`);
        const data = await response.json();
      } catch (error) {
        console.error("Error:", error);
      }
    };
    resetNotifications();
  };
  // console.log('asda',`${process.env.NEXT_PUBLIC_API_BASE_URL}${notifs[0].image}`)
  return (
    <DropdownMenu onOpenChange={handleClick}>
      <DropdownMenuTrigger className="relative z-10">
        <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
        {notifications.count != 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium flex items-center justify-center text-primary-foreground">
            {notifications.count}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 border-2 z-[100]">
        <div className="max-h-[300px] overflow-y-auto z-50">
          {/* <DropdownMenuItem className="flex items-center gap-4 p-4"> */}
          { notifs.length != 0 ? (
            notifs.map((notif, index) => {
              return (
                <DropdownMenuItem
                  className="flex items-center gap-4 p-4"
                  key={index}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${notif.image}`}
                      className=""
                    />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    {notif.href ? (
                      <Link href={notif.href}>
                        <p className="text-sm ">{notif.message}</p>
                      </Link>
                    ) : notif.category == "Friend" ? (
                      <Link href="/Friends">
                        <p className="text-sm ">{notif.message}</p>
                      </Link>
                    ) : (
                      <p className="text-sm ">{notif.message}</p>
                    )}
                    {
                      <p className="text-xs text-muted-foreground  ">
                        {new Date(notif.timestamp).toLocaleString()}
                      </p>
                    }
                  </div>
                </DropdownMenuItem>
              );
            }

          )
        ): (
          <p className="text-sm text-forground text-center">
            No Notifications
          </p>
        )
      }
          {/* </DropdownMenuItem> */}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
