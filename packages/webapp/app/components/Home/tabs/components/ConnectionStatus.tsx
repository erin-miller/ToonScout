import { useActivePortsContext } from '@/app/context/ActivePortsContext';
import { useToonContext } from '@/app/context/ToonContext';
import React, { useEffect, useState } from 'react';
interface ConnectionStatusProps {
  setActiveModal: (modalType: string | null) => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
	setActiveModal,
}) => {
	const { activePorts } = useActivePortsContext();
	const { toons, activeIndex } = useToonContext();
	const [modified, setModified] = useState<string>('');
	const [active, setActive] = useState<boolean>(false);

	const toon = toons[activeIndex] ?? null;

	useEffect(() => {
		if (!toon) return;

		const updateStatus = () => {
			try {
				if (!toon) return;
				const diff = Date.now() - toon.timestamp;
				const timeAgo = getTimeAgo(diff);
				if (process.env.DEBUG_FLAG == 'true' && diff >= 60000) {
					console.log(`===DEBUG=== [${toon.port}] timestamp is not updating!!!`);
				}

				setModified(timeAgo);
			}
			catch (error) {
				console.error('Error parsing existing toon data:', error);
			}
			finally {
				setActive(activePorts.has(toon.port));
			}
		};

		updateStatus();

		const interval = setInterval(updateStatus, 60000);
		return () => clearInterval(interval);
	}, [activeIndex, toon?.data, activePorts]);

	const handleStatusClick = () => {
		setActiveModal('connect');
	};

	const getTimeAgo = (timeDifference: number): string => {
		if (timeDifference < 60000) {
			return '<1 minute ago';
		}
		else if (timeDifference < 3600000) {
			return `${Math.floor(timeDifference / 60000)} minute(s) ago`;
		}
		else if (timeDifference < 86400000) {
			return `${Math.floor(timeDifference / 3600000)} hour(s) ago`;
		}
		else {
			return `${Math.floor(timeDifference / 86400000)} day(s) ago`;
		}
	};

	const checkStatus = () => {
		return active;
	};

	return (
		<div className="flex items-center justify-center">
			<button className="scale-up" onClick={handleStatusClick}>
				<div
					className={`flex flex-row text-sm lg:text-lg items-center justify-center px-2 rounded-full border-2
            ${
		checkStatus()
			? 'border-green-600 bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100'
			: 'border-red-500 bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100'
		}`}
				>
					<div
						className={`w-2.5 h-2.5 rounded-full mr-2 ${
							checkStatus() ? 'bg-green-600' : 'bg-red-500'
						}`}
					/>
					<div>{toon ? `Last updated ${modified}` : 'No Toon connected!'}</div>
				</div>
			</button>
		</div>
	);
};

export default ConnectionStatus;
