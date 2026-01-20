import React from 'react';
import { AppNavBar, CANDIDATE_TABS, AIAssistantOption } from './navigation';
import MessageIcon from '../assets/images/navbar/message.svg';
import ClaraIcon from '../assets/images/clara.svg';
import RayIcon from '../assets/images/aiInterview/ray.svg';

interface CandidateNavBarProps {
  activeTab?: string;
  onTabPress?: (tabId: string) => void;
  onAIAssistantPress?: () => void;
  /** Callback when Clara is selected from dropdown */
  onClaraPress?: () => void;
  /** Callback when Ray is selected from dropdown */
  onRayPress?: () => void;
}

// AI Assistant options for dropdown
const AI_ASSISTANT_OPTIONS: AIAssistantOption[] = [
  {
    id: 'clara',
    name: 'Clara',
    description: 'Career Coach',
    Icon: ClaraIcon,
  },
  {
    id: 'ray',
    name: 'Ray',
    description: 'Interview Coach',
    Icon: RayIcon,
  },
];

/**
 * Candidate bottom navigation bar with glassmorphism effect.
 * This is a thin wrapper around AppNavBar with candidate-specific configuration.
 */
export default function CandidateNavBar({
  activeTab = 'home',
  onTabPress,
  onAIAssistantPress,
  onClaraPress,
  onRayPress,
}: CandidateNavBarProps) {
  // Handle AI assistant selection
  const handleSelectAssistant = (assistantId: 'clara' | 'ray') => {
    if (assistantId === 'clara') {
      onClaraPress?.();
    } else if (assistantId === 'ray') {
      onRayPress?.();
    }
  };

  return (
    <AppNavBar
      tabs={CANDIDATE_TABS}
      activeTab={activeTab}
      onTabPress={onTabPress}
      fab={{
        enabled: true,
        Icon: MessageIcon,
        onPress: onAIAssistantPress,
        showDropdown: true,
        assistantOptions: AI_ASSISTANT_OPTIONS,
        onSelectAssistant: handleSelectAssistant,
      }}
    />
  );
}
