import type { Metadata } from 'next';
import '@/styles/globals.css';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics } from '@vercel/analytics/next';
import Providers from './components/Providers';

export const metadata: Metadata = {
	title: 'ToonScout',
	description:
    'Find and share your Toontown Rewritten toons in Discord and your browser.',
};

export default function RootLayout({
	children,
}: Readonly<{
  children: React.ReactNode;
}>) {
	const ga = process.env.NEXT_PUBLIC_GA_ID || '';
	return (
		<html lang="en" className="transition-all ease-in-out duration-500">
			<body className="font-impress text-gray-800 dark:text-gray-100">
				<Providers>{children}</Providers>
				<GoogleAnalytics gaId={ga} />
				<Analytics />
			</body>
		</html>
	);
}
