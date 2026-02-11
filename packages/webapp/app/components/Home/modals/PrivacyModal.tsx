import React from 'react';
import Modal from '../../Modal';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
	if (!isOpen) return null;

	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<div className="">
				<div className="minnie-title text-3xl">Privacy Policy</div>
				<div className="text-2xl py-2 text-gray-1000 dark:text-gray-100">
          Last Updated: January 6th, 2025
				</div>
				<div className="space-y-2">
					<div>
            Welcome to ToonScout! Your privacy is important to us. This Privacy
            Policy explains how we collect, use, and protect your information.
					</div>
					<h3 className="privacy-title">Information We Collect</h3>
					<div>
            We use Google Analytics to collect site metrics, such as page views
            and user activity. This data is anonymous and helps us improve our
            website. No personally identifiable information is collected through
            Google Analytics.
					</div>
					<div className="privacy-title">Discord Authorization Data</div>
					<div>
            If you authenticate with Discord, we store:
						<ul className="list-inside list-disc">
							<li>Your Discord ID</li>
							<li>Your most recent Toon data</li>
							<li>
                An access token, stored in a cookie for authentication purposes
							</li>
						</ul>
					</div>
					<div className="privacy-title">How We Use Your Information</div>
					<div>
            Your data is used to provide ToonScout&apos;s features and services
            on Discord.
					</div>
					<div className="privacy-title">Information Sharing</div>
					<div>
            We do not disclose or sell your information to any third parties.
					</div>
					<div className="privacy-title">Data Security</div>
					<div>
            We take reasonable measures to protect your data from unauthorized
            access or misuse.
					</div>
					<div className="privacy-title">Your Data</div>
					<div>
            If you no longer wish to use ToonScout, you may request that we
            delete your stored data by contacting us at the{' '}
						<a
							href={process.env.NEXT_PUBLIC_DISCORD_INVITE}
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-400 hover:underline"
						>
              support server
						</a>
            .
					</div>
				</div>
			</div>
		</Modal>
	);
};

export default PrivacyModal;
