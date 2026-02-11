import { initWebSocket } from '@/app/api/LocalWebSocket';
import ThemeToggle from '../Theme';
import DiscordModal from './modals/DiscordModal';
import GameStepsModal from './modals/GameStepsModal';
import ConnectionStatus from './tabs/components/ConnectionStatus';
import ToonSelect from './ToonSelect';
import { useConnectionContext } from '@/app/context/ConnectionContext';
import { useActivePortsContext } from '@/app/context/ActivePortsContext';
import { useToonContext } from '@/app/context/ToonContext';
import { FaArrowsRotate } from 'react-icons/fa6';
import { FaCog } from 'react-icons/fa';
import { useState } from 'react';
import ToonSettingsModal from './modals/ToonSettingsModal';

interface HeaderProps {
  userId?: string | null;
  setActiveModal: (modalType: string | null) => void;
  activeModal: string | null;
}

const Header: React.FC<HeaderProps> = ({
	userId,
	activeModal,
	setActiveModal,
}) => {
	const closeModal = () => setActiveModal(null);
	const openModal = (modalName: string) => setActiveModal(modalName);
	const [isDisabled, setIsDisabled] = useState(false);

	// for force resync
	const { setIsConnected } = useConnectionContext();
	const { addToon, toons, activeIndex } = useToonContext();
	const { addPort, removePort } = useActivePortsContext();

	return (
		<div className="grid grid-cols-3 bg-white dark:bg-gray-1200 py-2 px-4 max-w-full items-center justify-center">
			<div className="flex flex-row space-x-4 text-left items-center">
				<ToonSelect />
				<div className="hidden md:block md:text-xl lg:text-3xl xl:text-4xl font-minnie text-violet-700 dark:text-pink-500 text outline-text shadow-text mt-2 scale-up">
          ToonScout
				</div>
			</div>

			<div className="flex flex-row space-x-4 items-center justify-center">
				<button
					className={`scale-up rounded-full p-1.5 border-2 ${
						isDisabled
							? 'border-gray-400 bg-gray-200 text-gray-400 dark:border-gray-1000 dark:bg-gray-900 dark:text-gray-1000 cursor-not-allowed'
							: 'border-blue-600 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
					}`}
					onClick={() => {
						if (!isDisabled) {
							initWebSocket(setIsConnected, addPort, removePort, addToon);
							setIsDisabled(true);
							setTimeout(() => setIsDisabled(false), 10000);
						}
					}}
					disabled={isDisabled}
				>
					<FaArrowsRotate className="w-4.5 h-4.5" />
				</button>
				<ConnectionStatus setActiveModal={setActiveModal} />
			</div>

			<div className="text-right space-x-2 text-white text-blue-900 items-center">
				<button className="home-btn" onClick={() => openModal('settings')}>
					<FaCog className="w-8 h-8" />
				</button>
				<button className="home-btn" onClick={() => openModal('discord')}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 127.14 96.36"
						className="w-8 h-8"
						fill="currentColor"
					>
						<path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
					</svg>
					{userId ? (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							className="w-5 h-5 absolute top-5 right-2 translate-x-3 translate-y-3 text-gray-100 bg-green-800 dark:bg-green-600 dark:text-gray-200 rounded-full"
							fill="currentColor"
						>
							<path
								fillRule="evenodd"
								d="M16.293 5.293a1 1 0 011.414 1.414l-9 9a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293z"
								clipRule="evenodd"
							/>
						</svg>
					) : (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							className="w-5 h-5 absolute top-5 right-2 translate-x-3 translate-y-3 text-gray-100 bg-red-800 dark:text-gray-200 rounded-full"
							fill="currentColor"
						>
							<path
								fillRule="evenodd"
								d="M14.348 5.652a1 1 0 00-1.414 0L10 8.586 7.066 5.652a1 1 0 10-1.414 1.414L8.586 10l-2.934 2.934a1 1 0 101.414 1.414L10 11.414l2.934 2.934a1 1 0 101.414-1.414L11.414 10l2.934-2.934a1 1 0 000-1.414z"
								clipRule="evenodd"
							/>
						</svg>
					)}
				</button>

				<ThemeToggle />
			</div>
			{activeModal == 'discord' && (
				<DiscordModal isOpen={true} onClose={closeModal} />
			)}
			{activeModal == 'connect' && (
				<GameStepsModal isOpen={true} onClose={closeModal} />
			)}
			{activeModal == 'settings' && (
				<ToonSettingsModal
					toon={toons[activeIndex]}
					isOpen={true}
					onClose={closeModal}
					index={activeIndex}
				/>
			)}
		</div>
	);
};

export default Header;
