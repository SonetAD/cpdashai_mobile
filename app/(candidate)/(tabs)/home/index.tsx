import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import Svg, { Path } from 'react-native-svg';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import CandidateLayout from '../../../../components/layouts/CandidateLayout';
import SearchModal from '../../../../components/SearchModal';
import PremiumUpgradeBanner from '../../../../components/PremiumUpgradeBanner';
import { useParseAndCreateResumeMutation, useExportResumePdfMutation, useCheckSubscriptionStatusQuery } from '../../../../services/api';
import { useAlert } from '../../../../contexts/AlertContext';
import { RootState } from '../../../../store/store';

// Import SVG assets
import UploadCVIcon from '../../../../assets/images/homepage/uploadCV.svg';
import FindJobsIcon from '../../../../assets/images/homepage/findJobs.svg';
import PracticeInterviewIcon from '../../../../assets/images/homepage/practiceInterview.svg';
import SkillGraphIcon from '../../../../assets/images/homepage/skillGraph.svg';
import TrophyIcon from '../../../../assets/images/homepage/trophy.svg';
import CircleCheckIcon from '../../../../assets/images/homepage/circleCheck.svg';
import MessageIcon from '../../../../assets/images/homepage/message.svg';
import IdeaIcon from '../../../../assets/images/homepage/idea.svg';

// Quick Action Card Component with haptics and animations
interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  delay?: number;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ icon, title, description, onPress, delay = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Entrance animation with delay
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="bg-white rounded-2xl p-4 items-center flex-1 shadow-sm"
        style={{ minHeight: 160 }}
        activeOpacity={1}
      >
        <View className="mb-3">{icon}</View>
        <Text className="text-gray-900 text-base font-bold mb-2 text-center">{title}</Text>
        <Text className="text-gray-400 text-xs text-center leading-4">{description}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Job Card Component with haptics and animations
interface JobCardProps {
  position: string;
  description: string;
  company: string;
  location: string;
  jobType: string;
  salary: string;
  skills: string[];
  aiInsight: string;
  badgeColor?: string;
  onViewAll?: () => void;
  onApply?: () => void;
  onSave?: () => void;
}

const JobCard: React.FC<JobCardProps> = ({
  position,
  description,
  company,
  location,
  jobType,
  salary,
  skills,
  aiInsight,
  badgeColor = '#437EF4',
  onViewAll,
  onApply,
  onSave,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    // Entrance animation
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }, 300);
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewAll?.();
  };

  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApply?.();
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave?.();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        className="bg-white rounded-2xl p-5 mb-4 shadow-sm"
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View className="flex-row items-center mb-3">
          <View
            className="rounded-full mr-2"
            style={{ width: 8, height: 8, backgroundColor: badgeColor }}
          />
          <Text className="text-gray-500 text-xs">Position</Text>
        </View>
        <Text className="text-gray-900 text-xl font-bold mb-2">{position}</Text>
        <Text className="text-gray-400 text-sm leading-5 mb-4">{description}</Text>
        <Text className="text-primary-blue text-base font-semibold mb-3">{company}</Text>
        <View className="mb-4">
          <Text className="text-gray-500 text-sm mb-1">• {location}</Text>
          <Text className="text-gray-500 text-sm mb-1">• {jobType}</Text>
          <Text className="text-gray-500 text-sm">• {salary}</Text>
        </View>
        <View className="flex-row flex-wrap mb-4">
          {skills.map((skill, index) => (
            <View key={index} className="bg-primary-cyan/20 rounded-lg px-3 py-2 mr-2 mb-2">
              <Text className="text-primary-cyan text-xs font-medium">{skill}</Text>
            </View>
          ))}
        </View>
        <View className="bg-yellow-50 rounded-xl p-3 flex-row items-start mb-4">
          <View className="mr-2 mt-0.5">
            <IdeaIcon width={17} height={18} />
          </View>
          <Text className="text-gray-700 text-xs flex-1 leading-4">{aiInsight}</Text>
        </View>
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="bg-primary-blue rounded-xl py-3 flex-1 items-center"
            onPress={handleApply}
            activeOpacity={0.8}
          >
            <Text className="text-white text-sm font-semibold">Apply Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-primary-cyan rounded-xl py-3 flex-1 items-center"
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text className="text-white text-sm font-semibold">Save</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Activity Item Component with haptics and animations
interface ActivityItemProps {
  title: string;
  subtitle: string;
  dotColor: string;
  actionText: string;
  onActionPress: () => void;
  delay?: number;
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  title,
  subtitle,
  dotColor,
  actionText,
  onActionPress,
  delay = 0,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    onActionPress();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
      }}
      className="flex-row items-center justify-between mb-4"
    >
      <View className="flex-row items-start flex-1">
        <View
          className="rounded-full mt-1 mr-3"
          style={{ width: 8, height: 8, backgroundColor: dotColor }}
        />
        <View className="flex-1">
          <Text className="text-gray-900 text-sm font-semibold mb-0.5">{title}</Text>
          <Text className="text-gray-400 text-xs">{subtitle}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <Text className="text-primary-blue text-sm font-medium">{actionText}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Gamification Badge Component with haptics and animations
