'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';

type DiscordContextType = {
  userId: string | null;
  setUserId: React.Dispatch<React.SetStateAction<string | null>>;
};

const DiscordContext = createContext<DiscordContextType | undefined>(undefined);

export const DiscordProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [userId, setUserId] = useState<string | null>(null);

	return (
		<DiscordContext.Provider value={{ userId, setUserId }}>
			{children}
		</DiscordContext.Provider>
	);
};

export const useDiscordContext = () => {
	const context = useContext(DiscordContext);
	if (!context) {
		throw new Error('useDiscordContext must be used within a DiscordProvider');
	}
	return context;
};
