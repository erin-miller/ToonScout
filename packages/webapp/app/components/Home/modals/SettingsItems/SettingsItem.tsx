import React from 'react';

type SettingsItemProps = {
  label: string;
  children: React.ReactNode;
};

const SettingsItem: React.FC<SettingsItemProps> = ({ label, children }) => {
	return (
		<div className="text-2xl flex flex-col gap-2 font-semibold">
			<span>{label}</span>
			<div className="font-normal">{children}</div>
		</div>
	);
};

export default SettingsItem;
