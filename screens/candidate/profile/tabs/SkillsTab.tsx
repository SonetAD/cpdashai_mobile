import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { DeleteIcon, PlusIcon } from '../../../../components/profile/Icons';
import {
  useAddSkillMutation,
  useRemoveSkillMutation,
} from '../../../../services/api';

interface SkillsTabProps {
  skills: string[];
  onUpdateSkills?: (skills: string[]) => void;
}

export const SkillsTab: React.FC<SkillsTabProps> = ({ skills = [], onUpdateSkills }) => {
  const [skillsList, setSkillsList] = useState<string[]>(skills);
  const [newSkill, setNewSkill] = useState('');
  const [showAddSkill, setShowAddSkill] = useState(false);

  const [addSkill, { isLoading: isAdding }] = useAddSkillMutation();
  const [removeSkill, { isLoading: isRemoving }] = useRemoveSkillMutation();

  // Update local state when props change
  useEffect(() => {
    setSkillsList(skills);
  }, [skills]);

  const handleAddSkill = async () => {
    if (!newSkill.trim()) {
      Alert.alert('Error', 'Please enter a skill');
      return;
    }

    if (skillsList.includes(newSkill.trim())) {
      Alert.alert('Error', 'This skill already exists');
      return;
    }

    try {
      const result = await addSkill({ skill: newSkill.trim() }).unwrap();

      if (result.addSkill.__typename === 'SuccessType') {
        const updatedSkills = [...skillsList, newSkill.trim()];
        setSkillsList(updatedSkills);
        setNewSkill('');
        setShowAddSkill(false);

        if (onUpdateSkills) {
          onUpdateSkills(updatedSkills);
        }

        Alert.alert('Success', result.addSkill.message);
      } else {
        Alert.alert('Error', result.addSkill.message);
      }
    } catch (error) {
      console.error('Failed to add skill:', error);
      Alert.alert('Error', 'Failed to add skill. Please try again.');
    }
  };

  const handleDeleteSkill = async (skillToDelete: string) => {
    Alert.alert(
      'Delete Skill',
      `Are you sure you want to remove "${skillToDelete}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await removeSkill({ skill: skillToDelete }).unwrap();

              if (result.removeSkill.__typename === 'SuccessType') {
                const updatedSkills = skillsList.filter(skill => skill !== skillToDelete);
                setSkillsList(updatedSkills);

                if (onUpdateSkills) {
                  onUpdateSkills(updatedSkills);
                }

                Alert.alert('Success', result.removeSkill.message);
              } else {
                Alert.alert('Error', result.removeSkill.message);
              }
            } catch (error) {
              console.error('Failed to remove skill:', error);
              Alert.alert('Error', 'Failed to remove skill. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View>
      {/* Skills List */}
      {skillsList.length > 0 ? (
        <View className="mb-4">
          <Text className="text-gray-600 text-sm mb-3">Your Skills</Text>
          <View className="flex-row flex-wrap gap-2">
            {skillsList.map((skill, index) => (
              <View
                key={index}
                className="bg-blue-50 border border-primary-blue rounded-full px-4 py-2 flex-row items-center"
              >
                <Text className="text-primary-blue text-sm font-medium mr-2">
                  {skill}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDeleteSkill(skill)}
                  activeOpacity={0.7}
                  disabled={isRemoving}
                >
                  <View className="w-4 h-4 rounded-full bg-primary-blue items-center justify-center">
                    <Text className="text-white text-xs">×</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View className="bg-white rounded-xl p-6 mb-4 border border-gray-100">
          <Text className="text-gray-500 text-sm text-center">
            No skills added yet. Add your skills to showcase your expertise.
          </Text>
        </View>
      )}

      {/* Add Skill Form */}
      {showAddSkill && (
        <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
          <Text className="text-gray-900 font-bold text-lg mb-4">
            Add New Skill
          </Text>

          <View className="mb-4">
            <Text className="text-gray-600 text-sm mb-2">Skill Name</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700"
              placeholder="e.g., React, Python, UI/UX Design"
              placeholderTextColor="#9CA3AF"
              value={newSkill}
              onChangeText={setNewSkill}
              autoFocus
            />
          </View>

          <TouchableOpacity
            className="bg-primary-blue rounded-xl py-3 mb-3 items-center"
            activeOpacity={0.8}
            onPress={handleAddSkill}
            disabled={isAdding}
          >
            <Text className="text-white text-sm font-semibold">
              {isAdding ? 'Adding...' : 'Add Skill'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-100 rounded-xl py-3 items-center"
            activeOpacity={0.8}
            onPress={() => {
              setNewSkill('');
              setShowAddSkill(false);
            }}
          >
            <Text className="text-gray-700 text-sm font-semibold">Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Skill Button */}
      {!showAddSkill && (
        <TouchableOpacity
          className="bg-primary-blue rounded-xl py-3 items-center flex-row justify-center"
          activeOpacity={0.8}
          onPress={() => setShowAddSkill(true)}
        >
          <View className="mr-2">
            <PlusIcon />
          </View>
          <Text className="text-white text-sm font-semibold">
            {skillsList.length > 0 ? 'Add More Skills' : 'Add Skills'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Skill Suggestions */}
      {skillsList.length === 0 && !showAddSkill && (
        <View className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
          <Text className="text-gray-700 text-sm font-semibold mb-2">
            Suggested Skills:
          </Text>
          <Text className="text-gray-600 text-xs">
            JavaScript, Python, React, Node.js, TypeScript, UI/UX Design, Project Management, Communication, Problem Solving, Data Analysis
          </Text>
        </View>
      )}
    </View>
  );
};
