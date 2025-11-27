import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Keyboard } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

const SearchIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke="#9CA3AF" strokeWidth="2" />
    <Path d="M20 20L16 16" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const GuideItem = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">
    <View className="flex-row items-center mb-2">
      <View className="bg-primary-blue/10 rounded-full p-2 mr-3">
        {icon}
      </View>
      <Text className="text-gray-900 text-base font-bold flex-1">{title}</Text>
    </View>
    <Text className="text-gray-600 text-sm ml-11">{description}</Text>
  </View>
);

export default function SearchModal({ visible, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleClose = () => {
    Keyboard.dismiss();
    setSearchQuery('');
    onClose();
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
              placeholder="Search jobs, skills, courses..."
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
              {/* Welcome Message */}
              <View className="mb-6">
                <Text className="text-gray-900 text-xl font-bold mb-2">How to Use Search</Text>
                <Text className="text-gray-600 text-sm">
                  Follow these simple steps to find what you're looking for
                </Text>
              </View>

              {/* Step-by-Step Guide */}
              <GuideItem
                icon={
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Circle cx="12" cy="12" r="10" stroke="#437EF4" strokeWidth="2" />
                    <Path d="M12 6v6l4 2" stroke="#437EF4" strokeWidth="2" strokeLinecap="round" />
                  </Svg>
                }
                title="Step 1: Enter Search Terms"
                description="Type keywords related to what you're looking for - job titles, skills, company names, or course topics."
              />

              <GuideItem
                icon={
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path d="M9 12l2 2 4-4M7 3h10c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2z" stroke="#437EF4" strokeWidth="2" fill="none"/>
                  </Svg>
                }
                title="Step 2: Browse Results"
                description="Review the search results. Results are organized by category: Jobs, Skills, Courses, and more."
              />

              <GuideItem
                icon={
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="#437EF4" strokeWidth="2" />
                    <Path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="#437EF4" strokeWidth="2" fill="none"/>
                  </Svg>
                }
                title="Step 3: View Details"
                description="Tap on any result to view full details, apply for jobs, or save items to your profile."
              />

              {/* Popular Searches */}
              <View className="mt-6 mb-4">
                <Text className="text-gray-900 text-lg font-bold mb-4">Popular Searches</Text>
                <View className="flex-row flex-wrap">
                  {['React Developer', 'UI/UX Design', 'Python', 'Product Manager', 'Data Science'].map((tag, index) => (
                    <TouchableOpacity
                      key={index}
                      className="bg-primary-blue/10 rounded-full px-4 py-2 mr-2 mb-2"
                      onPress={() => setSearchQuery(tag)}
                    >
                      <Text className="text-primary-blue text-sm font-medium">{tag}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          ) : (
            /* Search Results */
            <View className="mb-6">
              <Text className="text-gray-900 text-lg font-bold mb-4">Search Results</Text>
              <View className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
                <Text className="text-gray-900 text-base font-semibold mb-2">Coming Soon!</Text>
                <Text className="text-gray-600 text-sm">
                  Advanced search functionality is currently under development. Soon you'll be able to search for jobs, skills, courses, and more!
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
