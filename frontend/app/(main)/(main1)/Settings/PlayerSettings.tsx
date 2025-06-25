"use client";

import { useState, useRef, useEffect,useContext } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { TwoFactorSettings } from "./TwoFactorSettings";

import { AvatarImage } from "@radix-ui/react-avatar";
import { Avatar } from "@components/ui/avatar";
import { UserContext } from "@hooks/useContext";
const ImageIcon = () => (
  <div className="bg-white rounded-full p-2 shadow-lg">
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className="text-gray-500"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.11 3.89 21 5 21H19C20.11 21 21 20.11 21 19V5C21 3.89 20.11 3 19 3ZM19 19H5V5H19V19ZM8.5 13.5L5 18H19L14.5 12L11 16.51L8.5 13.5Z"
        fill="currentColor"
      />
    </svg>
  </div>
);

export default function PlayerSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);  // Add this
  const [avatarSrc, setAvatarSrc] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const router = useRouter();
  const {update,setUpdate} = useContext(UserContext)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/settings/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();


        setUser(data);
        setInitialData(data);
        setFirstName(data.firstname);
        setLastName(data.lastname);
        setUsername(data.username);
        // setEmail(data.email);
        const newAvatarSrc = `${process.env.NEXT_PUBLIC_API_BASE_URL}${data.image}`;
        console.log("path ", newAvatarSrc);
        setAvatarSrc(newAvatarSrc);
        setIsLoading(false);
      } catch (error: any) {
        console.error("Error fetching user:", error);
        setError(error.message);
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarSrc(result);
      };
      reader.readAsDataURL(file);
      setAvatarFile(file);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmitpass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Frontend validation
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/change-password/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword
        }),
        credentials: "include",
      });
  
      const data = await response.json();

      
      if (!response.ok) {
        // Use backend error message if available
        setPasswordError(data.error || data.message || "Password update failed");
        return;
      }
  
      // Clear fields on success
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
      
    } catch (error) {
      setPasswordError('An error occurred. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);


    const hasChanges =
      firstName !== initialData.firstname ||
      lastName !== initialData.lastname ||
      username !== initialData.username ||
      // email !== initialData.email ||
      avatarFile !== null;

    if (!hasChanges) {
      setSubmitError("No changes detected");
      return;
    }

    const formData = new FormData();

    if (firstName !== initialData.firstName) formData.append("firstName", firstName);
    if (lastName !== initialData.lastName) formData.append("lastName", lastName);
    if (username !== initialData.username) formData.append("username", username);
    // if (email !== initialData.email) formData.append("email", email);
    if (avatarFile)
    {
      formData.append("image", avatarFile);
      console.log("last seen is here?!?");
    } 

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/update-profile/`, {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });
      console.log("response",response);
      

      if (response.ok) {
        const data = await response.json();
        setFirstName(data.data.firstName);
        setLastName(data.data.lastName);
        setUsername(data.data.username);
        setEmail(data.data.email);
        const newAvatarSrc = `${process.env.NEXT_PUBLIC_API_BASE_URL}${data.data.image}`;
        console.log("newAvatarSrc",data.data.image);
        setAvatarSrc(newAvatarSrc);
        setUpdate(Date.now())
        setInitialData({
          firstName: data.data.firstName,
          lastName: data.data.lastName,
          username: data.data.username,
          // email: data.data.email,
          image: newAvatarSrc,
        });

      } else {
        try {
          const errorData = await response.json();
          console.log("error rja3 ", errorData);
          setProfileError(errorData.error || errorData.username || "Failed to update profile");
        } catch (e) {
          setSubmitError(`Error: ${response.status} - ${response.statusText}`);
        }
      }
    } catch (error) {
      setProfileError("An unexpected error occurred");
    }
  };

  const handleRedirect = (e: React.MouseEvent) => {
    e.preventDefault();
    setFirstName(initialData.firstname);
    setLastName(initialData.lastname);
    setUsername(initialData.username);
    setAvatarSrc(`${process.env.NEXT_PUBLIC_API_BASE_URL}${initialData.image}`);
    setAvatarFile(null);  // Reset the file selection
    router.push('/Dashboard');
  };
  

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;

  return (
    <Card className="w-[683px] h-[880px] overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-3xl">Player Settings</CardTitle>
        <CardDescription>Manage your account and security settings</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="account" className="h-[760px]">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="2fa">2fa</TabsTrigger>
          </TabsList>
          
          <TabsContent value="account" className="h-full">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
                  <Avatar className="w-32 h-32">
                  <AvatarImage
                    src={avatarSrc}
                    alt="Profile picture"
                  />
                  </Avatar>

                    <div className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4">
                      <ImageIcon />
                    </div>
                    <Input
                      ref={fileInputRef}
                      id="picture"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                </div>             
                {profileError && (
                  <div className="text-red-500 text-sm mt-4">
                    {profileError}
                  </div>
                )}
                <div className="mt-6 flex justify-between">
                <Button variant="outline" type="button" onClick={handleRedirect}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>Save</Button>

                </div>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="password" className="h-full">
  <form onSubmit={handleSubmitpass}>
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="current">Current Password</Label>
        <Input 
          id="current" 
          type="password" 
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)} 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new">New Password</Label>
        <Input 
          id="new" 
          type="password" 
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm New Password</Label>
        <Input 
          id="confirm" 
          type="password" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      
      {/* Error Display */}
      {passwordError && (
        <div className="text-red-500 text-sm p-2 rounded bg-red-50">
          {passwordError}
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={handleRedirect}>Cancel</Button>
        <Button type="submit">Change</Button>
      </div>
    </div>
  </form>
</TabsContent>

          <TabsContent value="2fa" className="h-full">
            <TwoFactorSettings />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}