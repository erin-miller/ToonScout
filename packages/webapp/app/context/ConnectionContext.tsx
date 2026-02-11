'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';

type ConnectionContextType = {
  isConnected: boolean;
  setIsConnected: React.Dispatch<React.SetStateAction<boolean>>;
};

const ConnectionContext = createContext<ConnectionContextType | undefined>(
	undefined,
);

export const ConnectionProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [isConnected, setIsConnected] = useState<boolean>(false);

	return (
		<ConnectionContext.Provider value={{ isConnected, setIsConnected }}>
			{children}
		</ConnectionContext.Provider>
	);
};

export const useConnectionContext = () => {
	const context = useContext(ConnectionContext);
	if (!context) {
		throw new Error(
			'useConnectionContext must be used within a ConnectionProvider',
		);
	}
	return context;
};
