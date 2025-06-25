"use client";
import React, { useState, useEffect, useRef, use } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import useAuth from "@hooks/useAuth";
import Link from 'next/link';
import Lottie from "lottie-react";
import animationData from "@/assets/lottie/chatanimations.json";
import typinganimation from "@/assets/lottie/loading.json"
import loadinganimation from "@/assets/lottie/load.json"
import style from '@styles/all.module.css'


// Types
interface User {
  id: number;
  username: string;
  image: string | null;
  isOnline?: boolean;
}

interface FriendData {
  friend: User;
  last_message: string;
  unread_count: number;
}

interface Message {
  id: string;
  user: "me" | "friend";
  msg: string;
  timestamp: string;
}

interface WebSocketMessage {
  message: string;
  user_id: number;
}

const Chat = () => {
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const chatroomIdRef = useRef<number>(0);
  const pageNumber = useRef<number>(1);
  const access = useRef<boolean>(true);

  const ws = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const lastmsgid = useRef<string>('');
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isTyping, setIsTyping] = useState(false);
  const pongTimeOut = useRef<number>(0);
  const ticTimeOut= useRef<number>(0);
  const [render, setRender] = useState(false);
  const statusWebSocket = useRef<WebSocket | null>(null);
  
  // console.log("wtf")

  useEffect(() => {
    statusWebSocket.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_BASE_URL}/ws/status/`, ['json', localStorage.getItem("access")]);
    const ws = statusWebSocket.current;
    ws.onopen = () => {
      console.log('connected');
    };
    ws.onmessage = (e) => {
      setIsLoading(false);
      console.log('message', e.data);
      const data = JSON.parse(e.data);
      const x = data as FriendData[];
      setFriends(x);
    };
    return () => {
      if (statusWebSocket.current != null) {
        statusWebSocket.current.close();
        statusWebSocket.current = null;
      }
    }
  }, []);
  const filteredFriends = friends.filter((friend) => {
    if (!searchQuery) return true;
    return friend.friend.username?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
  });




  const sendTicRequest = () => {
    if ( !selectedFriend || !ws.current || !chatroomIdRef.current) return;

    if (ws.current.readyState === WebSocket.OPEN) {
      if (ticTimeOut.current == 0)
        ticTimeOut.current = Date.now();
      else if (Date.now() - ticTimeOut.current > 60000)
        ticTimeOut.current = Date.now();
      else
      {
        alert("Please wait a little bit before sending another request");
        return;
      }

      const hash = Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
      ws.current.send(
        JSON.stringify({
          command: "send",
          message: `${process.env.NEXT_PUBLIC_LINK}/Game/TicTacToe?hash=${hash}`,
          invite: true,
          room_id: chatroomIdRef.current,
        })
      );
    } else {
      setError("Connection lost. Please try again.");
    }
  };


  const sendPongRequest = () => {
    if ( !selectedFriend || !ws.current || !chatroomIdRef.current) return;

    if (ws.current.readyState === WebSocket.OPEN) {
      if (pongTimeOut.current == 0)
        pongTimeOut.current = Date.now();
      else if (Date.now() - pongTimeOut.current > 60000)
        pongTimeOut.current = Date.now();
      else
      {
        alert("Please wait a little bit before sending another request");
        return;
      }
      const hash = Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
      ws.current.send(
        JSON.stringify({
          command: "send",
          invite : true,
          message: `${process.env.NEXT_PUBLIC_LINK}/Game/PingPong/OnlineGame?hash=${hash}`,
          room_id: chatroomIdRef.current,
        })
      );
    } else {
      setError("Connection lost. Please try again.");
    }
  };




  useEffect(() => {
    const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');

    const checkScrollPosition = () => {
      if (scrollContainer) {
        const { scrollTop } = scrollContainer;

        if (scrollTop === 0) {
          if (pageNumber.current !== -1 && !isLoadingMore && !render) {
            setIsLoadingMore(true);
            getRoomChatMessages();
          }
        }
      }
    };

    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", checkScrollPosition);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", checkScrollPosition);
      }
    };
  }, [selectedFriend, isLoadingMore]);

  useEffect(() => {
    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN && chatroomIdRef.current) {
        ws.current.send(JSON.stringify({ command: "leave", room_id: chatroomIdRef.current }));
      }
    };
  }, [chatroomIdRef.current]);

  useEffect(() => {
    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN && chatroomIdRef.current) {
        ws.current.send(JSON.stringify({ command: "leave", room_id: chatroomIdRef.current }));
      }

      if (ws.current) {
        ws.current.close();
      }
      pageNumber.current = 1;
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!render)
      {
        try {
            const [userResponse, friendsResponse] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/`, { credentials: "include" }),
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/chat/`, { credentials: "include" }),
            ]);
    
            if (!userResponse.ok || !friendsResponse.ok) throw new Error("Failed to fetch data");
    
            const userData = await userResponse.json();
            const friendsData = await friendsResponse.json() as FriendData[];
    
            setUser(userData);
            setFriends(friendsData);
        } catch (error) {
            setError(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };
  }
  
 
    fetchData();
  
    return () => {
        if (ws.current) ws.current.close();
    };
}, [render]);
  

  const getRoomChatMessages = async () => {
    if (pageNumber.current !== -1 && ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          command: "get_room_chat_messages",
          room_id: chatroomIdRef.current,
          page_number: pageNumber.current,
        })
      );
    }
    pageNumber.current = -1;
  };

  const handleMessagesPayload = (messages: any[], newPageNumber: number) => {
    if (Array.isArray(messages) && messages.length > 0) {
      pageNumber.current = newPageNumber;


  
      const newMessages: any[] = messages
        .map((msg: any) => ({
      
          id: msg.msg_id.toString(),
          user: msg.username === user?.username ? "me" : "friend",
          msg: msg.message,
          timestamp: msg.natural_timestamp,
        }))
        .sort((a, b) => Number(a.id) - Number(b.id));
  
      setChatHistory((prev) => {
        if (newMessages.length > 0 && prev.length > 0) {
          const lastKnownId = prev[0]?.id;
          const lastKnownIndex = newMessages.findIndex((msg) => msg.id === lastKnownId);
  
          if (lastKnownIndex > 0) {
            lastmsgid.current = newMessages[lastKnownIndex - 1].id;
            access.current = false;
          } else if (lastKnownIndex === -1) {
            lastmsgid.current = newMessages[newMessages.length - 1].id; 
            access.current = false;
          }
        } else if (newMessages.length > 0 && prev.length === 0) {
          access.current = true;
        }
  
        const combined = [...newMessages, ...prev].sort((a, b) => Number(a.id) - Number(b.id));
        return combined;
      });
  
  
      setIsLoadingMore(false);
    } else {
      pageNumber.current = -1;
      setIsLoadingMore(false);
    }
  };

  const setupWebSocket = (chatroomId: number) => {
    const wsScheme = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss" : "ws"; 
    const wsPath = `${process.env.NEXT_PUBLIC_WS_BASE_URL}/ws/chat/${chatroomId}/`;
    ws.current = new WebSocket(wsPath,['json',localStorage.getItem("access")]);

    ws.current.onopen = () => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ command: "join", room_id: chatroomId }));
      }
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
    

      if (data.error === 'CHAT_BLOCKED' || data.error === 'CHAT_NOT_FRIENDS') {
        setSelectedFriend(null);
        setChatHistory([]);
        setSearchQuery("");
        setMessage("");
        setFriends([]);
        setRender(!render);
        }
      if (data.join) {
        getRoomChatMessages();
      }


      if (data.message && data.username) {
        const isFromMe = user && data.username === user.username;
        access.current = true;
        const newMessage: Message = {
          id: `${Date.now()}-${Math.random()}`,
          user: isFromMe ? "me" : "friend",
          msg: data.message,
          timestamp: data.natural_timestamp,
        };
        setChatHistory((prev) => [...prev, newMessage]);
      }

      if (data.messages_payload) {
        if (data.username === user.username)
        {
          handleMessagesPayload(data.messages, data.new_page_number);
        }
      }
    };




  };

  const handleSelectFriend = async (friendId: number, friendName: string) => {
    if (selectedFriend === friendName) return;
    if (ws.current && ws.current.readyState === WebSocket.OPEN && chatroomIdRef.current) {
      ws.current.send(JSON.stringify({ command: "leave", room_id: chatroomIdRef.current }));
    }
  
    setFriends((prevFriends) =>
      prevFriends.map((friend) =>
        friend.friend.id === friendId
          ? { ...friend, unread_count: 0 }
          : friend
      )
    );
    
  
    setSelectedFriend(null);
    setChatHistory([]);
    setSearchQuery("");
    setMessage("");
    pageNumber.current = 1;
    chatroomIdRef.current = 0;
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/chat/${friendId}/`, {
        method: "POST",
        credentials: "include",
      });
  
      if (!response.ok) throw new Error("Failed to get room ID");
  
      const data = await response.json();
      console.log("data",data);
      if (data.response === "Successfully got the chat.") {
        console.log("Successfully got the chatqweqw.");
        chatroomIdRef.current = data.chatroom.id;
        setSelectedFriend(friendName);
        pageNumber.current = 1;
        setupWebSocket(chatroomIdRef.current);
      }
    } catch (error) {
      console.error("Error selecting friend:", error);
      setError("Failed to connect to chat");
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !selectedFriend || !ws.current || !chatroomIdRef.current) return;

    if (ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          command: "send",
          message: message.trim(),
          room_id: chatroomIdRef.current,
        })
      );
      setMessage("");
    } else {
      setError("Connection lost. Please try again.");
    }
  };

  const blockuser = async (friendId: number) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/block-user/${friendId}/`, {
            method: "POST",
            credentials: "include",
        });
    
        if (!response.ok) throw new Error("Failed to block user");
    
        if (ws.current && ws.current.readyState === WebSocket.OPEN && chatroomIdRef.current) {
            ws.current.send(JSON.stringify({ command: "leave", room_id: chatroomIdRef.current }));
            ws.current.close();
            ws.current = null;
            chatroomIdRef.current = -1;
        }
    
        setSelectedFriend(null);
        setChatHistory([]);
        setSearchQuery("");
        setFriends(prev => prev.filter(f => f.friend.id !== friendId));
        setRender(!render);
        setIsLoadingMore(false);
    
    } catch (error) {
        console.error("Error blocking user:", error);
        setError("Failed to block user");
    }
};

  useEffect(() => {
    if (endRef.current && !isLoadingMore && access.current) {
      console.log("Scrolling to the end");
      endRef.current.scrollIntoView({ behavior: "auto" });
    }
  
    if (lastmsgid.current && !access.current) {
      setTimeout(() => {
        const targetElement = document.getElementById(lastmsgid.current);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "auto" });
          console.log(`Scrolled to message ID: ${lastmsgid.current}`);
        } else {
          console.log("Target element not found. Scrolling to the top.");
          scrollRef.current?.scrollTo({ top: 0, behavior: "auto" }); // Fallback to scroll to top
        }
      }, 100); 
    }
  }, [chatHistory, isLoadingMore]);


  useEffect(() => {
    if (isTyping && endRef.current) {

      endRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [isTyping]); 

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (error) return <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  if (!user) return <Alert><AlertTitle>Authentication Required</AlertTitle><AlertDescription>Please log in to access the chat.</AlertDescription></Alert>;

  return (
    <div className="flex w-[95%] h-[90vh] gap-4">
        {/* Friends List Card */}
        <Card className="w-1/4 p-4 mx-auto bg-card text-card-foreground">
          <CardContent className="p-0">
            <Input className="mb-4 border-input" placeholder="Search for a friend..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <ScrollArea className="h-[calc(90vh-8rem)]">
              {filteredFriends.length === 0 ? (
                <Alert>
                  <AlertTitle>No friends found</AlertTitle>
                  <AlertDescription>No friends match your search.</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {filteredFriends.map((friend, index) => (
                    <div
                      key={`${friend.friend.id}-${index}`}
                      onClick={() => handleSelectFriend(friend.friend.id, friend.friend.username)}
                      className={cn(
                        "flex items-center p-4 rounded-lg cursor-pointer border",
                        "hover:bg-accent transition-colors duration-200",
                        selectedFriend === friend.friend.username && "bg-bg-accent"
                      )}
                    >
                      <Avatar className="h-12 w-12">
                        {friend.friend.image ? (
                          <AvatarImage src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${friend.friend.image}`} alt={friend.friend.username} />
                        ) : (
                          <AvatarFallback>{friend.friend.username[0].toUpperCase()}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-foreground">{friend.friend.username}</span>
                          {/* Unread Messages Badge */}
                          {friend.unread_count > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                              {friend.unread_count}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {friend.last_message.length < 25 ? friend.last_message : friend.last_message.slice(0, 25) + "..."}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      {/* </div> */}

      {/* Chat Main Area */}
      <Card className="flex-1 flex flex-col bg-card text-card-foreground">
        {/* Chat Header */}
        <CardHeader className="px-6 py-4 border-b border-border">
          {selectedFriend ? (
            <div className="flex items-center justify-between">
              <Link href={{ pathname: '/profile', query: { userId: friends.find((f) => f.friend.username === selectedFriend)?.friend.id?.toString() } }}>
              <div className="flex items-center">
                <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${friends.find((f) => f.friend.username === selectedFriend)?.friend.image}`}
                      alt={selectedFriend}
                    />
                    <AvatarFallback>{selectedFriend[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <h3 className="font-semibold text-foreground">{selectedFriend}</h3>
                  {/* <span className="text-sm text-primary">
                    {friends.find((f) => f.friend.username === selectedFriend)?.friend.isOnline ? "Online" : "Offline"}
                  </span> */}
                </div>
              </div>
                  </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-destructive" 
                  onClick={() => {blockuser(friends.find((f) => f.friend.username === selectedFriend)?.friend?.id)}}>
                  Block User</DropdownMenuItem>
                  <DropdownMenuItem onClick={()=>{
                    // sendRequest();
                    sendPongRequest();
                  }} >Invite to PingPong</DropdownMenuItem>
                  <DropdownMenuItem onClick={()=>{
                    // sendRequest();
                    sendTicRequest();
                  }} >Invite to TicTac</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <span className="text-muted-foreground">Select a friend to start chatting</span>
          )}
        </CardHeader>

        {/* Chat Messages Area */}
        <CardContent className="flex-1 p-6 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 min-h-0" ref={scrollRef} type="auto">
            <div className="space-y-4 pr-4">
              {isLoadingMore && (
                <div className="text-center text-foreground">
                  <span>Loading more messages...</span>
                </div>
              )}
              {chatHistory.map((chat, index) => (
                <div key={index} id={chat.id} className={cn("flex", chat.user === "me" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "h-full w-[600px] rounded-lg px-4 py-2 my-1 overflow-hidden relative", // Chat bubble container
                      "text-sm whitespace-normal break-words", // Message text styling
                      "overflow-y-auto", // Handle long messages
                      chat.user === "me" ? "bg-primary text-primary-foreground text-left" : "bg-secondary text-secondary-foreground text-right", // Background and text color based on user
                      "flex flex-col justify-between" // Use flexbox to position the timestamp at the end
                    )}
                  >
                    {/* Message Content */}
                    <div className="message-content">
                    {(chat.msg.startsWith(`${process.env.NEXT_PUBLIC_LINK}/Game/PingPong/OnlineGame`) || chat.msg.startsWith(`${process.env.NEXT_PUBLIC_LINK}/Game/TicTacToe`))?<><p className="text-base  h-full">{` Ready for a ${chat.msg.search('PingPong/OnlineGame') != -1 ? 'PingPong' : "TicTac"} 1v1 challenge? Click here to accept: `}</p> <Link href={chat.msg} className="no-underline text-foreground/50 hover:underline">{chat.msg}</Link> </>: chat.msg}
                    </div>
                  
                    {/* Timestamp */}
                    <div className={cn(
                      "text-xs mt-1", // Small font size and margin-top
                      chat.user === "me" ? "text-right text-primary-foreground/80 " : "text-left text-muted-foreground" // Align and color based on user
                    )}>
                      {chat.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              <div ref={endRef}></div>
            </div>
          </ScrollArea>

          {/* Chat Input Area */}
          {selectedFriend ? (
                <div className="flex gap-2 mt-4 pt-4 border-t border-border items-end">
                <div className="relative flex-1">
                  <Input
                    value={message}
                    onChange={(e) => {
                      const newValue = e.target.value.slice(0, 500);
                      setMessage(newValue);
                      // handleTyping();
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        // sendStoppedTypingEvent();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    className="pr-16 bg-background text-foreground" // Add padding for counter
                  />
                  <div className="absolute bottom-2 right-2 flex items-center gap-1">
                    <span className={cn(
                      "text-xs font-medium transition-colors",
                      message.length >= 500 ? "text-destructive" : 
                      message.length >= 400 ? "text-muted-foreground" : "text-muted-foreground"
                    )}>
                      {message.length}/500
                    </span>
                    {/* Progress bar */}
                    <div className="h-1 w-16 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${Math.min((message.length / 500) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    // sendStoppedTypingEvent();
                    handleSendMessage(); }} 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-[42px]" 
                  disabled={!message.trim()}
                >
                  Send
                </Button>
                </div>
          ) : (
            <div className="pl-80 pb-52 justify-self-center">
            <Lottie animationData={animationData} loop autoplay style={{width: 1000, height: 800}}/>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};


export default Chat;