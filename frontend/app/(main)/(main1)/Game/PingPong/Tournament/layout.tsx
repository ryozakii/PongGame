export default function TournamnetGameLayout({ children }: Readonly<{
	children: React.ReactNode;
  }>) {
	return <>
	{children}
	</>; // No wrapping layout here
  }