interface GamificationBadgeProps {
  icon: React.ReactNode;
  title: string;
  delay?: number;
  onPress?: () => void;
}

const GamificationBadge: React.FC<GamificationBadgeProps> = ({ icon, title, delay = 0, onPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1.15,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    onPress?.();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={{ flex: 1 }}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: Animated.multiply(scaleAnim, bounceAnim) }],
          alignItems: 'center',
        }}
      >
        <View style={{ marginBottom: 8 }}>{icon}</View>
        <Text style={{ color: '#111827', fontSize: 12, fontWeight: '700', textAlign: 'center' }}>{title}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const userName = user?.email?.split('@')[0] || 'User';

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  // Page entrance animation
  const pageOpacity = useRef(new Animated.Value(0)).current;
  const aiCompanionFade = useRef(new Animated.Value(0)).current;
  const aiCompanionSlide = useRef(new Animated.Value(30)).current;
  const aiCompanionScale = useRef(new Animated.Value(1)).current;

  // API hooks
  const [parseAndCreateResume] = useParseAndCreateResumeMutation();
  const [exportPdf] = useExportResumePdfMutation();
  const { showAlert } = useAlert();

  // Subscription status
  const { data: subscriptionData, refetch: refetchSubscription } = useCheckSubscriptionStatusQuery();
  const canUseAiFeatures = subscriptionData?.subscriptionStatus?.canUseAiFeatures || false;

  useEffect(() => {
    refetchSubscription();
  }, [userName]);

  // Page entrance animation
  useEffect(() => {
    // Fade in the page
    Animated.timing(pageOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Animate AI Companion section
    Animated.parallel([
      Animated.timing(aiCompanionFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(aiCompanionSlide, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAiCompanionPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(aiCompanionScale, {
        toValue: 0.97,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(aiCompanionScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    router.push('/(candidate)/(tabs)/ai-coach/clara-assistant' as any);
  };

  const handleQuickUploadCV = async () => {
    // Check subscription before allowing upload
    if (!canUseAiFeatures) {
      showAlert({
        type: 'warning',
        title: 'Premium Feature',
        message: 'CV upload and AI parsing is a premium feature. Please upgrade your subscription to use this feature.',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Upgrade Now',
            style: 'default',
            onPress: () => router.push('/(candidate)/subscription/pricing' as any),
          },
        ],
      });
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const maxSize = 10 * 1024 * 1024;

      if (file.size && file.size > maxSize) {
        showAlert({
          type: 'error',
          title: 'File Too Large',
          message: 'Please select a file smaller than 10MB.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.mimeType || '')) {
        showAlert({
          type: 'error',
          title: 'Invalid File Type',
          message: 'Only PDF and DOCX files are supported.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      // Start loading
      setIsUploading(true);
      setUploadStatus('Reading file...');

      const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
      const fileData = `data:${file.mimeType};base64,${base64}`;

      setUploadStatus('Parsing resume with AI...');

      const data = await parseAndCreateResume({
        fileName: file.name,
        fileData: fileData,
      }).unwrap();

      setIsUploading(false);

      if (data.parseAndCreateResume.__typename === 'ResumeBuilderSuccessType') {
        const resume = data.parseAndCreateResume.resume;
        showAlert({
          type: 'success',
          title: 'Success!',
          message: `Resume parsed successfully!\n\nName: ${resume.fullName}\nATS Score: ${resume.atsScore}%`,
          buttons: [{
            text: 'View Resumes',
            style: 'default',
            onPress: () => router.push('/(candidate)/(tabs)/jobs/cv-upload' as any)
          }],
        });
      }
    } catch (error: any) {
      setIsUploading(false);
      console.error('Upload failed:', error);
      showAlert({
        type: 'error',
        title: 'Upload Failed',
        message: error?.message || 'Failed to upload resume. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  return (
    <>
      <CandidateLayout
        onSearchPress={() => setShowSearchModal(true)}
        hideHeader={false}
      >
        <Animated.ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          style={{ opacity: pageOpacity }}
        >
          <View className="px-6 mt-6">
            {/* AI Companion Section */}
            <View className="mb-6">
              <Text className="text-gray-900 text-lg font-bold mb-4">Your AI Companion</Text>
              <TouchableOpacity onPress={handleAiCompanionPress} activeOpacity={1}>
                <Animated.View
                  className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center"
                  style={{
                    opacity: aiCompanionFade,
                    transform: [{ translateY: aiCompanionSlide }, { scale: aiCompanionScale }],
                  }}
                >
                  <View className="bg-primary-cyan rounded-xl items-center justify-center mr-4" style={{ width: 48, height: 48 }}>
                    <Text className="text-white text-xl font-bold">AI</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 text-base font-bold mb-1">AI Companion</Text>
                    <Text className="text-gray-400 text-xs leading-4">
                      Your AI support system for career progress, confidence, and overall well-being.
                    </Text>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            </View>

            {/* Quick Actions Section */}
            <View className="mb-6">
              <Text className="text-gray-900 text-lg font-bold mb-4">Quick Actions</Text>
              <View className="flex-row mb-3" style={{ gap: 12 }}>
                <QuickActionCard
                  icon={<UploadCVIcon width={40} height={40} />}
                  title="Upload CV"
                  description="Drag & drop a file or browse an active resume from device for AI's swift analysis and feedback!"
                  onPress={handleQuickUploadCV}
                  delay={100}
                />
                <QuickActionCard
                  icon={<FindJobsIcon width={40} height={40} />}
                  title="Find Jobs"
                  description="Discover your dream job effortlessly in the sea of opportunities! Dive in and explore"
                  onPress={() => router.push('/(candidate)/(tabs)/jobs' as any)}
                  delay={200}
                />
              </View>
              <View className="flex-row" style={{ gap: 12 }}>
                <QuickActionCard
                  icon={<PracticeInterviewIcon width={40} height={40} />}
                  title="Practice Interview"
                  description="Prepare with confidence for real moments, by simulating AI-driven mock sessions"
                  onPress={() => router.push('/(candidate)/(tabs)/ai-coach' as any)}
                  delay={300}
                />
                <QuickActionCard
                  icon={<SkillGraphIcon width={32} height={32} />}
                  title="Skill Gap"
                  description="Identify all the skills they need to improve to reach their desired career path"
                  onPress={() => console.log('Skill Gap')}
                  delay={400}
                />
              </View>
            </View>

            {/* Premium Upgrade Banner */}
            {!canUseAiFeatures && (
              <PremiumUpgradeBanner onUpgrade={() => router.push('/(candidate)/subscription/pricing' as any)} />
            )}

            {/* Top Job Matches */}
            <View className="mb-6">
              <Text className="text-gray-900 text-lg font-bold mb-4">Top Job Matches for You</Text>
              <JobCard
                position="Product Designer"
                description="Design intuitive user experiences for our flagship products. Work with cross-functional teams to create beautiful, accessible interfaces."
                company="Chawla Solution"
                location="Remote - Pakistan"
                jobType="Full Time"
                salary="$45K - $60K / year"
                skills={['Figma', 'UX Research', 'Prototyping']}
                aiInsight="AI Insight: Your design portfolio shows strong UX depth 87% fit for this role."
                badgeColor="#437EF4"
                onViewAll={() => router.push('/(candidate)/(tabs)/jobs' as any)}
              />
            </View>

            {/* View All Jobs Link */}
            <TouchableOpacity
              className="items-end mb-6"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(candidate)/(tabs)/jobs' as any);
              }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Text className="text-primary-blue text-sm font-medium mr-1">View All Jobs</Text>
                <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <Path d="M6 12L10 8L6 4" stroke="#437EF4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
            </TouchableOpacity>

            {/* Recent Activity */}
            <View className="mb-6">
              <Text className="text-gray-900 text-lg font-bold mb-4">Recent Activity</Text>
              <ActivityItem
                title="Uploaded CV"
                subtitle="Today - Created and scored"
                dotColor="#437EF4"
                actionText="View"
                onActionPress={() => router.push('/(candidate)/(tabs)/jobs/cv-upload' as any)}
                delay={500}
              />
              <ActivityItem
                title="Practice session"
                subtitle="Yesterday - 1 mock interview"
                dotColor="#FF8D28"
                actionText="View"
                onActionPress={() => router.push('/(candidate)/(tabs)/ai-coach' as any)}
                delay={600}
              />
            </View>

            {/* Gamification */}
            <View className="mb-6">
              <Text className="text-gray-900 text-lg font-bold mb-4">Gamification</Text>
              <View className="flex-row gap-4">
                <GamificationBadge icon={<TrophyIcon width={27} height={27} />} title="CV Master" delay={700} />
                <GamificationBadge icon={<CircleCheckIcon width={27} height={27} />} title="Interview Pro" delay={800} />
                <GamificationBadge icon={<SkillGraphIcon width={27} height={27} />} title="Skill Builder" delay={900} />
              </View>
            </View>

            {/* Ask Clara Button */}
            <TouchableOpacity
              className="bg-primary-blue rounded-xl py-4 flex-row items-center justify-center mb-6"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/(candidate)/(tabs)/ai-coach/clara-assistant' as any);
              }}
              activeOpacity={0.8}
            >
              <MessageIcon width={24} height={24} />
              <Text className="text-white text-base font-semibold ml-2">Ask to Clara</Text>
            </TouchableOpacity>
          </View>
        </Animated.ScrollView>
      </CandidateLayout>

      <SearchModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onNavigate={(route) => {
          setShowSearchModal(false);
          router.push(route as any);
        }}
      />

      {/* Upload Loading Modal */}
      <Modal
        visible={isUploading}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 32, alignItems: 'center', marginHorizontal: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
            <View style={{ backgroundColor: '#EEF4FF', borderRadius: 50, padding: 16, marginBottom: 20 }}>
              <ActivityIndicator size="large" color="#437EF4" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
              Uploading Resume
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
              {uploadStatus}
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}
