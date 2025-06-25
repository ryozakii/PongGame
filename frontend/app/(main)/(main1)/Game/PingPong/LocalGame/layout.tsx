export default function LocalGameLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="w-[100%] h-[100%] flex justify-center items-center">{children}</div>;
}
