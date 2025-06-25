export default function LocalGameLayout({ children }: Readonly<{
	children: React.ReactNode;
  }>) {
	return <>
	{children}
	</>; // No wrapping layout here
  }