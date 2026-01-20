import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Animated,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, useKeyboardHandler } from 'react-native-keyboard-controller';
import Reanimated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

// Icons
const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18L9 12L15 6"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SendIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LockIcon = ({ color = "#6B7280" }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronRightIcon = ({ color = "#6B7280" }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const MicIcon = ({ color = "white" }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19 10V12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12V10"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 19V23M8 23H16"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const StopIcon = ({ color = "white" }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 6H18V18H6V6Z"
      fill={color}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const MenuIcon = ({ color = "white" }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="5" r="1.5" fill={color} />
    <Circle cx="12" cy="12" r="1.5" fill={color} />
    <Circle cx="12" cy="19" r="1.5" fill={color} />
  </Svg>
);

const NewChatIcon = ({ color = "#1F2937" }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5V19M5 12H19"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ArchiveIcon = ({ color = "#1F2937" }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 8V21H3V8M23 3H1V8H23V3Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10 12H14"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TrashIcon = ({ color = "#EF4444" }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6H5H21M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const HistoryIcon = ({ color = "white" }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChatIcon = ({ color = "#6B7280" }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const VoiceMicIcon = ({ color = "white" }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z"
      fill={color}
    />
    <Path
      d="M19 10V12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12V10"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M12 19V23M8 23H16"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

// Voice message waveform bars component
const VoiceWaveform = ({ color = "white", barCount = 12 }: { color?: string; barCount?: number }) => {
  // Generate random-looking but consistent bar heights
  const barHeights = [0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.4, 0.7, 0.5, 0.85, 0.6, 0.75];

  return (
    <View style={waveformStyles.container}>
      {barHeights.slice(0, barCount).map((height, index) => (
        <View
          key={index}
          style={[
            waveformStyles.bar,
            {
              height: 16 * height,
              backgroundColor: color,
            },
          ]}
        />
      ))}
    </View>
  );
};

const waveformStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 20,
  },
  bar: {
    width: 3,
    borderRadius: 1.5,
    minHeight: 4,
  },
});

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  audioUrl?: string;      // For user voice messages
  ttsAudioUrl?: string;   // For AI TTS response audio
  isVoice?: boolean;      // Whether this was a voice message
}

export interface ConversationItem {
  id: string;
  title: string;
  status?: string;
  messageCount?: number;
  lastMessageAt?: string | null;
  createdAt: string;
}

export interface QuickAction {
  label: string;
  message: string;
}

export interface AIChatTheme {
  headerGradient: string[];
  userBubbleGradient: string[];
  accentColor: string;
}

export const AI_THEMES = {
  ray: {
    headerGradient: ['#06B6D4', '#3B82F6', '#06B6D4'],
    userBubbleGradient: ['#06B6D4', '#3B82F6'],
    accentColor: '#06B6D4',
  },
  clara: {
    headerGradient: ['#8B5CF6', '#6366F1', '#8B5CF6'],
    userBubbleGradient: ['#8B5CF6', '#6366F1'],
    accentColor: '#8B5CF6',
  },
};

interface AIChatScreenProps {
  title: string;
  avatarComponent: React.ReactNode;
  emptyAvatarComponent?: React.ReactNode;
  theme: AIChatTheme;
  welcomeTitle: string;
  welcomeSubtitle: string;
  quickActions: QuickAction[];
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onBack: () => void;
  isLoading?: boolean;
  isInitializing?: boolean;
  inputPlaceholder?: string;
  // Feature gating
  hasAccess?: boolean;
  requiredLevelDisplay?: string;
  onUnlockPress?: () => void;
  // Voice message support
  onSendVoiceMessage?: (audioBase64: string) => void;
  isRecording?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  voiceEnabled?: boolean;
  // Conversation management
  onNewChat?: () => void;
  onArchiveChat?: () => void;
  onDeleteChat?: () => void;
  showConversationMenu?: boolean;
  // Bottom offset for tab bar
  bottomOffset?: number;
  // Chat history
  conversations?: ConversationItem[];
  onSelectConversation?: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  onRefreshConversations?: () => void;
  currentConversationId?: string | null;
  isLoadingConversations?: boolean;
}

