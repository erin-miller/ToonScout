'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';

type ActivePortsContext = {
  activePorts: Set<number>;
  addPort: (port: number) => void;
  removePort: (port: number) => void;
};

const ActivePortsContext = createContext<ActivePortsContext | undefined>(
	undefined,
);

export const ActivePortsProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [activePorts, setActivePorts] = useState<Set<number>>(new Set());

	const addPort = (port: number) => {
		setActivePorts((prev) => new Set(prev).add(port));
	};

	const removePort = (port: number) => {
		setActivePorts((prev) => {
			const updated = new Set(prev);
			updated.delete(port);
			return updated;
		});
	};

	return (
		<ActivePortsContext.Provider value={{ activePorts, addPort, removePort }}>
			{children}
		</ActivePortsContext.Provider>
	);
};

export const useActivePortsContext = () => {
	const context = useContext(ActivePortsContext);
	if (!context) {
		throw new Error(
			'useActivePortsContext must be used within an ActivePortsProvider',
		);
	}
	return context;
};
