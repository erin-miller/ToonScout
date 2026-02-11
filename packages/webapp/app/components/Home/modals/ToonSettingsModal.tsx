import React, { useEffect, useState } from 'react';
import Modal from '../../Modal';
import { Rewards, StoredToonData } from '@/app/types';
import { useToonContext } from '@/app/context/ToonContext';
import {
	FaLock,
	FaUnlock,
	FaCog,
	FaTrash,
	FaBellSlash,
	FaBell,
} from 'react-icons/fa';
import FishSettingsItem from './SettingsItems/FishSettingsItem';
import GardenSettingsItem from './SettingsItems/GardenSettingsItem';
import NotificationSettingsItem from './SettingsItems/NotificationSettingsItem';
import { getNotificationSettings } from '@/app/utils/notificationUtils';
import { getRewardSums } from '@/app/utils/rewardsUtils';

type SettingsModalProps = {
  toon: StoredToonData | null;
  index: number | null;
  isOpen: boolean;
  onClose: () => void;
};

const SettingsModal: React.FC<SettingsModalProps> = ({
	toon,
	index,
	isOpen,
	onClose,
}) => {
	if (!isOpen || !toon || index == null) return null;
	const { toons, addToon, deleteToon } = useToonContext();

	// notifs
	const initialSettings = getNotificationSettings();
	const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
		initialSettings.notificationsEnabled,
	);

	const [rewardSums, setRewardSums] = useState({
		sumSos: 0,
		sumUnites: 0,
		sumSummons: 0,
		sumRemotes: 0,
		totalRewards: 0,
	});

	useEffect(() => {
		const fetchSums = async () => {
			if (toon) {
				const rewards = toon.data.data.rewards;
				const sums = await getRewardSums(rewards);
				setRewardSums(sums);
			}
		};

		fetchSums();
	}, [toon]);

	const toggleLock = (index: number) => {
		const toon = toons[index];
		toon.locked = !toon.locked;
		addToon(toon);
	};

	const getLockedStatus = (index: number) => {
		return toons[index]?.locked;
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<div className="px-2 items-start justify-start text-left text-gray-900 dark:text-white">
				{/* individual settings and stats*/}
				<h3 className="text-3xl font-bold">{toon.data.data.toon.name}</h3>
				<div className="flex flex-col items-start gap-2 mb-4">
					{/* lock */}
					<div className="flex gap-2">
						<button
							className="flex items-center gap-2 text-xl"
							onClick={() => toggleLock(index)}
						>
							{getLockedStatus(index) ? (
								<FaLock className="text-red-500 text-2xl" />
							) : (
								<FaUnlock className="text-green-500 text-2xl" />
							)}
						</button>
						<span>
              Currently {getLockedStatus(index) ? 'Locked' : 'Unlocked'}
						</span>
					</div>
					{/* stats */}
					<div>
						<div className="grid md:grid-cols-3 gap-1">
							<span>{rewardSums.sumSos} SOS cards</span>
							<span>{rewardSums.sumUnites} Unites</span>
							<span>{rewardSums.sumSummons} Summons</span>
							<span>{toon.data.data.rewards.pinkslips} Pinkslips</span>
							<span>{rewardSums.sumRemotes} Remotes</span>
							<span>{rewardSums.totalRewards} total rewards</span>
						</div>
					</div>

					{/* global settings */}
					<div className="grid md:grid-cols-2 md:space-x-6 mt-5">
						<div>
							<h3 className="text-3xl font-bold ">Tab Settings</h3>

							<FishSettingsItem />
							<GardenSettingsItem />
						</div>

						<div>
							<div className="flex flex-row gap-3">
								<h3 className="text-3xl font-bold ">Notifications</h3>
								{/* toggle */}
								<div className="flex">
									<button
										className="text-2xl focus:outline-none"
										title={
											notificationsEnabled
												? 'Disable Notifications'
												: 'Enable Notifications'
										}
										onClick={() => setNotificationsEnabled((prev) => !prev)}
									>
										{notificationsEnabled ? (
											<FaBell className="text-orange-500 dark:text-yellow-400" />
										) : (
											<FaBellSlash className="text-gray-900 dark:text-gray-400" />
										)}
									</button>
								</div>
							</div>
							<NotificationSettingsItem />
						</div>
					</div>
				</div>

				{/* deletion */}
				<div className="flex items-center justify-center text-red-800">
					<button
						className="flex items-center gap-2 text-xl bg-red-200 p-2 rounded hover:bg-red-300"
						onClick={() => {
							onClose();
							deleteToon(toon);
						}}
					>
						<FaTrash className="text-red-800" />
						<span>Delete Toon</span>
					</button>
				</div>
			</div>
		</Modal>
	);
};

export default SettingsModal;
