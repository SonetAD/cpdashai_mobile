import React from 'react';
import { View, Text, Modal, ActivityIndicator, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';

interface ResumeParsingProgressModalProps {
  visible: boolean;
  progress: number;
  stage: string;
  stageLabel: string;
  message?: string;
  status?: string;
}

const CheckIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17L4 12"
      stroke="#10B981"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const DocumentIcon = ({ color = "#437EF4" }: { color?: string }) => (
  <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const AIIcon = ({ color = "#437EF4" }: { color?: string }) => (
  <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Circle cx="12" cy="12" r="3" fill={color} opacity={0.3} />
  </Svg>
);

const getStageIcon = (stage: string) => {
  switch (stage) {
    case 'file_validation':
    case 'text_extraction':
      return <DocumentIcon />;
    case 'ai_parsing':
    case 'profile_update':
      return <AIIcon />;
    case 'completion':
      return <CheckIcon />;
    default:
      return <DocumentIcon />;
  }
};

const getStageColor = (stage: string): string => {
  switch (stage) {
    case 'file_validation':
      return '#3B82F6';
    case 'text_extraction':
      return '#8B5CF6';
    case 'ai_parsing':
      return '#EC4899';
    case 'profile_update':
      return '#F59E0B';
    case 'completion':
      return '#10B981';
    default:
      return '#437EF4';
  }
};

export default function ResumeParsingProgressModal({
  visible,
  progress,
  stage,
  stageLabel,
  message,
  status = 'pending',
}: ResumeParsingProgressModalProps) {
  const animatedProgress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const progressPercentage = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const stageColor = getStageColor(stage);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-white rounded-3xl w-full max-w-md overflow-hidden">
          {/* Header with gradient */}
          <LinearGradient
            colors={['#437EF4', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="p-6"
          >
            <Text className="text-white text-xl font-bold text-center">
              Parsing Your Resume
            </Text>
            <Text className="text-white/90 text-sm text-center mt-1">
              Please wait while we analyze your document
            </Text>
            
            {/* Status Badge */}
            <View className="flex-row justify-center mt-3">
              <View className="bg-white/20 px-4 py-1.5 rounded-full flex-row items-center">
                <View className="w-2 h-2 bg-white rounded-full mr-2" />
                <Text className="text-white text-xs font-semibold uppercase">
                  {status === 'pending' ? 'Pending' : status === 'in_progress' ? 'Processing' : status === 'completed' ? 'Completed' : status === 'failed' ? 'Failed' : 'Processing'}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Content */}
          <View className="p-6">
            {/* Stage Icon */}
            <View className="items-center mb-6">
              <View
                className="rounded-full p-6 mb-4"
                style={{ backgroundColor: `${stageColor}15` }}
              >
                {stage === 'completion' ? (
                  <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                    <Circle cx="12" cy="12" r="10" fill="#10B981" opacity={0.2} />
                    <Path
                      d="M9 12l2 2 4-4"
                      stroke="#10B981"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                ) : (
                  <ActivityIndicator size="large" color={stageColor} />
                )}
              </View>

              <Text className="text-gray-900 text-lg font-bold text-center mb-2">
                {stageLabel}
              </Text>
              {message && (
                <Text className="text-gray-600 text-sm text-center">
                  {message}
                </Text>
              )}
            </View>

            {/* Progress Bar */}
            <View className="mb-6">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-700 font-semibold">Progress</Text>
                <Text className="text-primary-blue font-bold">{Math.round(progress)}%</Text>
              </View>
              <View className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <Animated.View
                  className="h-full rounded-full"
                  style={{
                    width: progressPercentage,
                    backgroundColor: stageColor,
                  }}
                />
              </View>
            </View>

            {/* Processing Steps */}
            <View className="space-y-2">
              <StepItem
                label="Validating file"
                completed={progress > 10}
                active={stage === 'file_validation'}
              />
              <StepItem
                label="Extracting text"
                completed={progress > 30}
                active={stage === 'text_extraction'}
              />
              <StepItem
                label="AI analyzing content"
                completed={progress > 70}
                active={stage === 'ai_parsing'}
              />
              <StepItem
                label="Updating profile"
                completed={progress > 90}
                active={stage === 'profile_update'}
              />
              <StepItem
                label="Finalizing"
                completed={progress === 100}
                active={stage === 'completion'}
              />
            </View>

            {/* Info note */}
            <View className="mt-6 bg-blue-50 rounded-xl p-4">
              <Text className="text-blue-800 text-xs text-center">
                💡 This process may take 30-60 seconds depending on resume complexity
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface StepItemProps {
  label: string;
  completed: boolean;
  active: boolean;
}

function StepItem({ label, completed, active }: StepItemProps) {
  return (
    <View className="flex-row items-center">
      <View
        className={`w-5 h-5 rounded-full items-center justify-center mr-3 ${
          completed ? 'bg-green-500' : active ? 'bg-blue-500' : 'bg-gray-300'
        }`}
      >
        {completed ? (
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path
              d="M20 6L9 17L4 12"
              stroke="white"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : active ? (
          <View className="w-2 h-2 bg-white rounded-full" />
        ) : null}
      </View>
      <Text
        className={`flex-1 text-sm ${
          completed ? 'text-green-700 font-semibold' : active ? 'text-blue-700 font-semibold' : 'text-gray-500'
        }`}
      >
        {label}
      </Text>
    </View>
  );
}
