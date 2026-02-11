import React from 'react';
import { TabProps } from './components/TabComponent';
import AnimatedTabContent from '../../animations/AnimatedTab';
import { golf_trophies } from '@/data/golf_trophies';
import { race_trophies } from '@/data/race_trophies';
import {
	getGolfTrophies,
	getRaceTrophies,
	sumGolf,
	sumRace,
} from '../../../utils/tabUtils';
import { FaCircle } from 'react-icons/fa';

const ActivityTab: React.FC<TabProps> = ({ toon }) => {
	const trophyIcon = (earned: number) => {
		const total = 3;
		return (
			<div className="flex space-x-2">
				{Array.from({ length: total }).map((_, index) => (
					<svg
						fill="currentColor"
						className={`w-10 h-10 ${
							index < earned
								? 'text-blue-900 dark:text-pink-400'
								: 'text-blue-300 dark:text-gray-900'
						}`}
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
						key={index}
					>
						<path d="M22,3H19V2a1,1,0,0,0-1-1H6A1,1,0,0,0,5,2V3H2A1,1,0,0,0,1,4V6a4.994,4.994,0,0,0,4.276,4.927A7.009,7.009,0,0,0,11,15.92V18H7a1,1,0,0,0-.949.684l-1,3A1,1,0,0,0,6,23H18a1,1,0,0,0,.948-1.316l-1-3A1,1,0,0,0,17,18H13V15.92a7.009,7.009,0,0,0,5.724-4.993A4.994,4.994,0,0,0,23,6V4A1,1,0,0,0,22,3ZM5,8.829A3.006,3.006,0,0,1,3,6V5H5ZM16.279,20l.333,1H7.387l.334-1ZM17,9A5,5,0,0,1,7,9V3H17Zm4-3a3.006,3.006,0,0,1-2,2.829V5h2ZM10.667,8.667,9,7.292,11,7l1-2,1,2,2,.292L13.333,8.667,13.854,11,12,9.667,10.146,11Z" />
					</svg>
				))}
			</div>
		);
	};

	const renderStats = (
		data: { name: string; num: number }[],
		trophyData: typeof golf_trophies | typeof race_trophies,
	) => {
		return (
			<ul className="space-y-2">
				{data.map((item, index) => {
					const trophy = trophyData.find(
						(trophy) => trophy.description === item.name,
					);

					let curr = item.num.toString();
					let progress = 100;
					let totalSteps = -1;
					let currStep = -1;
					if (trophy) {
						const target = trophy.values.find((value) => item.num < value);

						if (target) {
							totalSteps = trophy.values.length;
							currStep = trophy.values.indexOf(target);
							curr = `${item.num} / ${target}`;
							progress = Math.min((item.num / target) * 100, 100);
						}
					}

					return (
						<li key={index} className="trophies relative z-5">
							<div
								className="bg-blue-900 dark:bg-gray-1200 absolute inset-0 opacity-15 z-0"
								style={{ width: `${progress}%` }}
							></div>
							<div className="flex flex-col text-xl w-full text-left z-50">
								<div>{item.name}</div>
								<div className="flex flex-row gap-1">{trophy && currStep > -1 && trophy.values.length > 1 && trophy.values.map((value, index) => (<FaCircle key={value} className={index <= currStep ? 'w-3 h-3 text-blue-700' : 'w-3 h-3 text-blue-100'} />))}</div>
							</div>
							<div
								className="flex z-50 w-36 h-10 justify-center items-center rounded-full border-4
              text-gray-100 bg-blue-800 border-blue-900
              dark:text-blue-900 dark:bg-blue-500 dark:border-blue-900"
							>
								<span className="truncate text-sm md:text-lg">{curr}</span>
							</div>
						</li>
					);
				})}
			</ul>
		);
	};

	return (
		<AnimatedTabContent>
			<div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:space-x-2">
				<div className="activity-container">
					<div className="activity-header-container">
						<div className="activity-name" id="golf">
							<svg
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
								className="w-8 h-8 md:h-10 md:w-10"
								fill="currentColor"
							>
								<path d="M20.24,6,11,1.38V14c-3.62.21-7,1.56-7,4,0,2.63,4,4,8,4s8-1.37,8-4c0-2.41-3.38-3.76-7-4V9.62ZM18,18c0,.71-2.28,2-6,2s-6-1.29-6-2,1.88-1.75,5-2v2h2V16C16.12,16.25,18,17.36,18,18ZM13,4.62,15.76,6,13,7.38Z" />
							</svg>
							<p>{sumGolf(toon)} / 30</p>
						</div>
						<div className="activity-header trophy-total">
							{trophyIcon(getGolfTrophies(toon))}
						</div>
					</div>
					{toon.data.data.golf ? (
						renderStats(toon.data.data.golf, golf_trophies)
					) : (
						<div>No golf data found.</div>
					)}
				</div>

				<div className="activity-container">
					<div className="activity-header-container">
						<div className="activity-name" id="race">
							<svg
								viewBox="0 0 256 256"
								xmlns="http://www.w3.org/2000/svg"
								className="w-8 h-8 md:h-10 md:w-10"
								fill="currentColor"
							>
								<path d="M219.6,40.8a8.2,8.2,0,0,0-8.4.8c-28.3,21.2-52.3,11-80-.9s-60.3-25.9-96,.9A8,8,0,0,0,32,48h0V216a8,8,0,0,0,16,0V172.1c26.9-18.1,50.1-8.2,76.8,3.3,16.3,6.9,33.8,14.4,52.6,14.4,13.8,0,28.3-4,43.4-15.4A8.1,8.1,0,0,0,224,168V48A8.2,8.2,0,0,0,219.6,40.8ZM156,170.3V116.8c-18.9-5.4-37.1-15.9-56-21.3v53.6c-16.3-4.2-33.6-4.8-52,4.5V100.8c18.3-10.6,35.4-10,52-5.3V45.7a243.3,243.3,0,0,1,24.8,9.7c10,4.2,20.4,8.7,31.2,11.5v49.9c16.6,4.7,33.7,5.3,52-5.3v52.4C189.7,176.2,173.1,175.6,156,170.3Z" />
							</svg>
							<p>{sumRace(toon)} / 30</p>
						</div>
						<div className="activity-header trophy-total">
							{trophyIcon(getRaceTrophies(toon))}
						</div>
					</div>
					{toon.data.data.racing ? (
						renderStats(toon.data.data.racing, race_trophies)
					) : (
						<p>No racing data found.</p>
					)}
				</div>
			</div>
		</AnimatedTabContent>
	);
};

export default ActivityTab;
