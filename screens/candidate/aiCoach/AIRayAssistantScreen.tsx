import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import AIChatScreen, { ChatMessage, ConversationItem, AI_THEMES } from '../../../components/AIChatScreen';
import { useFeatureAccess } from '../../../contexts/FeatureGateContext';
import { useAlert } from '../../../contexts/AlertContext';
import {
  useCreateConversationMutation,
  useSendTextMessageMutation,
  useSendVoiceMessageMutation,
  useArchiveConversationMutation,
  useDeleteConversationMutation,
  useGetMyConversationsQuery,
  useLazyGetConversationMessagesQuery,
} from '../../../services/api';
import { handleApiError } from '../../../utils/errorHandler';
import RaySvg from '../../../assets/images/aiInterview/ray.svg';

interface AIRayAssistantScreenProps {
  onBack?: () => void;
}

const RAY_QUICK_ACTIONS = [
  { label: 'Interview prep', message: 'Help me prepare for a job interview' },
  { label: 'Career growth', message: 'Give me career growth advice' },
  { label: 'Salary negotiation', message: 'How to negotiate salary' },
  { label: 'Common questions', message: 'Help me with common interview questions' },
];

export default function AIRayAssistantScreen({
  onBack,
}: AIRayAssistantScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const retryMessageRef = useRef<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const router = useRouter();
  const { showAlert } = useAlert();
  // RAY is the AI Interview Coach - unlocks at Interview Ready level (41-60 CRS)
  const { hasAccess, requiredLevelDisplay } = useFeatureAccess('interview_coach_intro');

  // API hooks
  const [createConversation] = useCreateConversationMutation();
  const [sendTextMessage] = useSendTextMessageMutation();
  const [sendVoiceMessage] = useSendVoiceMessageMutation();
  const [archiveConversation] = useArchiveConversationMutation();
  const [deleteConversation] = useDeleteConversationMutation();
  const { data: conversationsData, refetch: refetchConversations, isLoading: isLoadingConversations } = useGetMyConversationsQuery();
  const [getConversationMessages] = useLazyGetConversationMessagesQuery();

  // Convert conversations data to ConversationItem format for chat history
  const conversationsList: ConversationItem[] = React.useMemo(() => {
    if (conversationsData?.myConversations?.__typename === 'ConversationListType') {
      return (conversationsData.myConversations.conversations || []).map((conv) => ({
        id: conv.id,
        title: conv.title,
        status: conv.status,
        messageCount: conv.messageCount,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt,
      }));
    }
    return [];
  }, [conversationsData]);

  // Handle selecting a conversation from history
  const handleSelectConversation = useCallback(async (selectedConversationId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setConversationId(selectedConversationId);
      setMessages([]);
      setIsInitializing(true);
      await loadConversationMessages(selectedConversationId);
    } catch (error) {
      console.error('Error selecting conversation:', error);
      await handleApiError(error, showAlert, {
        featureName: 'Chat History',
        customMessages: {
          default: 'Failed to load conversation. Please try again.',
        },
      });
    } finally {
      setIsInitializing(false);
    }
  }, [showAlert]);

  // Handle deleting a conversation from history
  const handleDeleteConversationFromHistory = useCallback((convIdToDelete: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showAlert({
      type: 'warning',
      title: 'Delete Conversation',
      message: 'Are you sure you want to delete this conversation? This action cannot be undone.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              const result = await deleteConversation({ conversationId: convIdToDelete }).unwrap();

              if (result.deleteConversation.__typename === 'ConversationSuccessType') {
                // If we deleted the current conversation, clear the messages
                if (convIdToDelete === conversationId) {
                  setMessages([]);
                  setConversationId(null);
                }
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                refetchConversations();
                showAlert({
                  type: 'success',
                  title: 'Deleted',
                  message: 'Conversation has been deleted.',
                });
              } else if (result.deleteConversation.__typename === 'ErrorType') {
                throw new Error(result.deleteConversation.message || 'Failed to delete');
              }
            } catch (error) {
              console.error('Error deleting conversation:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              await handleApiError(error, showAlert, {
                featureName: 'Delete Chat',
                customMessages: {
                  default: 'Failed to delete conversation. Please try again.',
                },
              });
            }
          },
        },
      ],
    });
  }, [conversationId, deleteConversation, refetchConversations, showAlert]);

  // Find existing Ray conversation or create new one
  useEffect(() => {
    const initializeConversation = async () => {
      if (!hasAccess) {
        setIsInitializing(false);
        return;
      }

      // Wait for conversations data to load before deciding to create new one
      if (isLoadingConversations) {
        return;
      }

      try {
        // Check for existing Ray conversation (by title)
        const conversations = conversationsData?.myConversations?.__typename === 'ConversationListType'
          ? conversationsData.myConversations.conversations
          : [];

        const existingConversation = conversations?.find(
          (conv) => conv.title === 'Career Coaching Session'
        );

        if (existingConversation) {
          setConversationId(existingConversation.id);
          // Load existing messages
          await loadConversationMessages(existingConversation.id);
        }
        // Don't auto-create conversation on init - let user trigger it by sending a message
        // This prevents "Authentication required" errors during early loading
      } catch (error) {
        console.error('Error initializing conversation:', error);
        // Don't show error on init - will try again when user sends message
      } finally {
        setIsInitializing(false);
      }
    };

    initializeConversation();
  }, [hasAccess, conversationsData, isLoadingConversations]);

  // Load messages from existing conversation
  const loadConversationMessages = async (convId: string) => {
    try {
      const result = await getConversationMessages({ conversationId: convId, limit: 50 }).unwrap();
      if (result.conversationMessages?.__typename === 'MessageListType' && result.conversationMessages.messages) {
        const loadedMessages: ChatMessage[] = result.conversationMessages.messages
          .map((msg) => ({
            id: msg.id,
            text: msg.content,
            isUser: msg.role === 'user',
            timestamp: new Date(msg.createdAt),
            audioUrl: msg.audioUrl,
            ttsAudioUrl: msg.ttsAudioUrl,
            isVoice: !!msg.audioUrl,
          }))
          // Sort by timestamp to ensure correct chronological order (oldest first)
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Error loading conversation messages:', error);
    }
  };

  // Handle sending message
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Add user message immediately (optimistic update)
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Create conversation if needed
      let activeConversationId = conversationId;
      if (!activeConversationId) {
        const createResult = await createConversation({
          title: 'Career Coaching Session',
        }).unwrap();

        if (createResult.createConversation.__typename === 'ConversationSuccessType' && createResult.createConversation.conversation?.id) {
          activeConversationId = createResult.createConversation.conversation.id;
          setConversationId(activeConversationId);
        } else {
          throw new Error('Failed to create conversation');
        }
      }

      // Send message to API
      const result = await sendTextMessage({
        conversationId: activeConversationId,
        content: text,
      }).unwrap();

      if (result.sendTextMessage.__typename === 'SendMessageSuccessType' && result.sendTextMessage.assistantMessage) {
        // Update conversation ID if it was created
        if (result.sendTextMessage.conversationId && !conversationId) {
          setConversationId(result.sendTextMessage.conversationId);
        }

        // Add AI response
        const aiMessage: ChatMessage = {
          id: result.sendTextMessage.assistantMessage.id || `ai-${Date.now()}`,
          text: result.sendTextMessage.assistantMessage.content,
          isUser: false,
          timestamp: new Date(result.sendTextMessage.assistantMessage.createdAt || new Date()),
        };
        setMessages((prev) => [...prev, aiMessage]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (result.sendTextMessage.__typename === 'ErrorType') {
        throw new Error(result.sendTextMessage.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      retryMessageRef.current = text;

      // Remove the optimistically added user message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));

      await handleApiError(error, showAlert, {
        onRetry: () => {
          if (retryMessageRef.current) {
            handleSendMessage(retryMessageRef.current);
            retryMessageRef.current = null;
          }
        },
        featureName: 'Ray AI',
        customMessages: {
          network: 'Unable to reach Ray. Please check your internet connection.',
          server: 'Ray is taking a break. Please try again in a moment.',
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, createConversation, sendTextMessage, showAlert]);

  // Handle quick action
  const handleQuickAction = useCallback((message: string) => {
    handleSendMessage(message);
  }, [handleSendMessage]);

  // Voice recording handlers
  const handleStartRecording = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Request permissions
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        showAlert({
          title: 'Permission Required',
          message: 'Microphone access is needed to record voice messages.',
          type: 'warning',
        });
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error starting recording:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      await handleApiError(error, showAlert, {
        featureName: 'Voice Recording',
        customMessages: {
          default: 'Failed to start recording. Please try again.',
        },
      });
    }
  }, [showAlert]);

  const handleStopRecording = useCallback(async () => {
    try {
      if (!recordingRef.current) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsRecording(false);

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (!uri) {
        throw new Error('No recording URI');
      }

      // Convert audio to base64
      const audioBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Add optimistic user message
      const userMessage: ChatMessage = {
        id: `voice-${Date.now()}`,
        text: 'Voice message',
        isUser: true,
        timestamp: new Date(),
        isVoice: true,
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Create conversation if needed
      let activeConversationId = conversationId;
      if (!activeConversationId) {
        const createResult = await createConversation({
          title: 'Career Coaching Session',
        }).unwrap();

        if (createResult.createConversation.__typename === 'ConversationSuccessType' && createResult.createConversation.conversation?.id) {
          activeConversationId = createResult.createConversation.conversation.id;
          setConversationId(activeConversationId);
        } else {
          throw new Error('Failed to create conversation');
        }
      }

      // Send voice message
      const result = await sendVoiceMessage({
        conversationId: activeConversationId,
        audioBase64,
      }).unwrap();

      if (result.sendVoiceMessage.__typename === 'SendMessageSuccessType' && result.sendVoiceMessage.assistantMessage) {
        // Update conversation ID if it was created
        if (result.sendVoiceMessage.conversationId && !conversationId) {
          setConversationId(result.sendVoiceMessage.conversationId);
        }

        // Update user message with transcription if available
        if (result.sendVoiceMessage.userMessage?.content) {
          setMessages((prev) => prev.map((msg) =>
            msg.id === userMessage.id
              ? { ...msg, text: result.sendVoiceMessage.userMessage!.content }
              : msg
          ));
        }

        // Add AI response
        const aiMessage: ChatMessage = {
          id: result.sendVoiceMessage.assistantMessage.id || `ai-${Date.now()}`,
          text: result.sendVoiceMessage.assistantMessage.content,
          isUser: false,
          timestamp: new Date(result.sendVoiceMessage.assistantMessage.createdAt || new Date()),
          ttsAudioUrl: result.sendVoiceMessage.assistantMessage.ttsAudioUrl,
        };
        setMessages((prev) => [...prev, aiMessage]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (result.sendVoiceMessage.__typename === 'ErrorType') {
        throw new Error(result.sendVoiceMessage.message || 'Failed to process voice message');
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith('voice-')));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      await handleApiError(error, showAlert, {
        featureName: 'Voice Message',
        customMessages: {
          network: 'Unable to send voice message. Please check your connection.',
          server: 'Ray is having trouble processing voice messages. Please try again.',
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, createConversation, sendVoiceMessage, showAlert]);

  // Conversation management handlers
  const handleNewChat = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Archive current conversation if exists
      if (conversationId) {
        await archiveConversation({ conversationId }).unwrap();
      }

      // Reset state
      setMessages([]);
      setConversationId(null);

      // Create new conversation
      const result = await createConversation({
        title: 'Career Coaching Session',
      }).unwrap();

      if (result.createConversation.__typename === 'ConversationSuccessType' && result.createConversation.conversation?.id) {
        setConversationId(result.createConversation.conversation.id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        refetchConversations();
      } else {
        throw new Error('Failed to create new conversation');
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      await handleApiError(error, showAlert, {
        featureName: 'New Chat',
        customMessages: {
          default: 'Failed to create new chat. Please try again.',
        },
      });
    }
  }, [conversationId, archiveConversation, createConversation, refetchConversations, showAlert]);

  const handleArchiveChat = useCallback(async () => {
    if (!conversationId) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await archiveConversation({ conversationId }).unwrap();

      if (result.archiveConversation.__typename === 'ConversationSuccessType') {
        setMessages([]);
        setConversationId(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        refetchConversations();
        showAlert({
          title: 'Chat Archived',
          message: 'Your conversation has been archived.',
          type: 'success',
        });
      } else if (result.archiveConversation.__typename === 'ErrorType') {
        throw new Error(result.archiveConversation.message || 'Failed to archive chat');
      }
    } catch (error) {
      console.error('Error archiving chat:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      await handleApiError(error, showAlert, {
        featureName: 'Archive Chat',
        customMessages: {
          default: 'Failed to archive chat. Please try again.',
        },
      });
    }
  }, [conversationId, archiveConversation, refetchConversations, showAlert]);

  const handleDeleteChat = useCallback(() => {
    if (!conversationId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showAlert({
      type: 'warning',
      title: 'Delete Conversation',
      message: 'Are you sure you want to delete this conversation? This action cannot be undone.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

              const result = await deleteConversation({ conversationId }).unwrap();

              if (result.deleteConversation.__typename === 'ConversationSuccessType') {
                setMessages([]);
                setConversationId(null);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                refetchConversations();
                showAlert({
                  title: 'Chat Deleted',
                  message: 'Your conversation has been permanently deleted.',
                  type: 'success',
                });
              } else if (result.deleteConversation.__typename === 'ErrorType') {
                throw new Error(result.deleteConversation.message || 'Failed to delete chat');
              }
            } catch (error) {
              console.error('Error deleting chat:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              await handleApiError(error, showAlert, {
                featureName: 'Delete Chat',
                customMessages: {
                  default: 'Failed to delete chat. Please try again.',
                },
              });
            }
          },
        },
      ],
    });
  }, [conversationId, deleteConversation, refetchConversations, showAlert]);

  const RayAvatarHeader = (
    <RaySvg width={42} height={42} />
  );

  const RayAvatarEmpty = (
    <RaySvg width={84} height={84} />
  );

  return (
    <AIChatScreen
      title="Talk to RAY"
      avatarComponent={RayAvatarHeader}
      emptyAvatarComponent={RayAvatarEmpty}
      theme={AI_THEMES.ray}
      welcomeTitle="Hi, I'm Ray!"
      welcomeSubtitle="Your AI Career Coach. Ask me about interviews, career advice, salary negotiation, and more."
      quickActions={RAY_QUICK_ACTIONS}
      messages={messages}
      onSendMessage={handleSendMessage}
      onBack={onBack || (() => {})}
      inputPlaceholder="Type a message..."
      hasAccess={hasAccess}
      requiredLevelDisplay={requiredLevelDisplay || undefined}
      onUnlockPress={() => router.push('/(candidate)/(tabs)/profile/full-profile' as any)}
      isLoading={isLoading}
      isInitializing={isInitializing}
      // Voice message support
      voiceEnabled={hasAccess}
      isRecording={isRecording}
      onStartRecording={handleStartRecording}
      onStopRecording={handleStopRecording}
      // Conversation management
      showConversationMenu={hasAccess && messages.length > 0}
      onNewChat={handleNewChat}
      onArchiveChat={handleArchiveChat}
      onDeleteChat={handleDeleteChat}
      // Chat history
      conversations={conversationsList}
      onSelectConversation={handleSelectConversation}
      onDeleteConversation={handleDeleteConversationFromHistory}
      onRefreshConversations={refetchConversations}
      currentConversationId={conversationId}
      isLoadingConversations={isLoadingConversations}
      // Account for bottom tab bar height
      bottomOffset={75}
    />
  );
}
