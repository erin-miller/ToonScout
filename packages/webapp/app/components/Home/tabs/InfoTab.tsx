import React from 'react';
import AnimatedTabContent from '@/app/components/animations/AnimatedTab';
import {
	displaySuit,
	sumFish,
	sumFlowers,
	sumRace,
	sumGolf,
	hasNoSuit,
} from '../../../utils/tabUtils';
import { TabComponent, TabProps } from './components/TabComponent';
import FishTab from './FishTab';
import ActivityTab from './ActivityTab';

const InfoTab: React.FC<TabProps> = ({ toon, setSelectedTab }) => {
	const TabList: TabComponent[] = [
		{ title: 'Fishing', component: FishTab },
		{ title: 'Activities', component: ActivityTab },
	];
	const handleTab = (tab: TabComponent) => {
		if (setSelectedTab) {
			setSelectedTab(tab);
		}
	};
	return (
		<AnimatedTabContent>
			<div className="activity-info-container">
				<button
					className="activity-bubble hover:scale-up"
					id="fish"
					onClick={() => handleTab(TabList[0])}
				>
					<svg
						fill="currentColor"
						className="w-6 h-6 md:w-10 md:h-10 xl:w-16 xl:h-16"
						viewBox="0 0 32 32"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path d="M 10.5 6 L 11.0625 7.375 C 11.414063 8.230469 11.890625 10.367188 11.78125 11.375 C 10.417969 12.214844 9.582031 13.035156 8.9375 13.71875 C 8.148438 13.082031 6.589844 12 4 12 L 3 12 L 3 13 C 3 14.914063 3.691406 16.46875 3.9375 17 C 3.6875 17.527344 3 19.027344 3 21 L 3 22 L 4 22 C 6.570313 22 8.148438 20.914063 8.9375 20.28125 C 10.121094 21.5 11.808594 22.785156 13.9375 23.75 C 13.84375 24.371094 13.769531 25.238281 14.03125 26.25 L 14.21875 27 L 15 27 C 16.234375 27 17.296875 26.386719 18.15625 25.84375 C 18.859375 25.398438 19.199219 25.085938 19.375 24.9375 C 23.351563 24.796875 25.890625 22.652344 27.25 20.53125 C 28.65625 18.339844 29 16.15625 29 16.15625 L 29.03125 15.90625 L 28.9375 15.65625 C 28.9375 15.65625 26.648438 9.367188 20.4375 9.0625 C 19.777344 8.261719 18.855469 7.597656 17.5625 7.0625 C 16.035156 6.429688 14.113281 6 12 6 Z M 13.40625 8.125 C 14.667969 8.265625 15.847656 8.519531 16.78125 8.90625 C 18.058594 9.433594 18.949219 10.191406 19.15625 10.53125 L 19.4375 11 L 20 11 C 24.996094 11 26.792969 15.730469 26.9375 16.125 C 26.867188 16.492188 26.578125 17.886719 25.5625 19.46875 C 24.402344 21.277344 22.523438 23 19 23 L 18.625 23 L 18.34375 23.25 C 18.34375 23.25 17.816406 23.699219 17.09375 24.15625 C 16.714844 24.394531 16.390625 24.4375 16 24.59375 C 16.039063 24.136719 16 23.46875 16 23.46875 L 16.21875 22.59375 L 15.40625 22.3125 C 12.929688 21.367188 10.824219 19.585938 9.75 18.34375 L 9.0625 17.53125 L 8.3125 18.28125 C 8.3125 18.28125 6.980469 19.214844 5.25 19.65625 C 5.507813 18.484375 5.90625 17.4375 5.90625 17.4375 L 6.125 17 L 5.90625 16.5625 C 5.90625 16.5625 5.472656 15.414063 5.21875 14.1875 C 7.0625 14.59375 8.3125 15.71875 8.3125 15.71875 L 9.0625 16.46875 L 9.75 15.65625 C 10.644531 14.644531 13.054688 12.125 16.59375 11.65625 L 16.3125 9.6875 C 15.355469 9.8125 14.519531 10.089844 13.71875 10.40625 C 13.667969 9.566406 13.625 8.84375 13.40625 8.125 Z M 22.5 15 C 21.671875 15 21 15.671875 21 16.5 C 21 17.328125 21.671875 18 22.5 18 C 23.328125 18 24 17.328125 24 16.5 C 24 15.671875 23.328125 15 22.5 15 Z" />
					</svg>
					<p>{sumFish(toon)} / 70</p>
				</button>
				<button
					className="activity-bubble hover:scale-up"
					id="golf"
					onClick={() => handleTab(TabList[1])}
				>
					<svg
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
						className="w-5 h-5 md:w-8 md:h-8 xl:w-14 xl:h-14"
						fill="currentColor"
					>
						<path d="M20.24,6,11,1.38V14c-3.62.21-7,1.56-7,4,0,2.63,4,4,8,4s8-1.37,8-4c0-2.41-3.38-3.76-7-4V9.62ZM18,18c0,.71-2.28,2-6,2s-6-1.29-6-2,1.88-1.75,5-2v2h2V16C16.12,16.25,18,17.36,18,18ZM13,4.62,15.76,6,13,7.38Z" />
					</svg>
					<p>{sumGolf(toon)} / 30</p>
				</button>
				<button
					className="activity-bubble hover:scale-up"
					id="race"
					onClick={() => handleTab(TabList[1])}
				>
					<svg
						viewBox="0 0 256 256"
						xmlns="http://www.w3.org/2000/svg"
						className="w-5 h-5 md:w-8 md:h-8 xl:w-14 xl:h-14"
						fill="currentColor"
					>
						<path d="M219.6,40.8a8.2,8.2,0,0,0-8.4.8c-28.3,21.2-52.3,11-80-.9s-60.3-25.9-96,.9A8,8,0,0,0,32,48h0V216a8,8,0,0,0,16,0V172.1c26.9-18.1,50.1-8.2,76.8,3.3,16.3,6.9,33.8,14.4,52.6,14.4,13.8,0,28.3-4,43.4-15.4A8.1,8.1,0,0,0,224,168V48A8.2,8.2,0,0,0,219.6,40.8ZM156,170.3V116.8c-18.9-5.4-37.1-15.9-56-21.3v53.6c-16.3-4.2-33.6-4.8-52,4.5V100.8c18.3-10.6,35.4-10,52-5.3V45.7a243.3,243.3,0,0,1,24.8,9.7c10,4.2,20.4,8.7,31.2,11.5v49.9c16.6,4.7,33.7,5.3,52-5.3v52.4C189.7,176.2,173.1,175.6,156,170.3Z" />
					</svg>
					<p>{sumRace(toon)} / 30</p>
				</button>
				<button
					className="activity-bubble hover:scale-up"
					id="flowers"
					disabled
				>
					<svg
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
						className="w-5 h-5 md:w-8 md:h-8 xl:w-14 xl:h-14"
						fill="none"
						stroke="currentColor"
					>
						<path
							d="M12 13C8 13 7 9.66667 7 8V4L9.5 6L12 3L14.5 6L17 4V8C17 9.66667 16 13 12 13ZM12 13V21M13 21C18.6 21 20 16.3333 20 14C14.4 14 13 18.6667 13 21ZM13 21H12M11 21C5.4 21 4 16.3333 4 14C9.6 14 11 18.6667 11 21ZM11 21H12"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
						/>
					</svg>
					<p>{sumFlowers(toon)} / 40</p>
				</button>
			</div>
			{hasNoSuit(toon) ? (
				<div className="flex items-center justify-center h-full text-3xl">
          You haven't unlocked any cog suits!
				</div>
			) : (
				<div className="suits-info-container">
					<div className="suit-card">{displaySuit(toon, 's')}</div>
					<div className="suit-card">{displaySuit(toon, 'm')}</div>
					<div className="suit-card">{displaySuit(toon, 'l')}</div>
					<div className="suit-card">{displaySuit(toon, 'c')}</div>
				</div>
			)}
		</AnimatedTabContent>
	);
};

export default InfoTab;
