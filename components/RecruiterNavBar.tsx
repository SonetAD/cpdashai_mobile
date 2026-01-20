import React from 'react';
import { AppNavBar, RECRUITER_TABS } from './navigation';
import MessageIcon from '../assets/images/navbar/message.svg';

interface RecruiterNavBarProps {
  activeTab?: string;
  onTabPress?: (tabId: string) => void;
  onAIAssistantPress?: () => void;
}

/**
 * Recruiter/Talent Partner bottom navigation bar with glassmorphism effect.
 * This is a thin wrapper around AppNavBar with recruiter-specific configuration.
 */
export default function RecruiterNavBar({
  activeTab = 'home',
  onTabPress,
  onAIAssistantPress,
}: RecruiterNavBarProps) {
  return (
    <AppNavBar
      tabs={RECRUITER_TABS}
      activeTab={activeTab}
      onTabPress={onTabPress}
      fab={{
        enabled: true,
        Icon: MessageIcon,
        onPress: onAIAssistantPress,
      }}
    />
  );
}
