'use client';

import { ReactNode } from 'react';
import { ToonProvider } from '@/app/context/ToonContext';
import { ConnectionProvider } from '@/app/context/ConnectionContext';
import { DiscordProvider } from '@/app/context/DiscordContext';
import { ActivePortsProvider } from '../context/ActivePortsContext';
import { InvasionProvider } from '@/app/context/InvasionContext';
import {
	NotificationToastWrapper,
	ToastProvider,
} from '@/app/context/ToastContext';
import { useNotificationSettingsPoll } from '../utils/notificationUtils';
import { EventProvider } from '../context/EventContext';

interface ProvidersProps {
  children: ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
	return (
		<ToastProvider>
			<ToonProvider>
				<DiscordProvider>
					<ConnectionProvider>
						<ActivePortsProvider>
							<InvasionProvider>
								<EventProvider>
									<NotificationToastWrapper
										notifSettings={useNotificationSettingsPoll(500)}
									>
										{children}
									</NotificationToastWrapper>
								</EventProvider>
							</InvasionProvider>
						</ActivePortsProvider>
					</ConnectionProvider>
				</DiscordProvider>
			</ToonProvider>
		</ToastProvider>
	);
};

export default Providers;