export default function AIChatScreen({
  title,
  avatarComponent,
  emptyAvatarComponent,
  theme,
  welcomeTitle,
  welcomeSubtitle,
  quickActions,
  messages,
  onSendMessage,
  onBack,
  isLoading = false,
  isInitializing = false,
  inputPlaceholder = "Type a message...",
  hasAccess = true,
  requiredLevelDisplay,
  onUnlockPress,
  // Voice message props
  onSendVoiceMessage,
  isRecording = false,
  onStartRecording,
  onStopRecording,
  voiceEnabled = false,
  // Conversation management props
  onNewChat,
  onArchiveChat,
  onDeleteChat,
  showConversationMenu = false,
  // Bottom offset for tab bar
  bottomOffset = 0,
  // Chat history props
  conversations = [],
  onSelectConversation,
  onDeleteConversation,
  onRefreshConversations,
  currentConversationId,
  isLoadingConversations = false,
}: AIChatScreenProps) {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [menuVisible, setMenuVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Keyboard-aware bottom padding
  const keyboardHeight = useSharedValue(0);

  useKeyboardHandler({
    onMove: (e) => {
      'worklet';
      keyboardHeight.value = e.height;
    },
    onEnd: (e) => {
      'worklet';
      keyboardHeight.value = e.height;
    },
  }, []);

  const inputAnimatedStyle = useAnimatedStyle(() => {
    const isKeyboardOpen = keyboardHeight.value > 0;
    return {
      paddingBottom: withTiming(isKeyboardOpen ? 12 : Math.max(insets.bottom, 16) + bottomOffset, { duration: 150 }),
    };
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Pulse animation for recording indicator
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const handleMicPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRecording) {
      onStopRecording?.();
    } else {
      onStartRecording?.();
    }
  };

  const handleMenuAction = (action: () => void | undefined) => {
    setMenuVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action?.();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setHistoryVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectConversation?.(conversationId);
  };

  const handleDeleteConversationItem = (conversationId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDeleteConversation?.(conversationId);
  };

  const handleSend = () => {
    if (inputText.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText(action.message);
  };

  const hasMessages = messages.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={theme.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onBack();
          }}
        >
          <View style={styles.backButtonCircle}>
            <BackIcon />
          </View>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{title}</Text>

        <View style={styles.headerRight}>
          {conversations.length > 0 && (
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onRefreshConversations?.();
                setHistoryVisible(true);
              }}
            >
              <HistoryIcon />
            </TouchableOpacity>
          )}
          {showConversationMenu && (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMenuVisible(true);
              }}
            >
              <MenuIcon />
            </TouchableOpacity>
          )}
          <View style={styles.headerAvatar}>
            {avatarComponent}
          </View>
        </View>
      </LinearGradient>

      {/* Conversation Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuContainer, { top: insets.top + 60 }]}>
            {onNewChat && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuAction(onNewChat)}
              >
                <NewChatIcon />
                <Text style={styles.menuItemText}>New Chat</Text>
              </TouchableOpacity>
            )}
            {onArchiveChat && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuAction(onArchiveChat)}
              >
                <ArchiveIcon />
                <Text style={styles.menuItemText}>Archive Chat</Text>
              </TouchableOpacity>
            )}
            {onDeleteChat && (
              <>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuAction(onDeleteChat)}
                >
                  <TrashIcon />
                  <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete Chat</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Chat History Modal */}
      <Modal
        visible={historyVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHistoryVisible(false)}
      >
        <View style={styles.historyModalOverlay}>
          <TouchableOpacity
            style={styles.historyModalBackdrop}
            activeOpacity={1}
            onPress={() => setHistoryVisible(false)}
          />
          <View style={[styles.historyModalContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            {/* Drag Handle */}
            <View style={styles.historyDragHandle}>
              <View style={styles.historyDragBar} />
            </View>

            {/* History Header */}
            <View style={styles.historyHeader}>
              <View style={styles.historyHeaderLeft}>
                <View style={[styles.historyHeaderIcon, { backgroundColor: `${theme.accentColor}15` }]}>
                  <HistoryIcon color={theme.accentColor} />
                </View>
                <Text style={styles.historyTitle}>Chat History</Text>
              </View>
              <TouchableOpacity
                style={[styles.historyCloseButton, { backgroundColor: `${theme.accentColor}15` }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setHistoryVisible(false);
                }}
              >
                <Text style={[styles.historyCloseText, { color: theme.accentColor }]}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* New Chat Button */}
            {onNewChat && (
              <TouchableOpacity
                style={styles.newChatButton}
                onPress={() => {
                  setHistoryVisible(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onNewChat();
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={theme.userBubbleGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.newChatButtonGradient}
                >
                  <NewChatIcon color="white" />
                  <Text style={styles.newChatButtonText}>Start New Chat</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Conversations List */}
            <ScrollView
              style={styles.historyList}
              contentContainerStyle={styles.historyListContent}
              showsVerticalScrollIndicator={false}
            >
              {isLoadingConversations ? (
                <View style={styles.historyLoading}>
                  <View style={[styles.historyLoadingSpinner, { borderColor: `${theme.accentColor}20`, borderTopColor: theme.accentColor }]}>
                    <ActivityIndicator size="large" color={theme.accentColor} />
                  </View>
                  <Text style={styles.historyLoadingText}>Loading conversations...</Text>
                </View>
              ) : conversations.length === 0 ? (
                <View style={styles.historyEmpty}>
                  <View style={styles.historyEmptyIconContainer}>
                    <ChatIcon color="#D1D5DB" />
                  </View>
                  <Text style={styles.historyEmptyTitle}>No conversations yet</Text>
                  <Text style={styles.historyEmptySubtitle}>Start a new chat to begin</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.historySectionLabel}>Recent Conversations</Text>
                  {conversations.map((conv, index) => {
                    const isActive = currentConversationId === conv.id;
                    return (
                      <TouchableOpacity
                        key={conv.id}
                        style={[
                          styles.conversationCard,
                          isActive && [styles.conversationCardActive, { borderColor: theme.accentColor }],
                          index === conversations.length - 1 && { marginBottom: 0 },
                        ]}
                        onPress={() => handleSelectConversation(conv.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.conversationIcon,
                          isActive && { backgroundColor: `${theme.accentColor}15` }
                        ]}>
                          <ChatIcon color={isActive ? theme.accentColor : '#9CA3AF'} />
                        </View>
                        <View style={styles.conversationInfo}>
                          <Text
                            style={[
                              styles.conversationTitle,
                              isActive && { color: theme.accentColor }
                            ]}
                            numberOfLines={1}
                          >
                            {conv.title}
                          </Text>
                          <Text style={styles.conversationDate}>
                            {formatDate(conv.lastMessageAt || conv.createdAt)}
                          </Text>
                        </View>
                        {onDeleteConversation && (
                          <TouchableOpacity
                            style={styles.conversationDeleteButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDeleteConversationItem(conv.id);
                            }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <View style={styles.conversationDeleteIconBg}>
                              <TrashIcon color="#EF4444" />
                            </View>
                          </TouchableOpacity>
                        )}
                        {isActive && (
                          <View style={[styles.conversationActiveBadge, { backgroundColor: theme.accentColor }]}>
                            <Text style={styles.conversationActiveBadgeText}>Active</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Chat Content */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior="padding"
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            !hasMessages && styles.emptyMessagesContent,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!hasMessages ? (
            // Empty State
            <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
              <View style={styles.emptyAvatarContainer}>
                {emptyAvatarComponent || avatarComponent}
              </View>
              <Text style={styles.emptyTitle}>{welcomeTitle}</Text>
              <Text style={styles.emptySubtitle}>{welcomeSubtitle}</Text>

              {/* Quick Actions */}
              <View style={styles.quickActionsContainer}>
                <Text style={styles.quickActionsTitle}>Suggested prompts</Text>
                <View style={styles.quickActions}>
                  {quickActions.map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.quickActionButton, { borderColor: theme.accentColor }]}
                      onPress={() => handleQuickAction(action)}
                    >
                      <Text style={[styles.quickActionText, { color: theme.accentColor }]}>
                        {action.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </Animated.View>
          ) : (
            // Messages
            <View style={styles.messagesList}>
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubbleContainer,
                    msg.isUser ? styles.userBubbleContainer : styles.aiBubbleContainer,
                  ]}
                >
                  {msg.isUser ? (
                    <LinearGradient
                      colors={theme.userBubbleGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.userBubble, msg.isVoice && styles.voiceBubble]}
                    >
                      {msg.isVoice ? (
                        <View style={styles.voiceMessageContent}>
                          <VoiceMicIcon color="white" />
                          <VoiceWaveform color="rgba(255, 255, 255, 0.9)" />
                          <Text style={styles.voiceDuration}>Voice</Text>
                        </View>
                      ) : (
                        <Text style={styles.userBubbleText}>{msg.text}</Text>
                      )}
                    </LinearGradient>
                  ) : (
                    <View style={styles.aiBubble}>
                      <Text style={styles.aiBubbleText}>{msg.text}</Text>
                    </View>
                  )}
                </View>
              ))}
              {isLoading && (
                <View style={styles.aiBubbleContainer}>
                  <View style={[styles.aiBubble, styles.typingBubble]}>
                    <View style={styles.typingIndicator}>
                      <ActivityIndicator size="small" color={theme.accentColor} style={{ marginRight: 8 }} />
                      <Text style={[styles.aiBubbleText, { color: '#6B7280' }]}>Thinking...</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <Reanimated.View style={[styles.inputContainer, inputAnimatedStyle]}>
          {hasAccess ? (
            <>
              {isRecording ? (
                // Recording state
                <View style={styles.recordingContainer}>
                  <Animated.View
                    style={[
                      styles.recordingIndicator,
                      { transform: [{ scale: pulseAnim }] }
                    ]}
                  >
                    <View style={styles.recordingDot} />
                  </Animated.View>
                  <Text style={styles.recordingText}>Recording...</Text>
                  <TouchableOpacity
                    style={[styles.stopButton, { backgroundColor: '#EF4444' }]}
                    onPress={handleMicPress}
                  >
                    <StopIcon />
                  </TouchableOpacity>
                </View>
              ) : (
                // Normal input state
                <>
                  {voiceEnabled && (
                    <TouchableOpacity
                      style={[styles.micButton, { backgroundColor: theme.accentColor }]}
                      onPress={handleMicPress}
                    >
                      <MicIcon />
                    </TouchableOpacity>
                  )}
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder={inputPlaceholder}
                      placeholderTextColor="#9CA3AF"
                      value={inputText}
                      onChangeText={setInputText}
                      multiline
                      maxLength={500}
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      { backgroundColor: theme.accentColor },
                      !inputText.trim() && styles.sendButtonDisabled,
                    ]}
                    onPress={handleSend}
                    disabled={!inputText.trim()}
                  >
                    <SendIcon />
                  </TouchableOpacity>
                </>
              )}
            </>
          ) : (
            <TouchableOpacity
              style={styles.lockedInputWrapper}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onUnlockPress?.();
              }}
              activeOpacity={0.7}
            >
              <LockIcon />
              <Text style={styles.lockedInputText}>
                Unlock at {requiredLevelDisplay || 'next'} Badge
              </Text>
              <ChevronRightIcon />
            </TouchableOpacity>
          )}
        </Reanimated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 12,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 16,
  },
  emptyMessagesContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingTop: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyAvatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 3,
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  quickActionsContainer: {
    width: '100%',
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  messagesList: {
    gap: 12,
  },
  messageBubbleContainer: {
    maxWidth: '80%',
  },
  userBubbleContainer: {
    alignSelf: 'flex-end',
  },
  aiBubbleContainer: {
    alignSelf: 'flex-start',
  },
  userBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomRightRadius: 4,
  },
  userBubbleText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
  },
  aiBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiBubbleText: {
    color: '#1F2937',
    fontSize: 15,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingHorizontal: 4,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  lockedInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  lockedInputText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  // Header right section
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Menu modal styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  menuItemTextDanger: {
    color: '#EF4444',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  // Recording styles
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 12,
  },
  recordingIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  recordingText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#EF4444',
  },
  stopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Voice message styles
  voiceBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  voiceMessageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  voiceDuration: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  // History button
  historyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Chat History Modal styles
  historyModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  historyModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  historyModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
    minHeight: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  historyDragHandle: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  historyDragBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  historyCloseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  historyCloseText: {
    fontSize: 15,
    fontWeight: '600',
  },
  newChatButton: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  newChatButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  newChatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  historyList: {
    flex: 1,
  },
  historyListContent: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  historySectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 4,
  },
  historyLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  historyLoadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyLoadingText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  historyEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  historyEmptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  historyEmptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  historyEmptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  conversationCardActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  conversationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  conversationDate: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  conversationDeleteButton: {
    padding: 8,
    marginLeft: 4,
  },
  conversationDeleteIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationActiveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  conversationActiveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
