import React, { useState } from 'react';
import { Home, Users, MessageSquare, Settings, Gamepad2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import iconPong from "@assets/icons/ping-pong.png";

const entries = [
  { icon: Home, title: 'Dashboard', link: '/Dashboard' },
  { icon: Users, title: 'Friends', link: '/Friends' },
  { icon: MessageSquare, title: 'Chat', link: '/Chat' },
  { icon: Gamepad2, title: 'Game', link: '/Game' },
  { icon: Settings, title: 'Settings', link: '/Settings' }
];

const Sidebar = () => {
  const router = useRouter();
  const currentPath = usePathname();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState(currentPath.slice(1));

  const handleNavClick = (title, link) => {
    setActiveItem(title);
    router.push(link);
  };

  return (
    <div className="h-screen sticky top-0 bg-background border-r border-border relative">
      <div className={`relative transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 bg-primary text-primary-foreground rounded-full p-1 shadow-md hover:bg-primary/90 z-40"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="flex items-center justify-center h-[100px] border-b border-border">
          <div className="flex items-center space-x-2 z-40">
            <Image width={50} height={50} src={iconPong} alt="icon" className="w-8 h-8 z-40"  />
            {!isCollapsed && <span className="font-bold text-lg text-foreground z-40">Pingpong</span>}
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {entries.map((entry) => {
            const IconComponent = entry.icon;
            return (
              <button
                key={entry.title}
                onClick={() => handleNavClick(entry.title, entry.link)}
                className={`w-full flex items-center p-3 rounded-lg ${
                  activeItem === entry.title 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                } ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
              >
                <IconComponent className={isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} />
                {!isCollapsed && <span className="font-medium">{entry.title}</span>}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;