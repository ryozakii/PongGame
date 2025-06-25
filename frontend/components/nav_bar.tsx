import React, { useState, useEffect, useRef, useContext } from "react";
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
import Notification from "@/components/notification";
import { UserContext, useUser } from "@hooks/useContext";

interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  image: string;
}

export default function NavBar({ notifications }) {
  const [users, setUsers] = useState<User[]>([]);
  const [userFilter, setUserFilter] = useState<User[]>([]);
  const [value, setValue] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const userGlobal = useUser();
  const { update, setUpdate } = useContext(UserContext);
  useEffect(() => {
    const fetchCurrentUser = async () => {
      console.log("updated");

      // console.log(process.env)
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/current-user/`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch current user: ${response.status}`);
        }

        const data = await response.json();
        setCurrentUser(data); // Set the current user data
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();
  }, [userGlobal, update]);

  // Fetch all users
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/all-users/`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.status}`);
        }

        const data = await response.json();
        setUsers(data); // Set all users data
        setUserFilter(data); // Initialize filter with all users
      } catch (error) {
        console.error("Error fetching all users:", error);
      }
    };

    fetchAllUsers();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/logout/`,
        {
          method: "GET", // Using GET since that's what your API expects
          credentials: "include", // Important for cookies
        }
      );

      if (response.ok) {
        localStorage.clear();
        router.push("/login");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };
  // Filter users dynamically
  const filterUsers = (input: string) => {
    const filtered = users.filter(
      (user) =>
        user.username?.toLowerCase().includes(input.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(input.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(input.toLowerCase())
    );
    setUserFilter(filtered);
  };

  return (
    <div className="h-full w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-0">
      <div className="flex h-full items-center px-6 justify-between  relative z-0">
        {/* Search Section */}
        <div className="relative flex-1 max-w-md " ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="w-full pl-9 pr-4 py-2 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
              placeholder="Search users..."
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                filterUsers(e.target.value);
              }}
            />
            {value && (
              <button
                onClick={() => setValue("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {value && userFilter.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-background rounded-lg border border-border shadow-lg overflow-hidden">
              {userFilter.map((user) => (
                <Link
                  key={user.id}
                  href={{
                    pathname: "/profile",
                    query: { userId: user.id?.toString() },
                  }}
                  onClick={() => setValue("")}
                  className="block hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3 p-3">
                    <Avatar className="h-8 w-8 border-2 border-primary">
                      {user.image ? (
                        <AvatarImage
                          src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${user.image}`}
                          alt={user.username}
                        />
                      ) : (
                        <AvatarFallback>
                          {/* {user.username[0].toUpperCase()} */}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">{`${user.username}`}</p>
                      {/* <p className="text-xs text-muted-foreground">@{user.username}</p> */}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4 relative">
          {" "}
          {/* Removed h-16 */}
          <div className="absolute right-0 flex items-center gap-4">
            {" "}
            {/* Added wrapper */}
            <Notification notifications={notifications} />
            {currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-muted p-2 rounded-lg transition-colors z-10">
                  <Avatar className="h-10 w-10 border-2 border-primary">
                    {currentUser.image ? (
                      <AvatarImage
                        src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${currentUser.image}`}
                        alt={currentUser.username}
                      />
                    ) : (
                      <AvatarFallback>
                        {currentUser.username[0].toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium leading-none">{`${currentUser.username}`}</p>
                    {/* <p className="text-xs text-muted-foreground">online</p> */}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 mt-2 rounded-md border bg-popover p-1 shadow-md z-[100]"
                >
                  <DropdownMenuLabel className="px-2 py-1.5 text-sm font-semibold">
                    My Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-1 h-px bg-border" />
                  <DropdownMenuItem className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent">
                    <Link
                      href={{
                        pathname: "/profile",
                        query: { userId: currentUser.id?.toString() },
                      }}
                    >
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none text-destructive transition-colors hover:bg-accent"
                    onClick={handleLogout}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
