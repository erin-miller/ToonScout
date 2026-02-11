import { useState } from 'react';
import { imageAssets } from '@/assets/images';

const ArrowButton = ({ onClick }: { onClick: () => void }) => {
	const clickedImg = imageAssets.button_clicked.src;
	const unclickedImg = imageAssets.button_unclicked.src;
	const [isPressed, setIsPressed] = useState(false);

	return (
		<button
			onMouseDown={() => {
				setIsPressed(true);
			}}
			onMouseUp={() => {
				setIsPressed(false);
			}}
			onMouseLeave={() => {
				setIsPressed(false);
			}}
			onClick={onClick}
			className="discord-btn"
			style={{
				backgroundImage: `url(${isPressed ? clickedImg : unclickedImg})`,
				backgroundSize: 'contain',
				backgroundPosition: 'center',
				cursor: 'pointer',
			}}
		></button>
	);
};

export default ArrowButton;
