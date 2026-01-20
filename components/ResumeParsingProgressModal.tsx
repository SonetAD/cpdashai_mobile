import React from 'react';
import { View, Text, Modal, ActivityIndicator, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header with gradient */}
          <LinearGradient
            colors={['#10B981', '#34D399']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>
              Uploading Your Resume
            </Text>
            <Text style={styles.headerSubtitle}>
              Please wait while we process your document
            </Text>

            {/* Status Badge */}
            <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                <View style={styles.badgeDot} />
                <Text style={styles.badgeText}>
                  {status === 'pending' ? 'Pending' : status === 'in_progress' ? 'Processing' : status === 'completed' ? 'Completed' : status === 'failed' ? 'Failed' : 'Processing'}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            {/* Stage Icon */}
            <View style={styles.iconSection}>
              <View style={styles.iconContainer}>
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
                  <ActivityIndicator size="large" color="#10B981" />
                )}
              </View>

              <Text style={styles.stageLabel}>
                {stageLabel}
              </Text>
              {message && (
                <Text style={styles.stageMessage}>
                  {message}
                </Text>
              )}
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressValue}>{Math.round(progress)}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressPercentage,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Processing Steps */}
            <View style={styles.stepsContainer}>
              <StepItem
                label="Uploading file"
                completed={progress > 10}
                active={stage === 'file_validation'}
              />
              <StepItem
                label="Extracting content"
                completed={progress > 30}
                active={stage === 'text_extraction'}
              />
              <StepItem
                label="AI parsing resume"
                completed={progress > 70}
                active={stage === 'ai_parsing'}
              />
              <StepItem
                label="Creating resume"
                completed={progress > 90}
                active={stage === 'profile_update'}
              />
              <StepItem
                label="Complete"
                completed={progress === 100}
                active={stage === 'completion'}
              />
            </View>

            {/* Info note */}
            <View style={styles.infoNote}>
              <Text style={styles.infoText}>
                This process may take 30-60 seconds depending on resume complexity
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
    <View style={styles.stepItem}>
      <View
        style={[
          styles.stepDot,
          completed ? styles.stepDotCompleted : active ? styles.stepDotActive : styles.stepDotPending,
        ]}
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
          <View style={styles.stepDotInner} />
        ) : null}
      </View>
      <Text
        style={[
          styles.stepLabel,
          completed ? styles.stepLabelCompleted : active ? styles.stepLabelActive : styles.stepLabelPending,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: Math.min(SCREEN_WIDTH - 48, 400),
    maxHeight: SCREEN_HEIGHT * 0.85,
    overflow: 'hidden',
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeDot: {
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    marginRight: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  content: {
    padding: 24,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    borderRadius: 50,
    padding: 24,
    marginBottom: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  stageLabel: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  stageMessage: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  progressValue: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },
  progressTrack: {
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    height: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  stepsContainer: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepDotCompleted: {
    backgroundColor: '#10B981',
  },
  stepDotActive: {
    backgroundColor: '#10B981',
  },
  stepDotPending: {
    backgroundColor: '#D1D5DB',
  },
  stepDotInner: {
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  stepLabel: {
    flex: 1,
    fontSize: 14,
  },
  stepLabelCompleted: {
    color: '#059669',
    fontWeight: '600',
  },
  stepLabelActive: {
    color: '#059669',
    fontWeight: '600',
  },
  stepLabelPending: {
    color: '#6B7280',
  },
  infoNote: {
    marginTop: 24,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    color: '#065F46',
    fontSize: 12,
    textAlign: 'center',
  },
});
