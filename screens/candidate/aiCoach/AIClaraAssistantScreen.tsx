import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import AIChatScreen, { ChatMessage, AI_THEMES } from '../../../components/AIChatScreen';
import { useFeatureAccess } from '../../../contexts/FeatureGateContext';
import ClaraSvg from '../../../assets/images/aiInterview/girl.svg';

interface AIClaraAssistantScreenProps {
  onBack?: () => void;
}

const CLARA_QUICK_ACTIONS = [
  { label: 'Feeling stressed', message: "I'm feeling stressed about my job search" },
  { label: 'Work-life balance', message: 'Help me maintain work-life balance' },
  { label: 'Build confidence', message: 'Help me build my confidence' },
  { label: 'Stay motivated', message: 'I need help staying motivated in my career journey' },
];

export default function AIClaraAssistantScreen({
  onBack,
}: AIClaraAssistantScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const router = useRouter();
  // Clara is the Mental Wellbeing Companion - unlocks at Interview Ready level (41+ CRS)
  const { hasAccess, requiredLevelDisplay } = useFeatureAccess('interview_coach_full');

  const handleSendMessage = (text: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Hi there! I'm Clara, your AI Wellbeing Companion. I'm here to support your mental health and emotional wellbeing throughout your career journey. Whether you're feeling stressed, need motivation, or just want someone to talk to, I'm here for you. How are you feeling today?",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  const ClaraAvatarHeader = (
    <ClaraSvg width={42} height={42} />
  );

  const ClaraAvatarEmpty = (
    <ClaraSvg width={84} height={84} />
  );

  return (
    <AIChatScreen
      title="Talk to Clara"
      avatarComponent={ClaraAvatarHeader}
      emptyAvatarComponent={ClaraAvatarEmpty}
      theme={AI_THEMES.clara}
      welcomeTitle="Hi, I'm Clara!"
      welcomeSubtitle="Your AI Wellbeing Companion. I'm here to support your mental health, confidence, and emotional wellbeing throughout your career journey."
      quickActions={CLARA_QUICK_ACTIONS}
      messages={messages}
      onSendMessage={handleSendMessage}
      onBack={onBack || (() => {})}
      inputPlaceholder="Type a message..."
      hasAccess={hasAccess}
      requiredLevelDisplay={requiredLevelDisplay}
      onUnlockPress={() => router.push('/(candidate)/(tabs)/profile/full-profile' as any)}
      bottomOffset={75}
    />
  );
}
