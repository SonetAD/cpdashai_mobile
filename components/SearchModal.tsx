import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Keyboard } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

// Types
interface SearchableFeature {
  id: string;
  title: string;
  description: string;
  category: 'Jobs' | 'AI Coach' | 'Profile' | 'Career Tools';
  route: string;
  keywords: string[];
  icon: 'briefcase' | 'robot' | 'user' | 'document' | 'chart' | 'settings';
}

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigate?: (route: string) => void;
}

// Searchable Features Data
const SEARCHABLE_FEATURES: SearchableFeature[] = [
  // Jobs Category
  {
    id: 'jobs',
    title: 'Browse Jobs',
    description: 'View job matches and search for opportunities',
    category: 'Jobs',
    route: '/(candidate)/(tabs)/jobs',
    keywords: ['job', 'work', 'career', 'opportunity', 'employment', 'position', 'find jobs'],
    icon: 'briefcase',
  },
  {
    id: 'applications',
    title: 'Application Tracker',
    description: 'Track your submitted job applications',
    category: 'Jobs',
    route: '/(candidate)/(tabs)/jobs/application-tracker',
    keywords: ['application', 'status', 'submitted', 'track', 'pending', 'applied'],
    icon: 'document',
  },
  // Career Tools Category
  {
    id: 'cv-upload',
    title: 'Upload CV',
    description: 'Upload your resume for AI analysis',
    category: 'Career Tools',
    route: '/(candidate)/(tabs)/jobs/cv-upload',
    keywords: ['resume', 'cv', 'upload', 'document', 'ats', 'curriculum vitae'],
    icon: 'document',
  },
  {
    id: 'cv-builder',
    title: 'CV Builder',
    description: 'Create a professional resume from scratch',
    category: 'Career Tools',
    route: '/(candidate)/(tabs)/jobs/cv-builder',
    keywords: ['resume', 'cv', 'build', 'create', 'template', 'maker'],
    icon: 'document',
  },
  // AI Coach Category
  {
    id: 'ai-coach',
    title: 'AI Interview Coach',
    description: 'Practice interviews with AI-powered feedback',
    category: 'AI Coach',
    route: '/(candidate)/(tabs)/ai-coach',
    keywords: ['interview', 'practice', 'coach', 'ai', 'mock', 'preparation'],
    icon: 'robot',
  },
  {
    id: 'ask-ray',
    title: 'Ask Ray',
    description: 'Chat with your AI career coach',
    category: 'AI Coach',
    route: '/(candidate)/(tabs)/ai-coach/ray-assistant',
    keywords: ['ray', 'chat', 'assistant', 'career', 'advice', 'ai', 'help'],
    icon: 'robot',
  },
  {
    id: 'ask-clara',
    title: 'Ask Clara',
    description: 'Mental wellbeing companion',
    category: 'AI Coach',
    route: '/(candidate)/(tabs)/ai-coach/clara-assistant',
    keywords: ['clara', 'wellbeing', 'mental', 'chat', 'support', 'wellness'],
    icon: 'robot',
  },
  // Profile Category
  {
    id: 'profile',
    title: 'My Profile',
    description: 'View and manage your profile',
    category: 'Profile',
    route: '/(candidate)/(tabs)/profile',
    keywords: ['profile', 'account', 'me', 'personal', 'view'],
    icon: 'user',
  },
  {
    id: 'edit-profile',
    title: 'Edit Profile',
    description: 'Update your personal information and skills',
    category: 'Profile',
    route: '/(candidate)/(tabs)/profile/full-profile',
    keywords: ['edit', 'update', 'skills', 'experience', 'education', 'personal info'],
    icon: 'user',
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'App settings and preferences',
    category: 'Profile',
    route: '/(candidate)/(tabs)/profile/settings',
    keywords: ['settings', 'preferences', 'notification', 'privacy', 'logout', 'account'],
    icon: 'settings',
  },
  {
    id: 'subscription',
    title: 'Subscription Plans',
    description: 'View and upgrade your subscription',
    category: 'Profile',
    route: '/(candidate)/subscription/pricing',
    keywords: ['subscription', 'premium', 'upgrade', 'plan', 'pricing', 'pay'],
    icon: 'chart',
  },
];

// Popular searches
const POPULAR_SEARCHES = [
  'Jobs',
  'Interview Practice',
  'Upload CV',
  'My Profile',
  'AI Coach',
  'Settings',
];

