import React from 'react';
import { createPortal } from 'react-dom';

interface ToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
  duration?: number;
  persistent?: boolean; // If true, only dismiss manually
  children?: React.ReactNode; // For custom content (e.g. icons)
}

const Toast: React.FC<ToastProps> = ({
	message,
	show,
	onClose,
	duration = 4000,
	persistent = false,
	children,
}) => {
	React.useEffect(() => {
		if (!show || persistent) return;
		const timer = setTimeout(onClose, duration);
		return () => clearTimeout(timer);
	}, [show, duration, onClose, persistent]);

	if (!show) return null;

	const toastContent = (
		<div className="fixed bottom-8 right-8 z-50 bg-pink-700 text-white px-6 py-3 rounded-lg shadow-lg text-lg animate-fade-in flex items-center gap-2">
			{children}
			<span className="ml-2 font-semibold text-xl drop-shadow-sm">
				{message}
			</span>
			<button
				className="ml-4 text-2xl font-bold hover:text-pink-300 focus:outline-none"
				onClick={onClose}
				aria-label="Dismiss notification"
			>
        ×
			</button>
		</div>
	);

	return createPortal(toastContent, document.body);
};

export default Toast;