// Icon Components
const SearchIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke="#9CA3AF" strokeWidth="2" />
    <Path d="M20 20L16 16" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const BriefcaseIcon = ({ color = "#437EF4" }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="7" width="20" height="14" rx="2" stroke={color} strokeWidth="2" />
    <Path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7" stroke={color} strokeWidth="2" />
    <Path d="M12 12V14" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const RobotIcon = ({ color = "#437EF4" }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="6" width="16" height="14" rx="3" stroke={color} strokeWidth="2" />
    <Circle cx="9" cy="12" r="1.5" fill={color} />
    <Circle cx="15" cy="12" r="1.5" fill={color} />
    <Path d="M12 6V3M12 3L10 4M12 3L14 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M9 16H15" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const UserIcon = ({ color = "#437EF4" }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
    <Path d="M4 21C4 17.134 7.58172 14 12 14C16.4183 14 20 17.134 20 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const DocumentIcon = ({ color = "#437EF4" }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14 2V8H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8 13H16M8 17H12" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const ChartIcon = ({ color = "#437EF4" }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 20V10M12 20V4M6 20V14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SettingsIcon = ({ color = "#437EF4" }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    <Path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const ChevronRightIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18L15 12L9 6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Get icon component based on icon type
const getIconComponent = (iconType: string, color?: string) => {
  switch (iconType) {
    case 'briefcase':
      return <BriefcaseIcon color={color} />;
    case 'robot':
      return <RobotIcon color={color} />;
    case 'user':
      return <UserIcon color={color} />;
    case 'document':
      return <DocumentIcon color={color} />;
    case 'chart':
      return <ChartIcon color={color} />;
    case 'settings':
      return <SettingsIcon color={color} />;
    default:
      return <BriefcaseIcon color={color} />;
  }
};

// Feature Card Component
const FeatureCard = ({
  feature,
  onPress,
}: {
  feature: SearchableFeature;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 flex-row items-center"
    activeOpacity={0.7}
  >
    <View className="bg-primary-blue/10 rounded-full p-3 mr-4">
      {getIconComponent(feature.icon)}
    </View>
    <View className="flex-1">
      <Text className="text-gray-900 text-base font-bold">{feature.title}</Text>
      <Text className="text-gray-500 text-sm mt-0.5">{feature.description}</Text>
      <View className="bg-gray-100 rounded-full px-2 py-1 self-start mt-2">
        <Text className="text-gray-600 text-xs font-medium">{feature.category}</Text>
      </View>
    </View>
    <ChevronRightIcon />
  </TouchableOpacity>
);

// No Results Component
const NoResults = ({ query, onClear }: { query: string; onClear: () => void }) => (
  <View className="bg-gray-50 rounded-2xl p-6 items-center">
    <View className="bg-gray-200 rounded-full p-4 mb-4">
      <SearchIcon />
    </View>
    <Text className="text-gray-900 text-base font-bold mb-2">No results found</Text>
    <Text className="text-gray-500 text-sm text-center mb-4">
      We couldn't find anything matching "{query}". Try different keywords.
    </Text>
    <TouchableOpacity
      onPress={onClear}
      className="bg-primary-blue rounded-xl py-2 px-4"
    >
      <Text className="text-white text-sm font-semibold">Clear Search</Text>
    </TouchableOpacity>
  </View>
);

export default function SearchModal({ visible, onClose, onNavigate }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter features based on search query
  const filteredFeatures = useMemo(() => {
    if (!searchQuery.trim()) return SEARCHABLE_FEATURES;

    const searchLower = searchQuery.toLowerCase();

    return SEARCHABLE_FEATURES.filter((feature) => {
      if (feature.title.toLowerCase().includes(searchLower)) return true;
      if (feature.description.toLowerCase().includes(searchLower)) return true;
      if (feature.category.toLowerCase().includes(searchLower)) return true;
      if (feature.keywords.some(kw => kw.toLowerCase().includes(searchLower))) return true;
      return false;
    });
  }, [searchQuery]);

  // Group features by category
  const groupedFeatures = useMemo(() => {
    const groups: Record<string, SearchableFeature[]> = {};
    filteredFeatures.forEach((feature) => {
      if (!groups[feature.category]) {
        groups[feature.category] = [];
      }
      groups[feature.category].push(feature);
    });
    return groups;
  }, [filteredFeatures]);

  const handleClose = () => {
    Keyboard.dismiss();
    setSearchQuery('');
    onClose();
  };

  const handleFeaturePress = (route: string) => {
    Keyboard.dismiss();
    setSearchQuery('');
    onClose();
    if (onNavigate) {
      onNavigate(route);
    }
  };

  const handlePopularSearch = (term: string) => {
    setSearchQuery(term);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="bg-primary-blue px-6 pt-12 pb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-2xl font-bold flex-1">Search</Text>
            <TouchableOpacity onPress={handleClose} className="p-2">
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="white"/>
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View className="bg-white rounded-xl flex-row items-center px-4 py-3">
            <SearchIcon />
            <TextInput
              className="flex-1 text-gray-900 text-base ml-3"
              placeholder="Search features, screens, tools..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#9CA3AF"/>
                </Svg>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          {searchQuery.length === 0 ? (
            <>
              {/* Popular Searches */}
              <View className="mb-6">
                <Text className="text-gray-900 text-lg font-bold mb-3">Popular Searches</Text>
                <View className="flex-row flex-wrap">
                  {POPULAR_SEARCHES.map((tag, index) => (
                    <TouchableOpacity
                      key={index}
                      className="bg-primary-blue/10 rounded-full px-4 py-2 mr-2 mb-2"
                      onPress={() => handlePopularSearch(tag)}
                    >
                      <Text className="text-primary-blue text-sm font-medium">{tag}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* All Features by Category */}
              <View className="mb-6">
                <Text className="text-gray-900 text-lg font-bold mb-4">All Features</Text>
                {Object.entries(groupedFeatures).map(([category, features]) => (
                  <View key={category} className="mb-4">
                    <Text className="text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wide">
                      {category}
                    </Text>
                    {features.map((feature) => (
                      <FeatureCard
                        key={feature.id}
                        feature={feature}
                        onPress={() => handleFeaturePress(feature.route)}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </>
          ) : filteredFeatures.length > 0 ? (
            /* Search Results */
            <View className="mb-6">
              <Text className="text-gray-900 text-lg font-bold mb-2">Search Results</Text>
              <Text className="text-gray-500 text-sm mb-4">
                {filteredFeatures.length} result{filteredFeatures.length !== 1 ? 's' : ''} found
              </Text>
              {filteredFeatures.map((feature) => (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  onPress={() => handleFeaturePress(feature.route)}
                />
              ))}
            </View>
          ) : (
            /* No Results */
            <NoResults query={searchQuery} onClear={() => setSearchQuery('')} />
          )}

          {/* Bottom padding */}
          <View className="h-20" />
        </ScrollView>
      </View>
    </Modal>
  );
}
