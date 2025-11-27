import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { PlusIcon } from '../../../../components/profile/Icons';
import {
  useAddHobbyMutation,
  useRemoveHobbyMutation,
} from '../../../../services/api';
import { useAlert } from '../../../../contexts/AlertContext';

interface HobbyTabProps {
  hobbies?: string[];
  onUpdateHobbies?: (hobbies: string[]) => void;
}

export const HobbyTab: React.FC<HobbyTabProps> = ({ hobbies = [], onUpdateHobbies }) => {
  const [hobbiesList, setHobbiesList] = useState<string[]>(hobbies);
  const [newHobby, setNewHobby] = useState('');
  const [showAddHobby, setShowAddHobby] = useState(false);

  const [addHobby, { isLoading: isAdding }] = useAddHobbyMutation();
  const [removeHobby, { isLoading: isRemoving }] = useRemoveHobbyMutation();
  const { showAlert } = useAlert();

  // Update local state when props change
  useEffect(() => {
    setHobbiesList(hobbies);
  }, [hobbies]);

  const handleAddHobby = async () => {
    if (!newHobby.trim()) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Please enter a hobby',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    if (hobbiesList.includes(newHobby.trim())) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'This hobby already exists',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    try {
      const result = await addHobby({ hobby: newHobby.trim() }).unwrap();

      if (result.addHobby.__typename === 'SuccessType') {
        const updatedHobbies = [...hobbiesList, newHobby.trim()];
        setHobbiesList(updatedHobbies);
        setNewHobby('');
        setShowAddHobby(false);

        if (onUpdateHobbies) {
          onUpdateHobbies(updatedHobbies);
        }

        showAlert({
          type: 'success',
          title: 'Success',
          message: result.addHobby.message,
          buttons: [{ text: 'OK', style: 'default' }],
        });
      } else {
        showAlert({
          type: 'error',
          title: 'Error',
          message: result.addHobby.message,
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error) {
      console.error('Failed to add hobby:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to add hobby. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const handleDeleteHobby = async (hobbyToDelete: string) => {
    showAlert({
      type: 'warning',
      title: 'Delete Hobby',
      message: `Are you sure you want to remove "${hobbyToDelete}"?`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await removeHobby({ hobby: hobbyToDelete }).unwrap();

              if (result.removeHobby.__typename === 'SuccessType') {
                const updatedHobbies = hobbiesList.filter(hobby => hobby !== hobbyToDelete);
                setHobbiesList(updatedHobbies);

                if (onUpdateHobbies) {
                  onUpdateHobbies(updatedHobbies);
                }

                showAlert({
                  type: 'success',
                  title: 'Success',
                  message: result.removeHobby.message,
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              } else {
                showAlert({
                  type: 'error',
                  title: 'Error',
                  message: result.removeHobby.message,
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              }
            } catch (error) {
              console.error('Failed to remove hobby:', error);
              showAlert({
                type: 'error',
                title: 'Error',
                message: 'Failed to remove hobby. Please try again.',
                buttons: [{ text: 'OK', style: 'default' }],
              });
            }
          },
        },
      ],
    });
  };

  return (
    <View>
      {/* Hobbies List */}
      {hobbiesList.length > 0 ? (
        <View className="mb-4">
          <Text className="text-gray-600 text-sm mb-3">Your Hobbies</Text>
          <View className="flex-row flex-wrap gap-2">
            {hobbiesList.map((hobby, index) => (
              <View
                key={index}
                className="bg-green-50 border border-green-500 rounded-full px-4 py-2 flex-row items-center"
              >
                <Text className="text-green-700 text-sm font-medium mr-2">
                  {hobby}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDeleteHobby(hobby)}
                  activeOpacity={0.7}
                  disabled={isRemoving}
                >
                  <View className="w-4 h-4 rounded-full bg-green-500 items-center justify-center">
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
            No hobbies added yet. Share your interests and hobbies!
          </Text>
        </View>
      )}

      {/* Add Hobby Form */}
      {showAddHobby && (
        <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
          <Text className="text-gray-900 font-bold text-lg mb-4">
            Add New Hobby
          </Text>

          <View className="mb-4">
            <Text className="text-gray-600 text-sm mb-2">Hobby Name</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700"
              placeholder="e.g., Reading, Photography, Hiking"
              placeholderTextColor="#9CA3AF"
              value={newHobby}
              onChangeText={setNewHobby}
              autoFocus
            />
          </View>

          <TouchableOpacity
            className="bg-primary-blue rounded-xl py-3 mb-3 items-center"
            activeOpacity={0.8}
            onPress={handleAddHobby}
            disabled={isAdding}
          >
            <Text className="text-white text-sm font-semibold">
              {isAdding ? 'Adding...' : 'Add Hobby'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-100 rounded-xl py-3 items-center"
            activeOpacity={0.8}
            onPress={() => {
              setNewHobby('');
              setShowAddHobby(false);
            }}
          >
            <Text className="text-gray-700 text-sm font-semibold">Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Hobby Button */}
      {!showAddHobby && (
        <TouchableOpacity
          className="bg-primary-blue rounded-xl py-3 items-center flex-row justify-center"
          activeOpacity={0.8}
          onPress={() => setShowAddHobby(true)}
        >
          <View className="mr-2">
            <PlusIcon />
          </View>
          <Text className="text-white text-sm font-semibold">
            {hobbiesList.length > 0 ? 'Add More Hobbies' : 'Add Hobbies'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Hobby Suggestions */}
      {hobbiesList.length === 0 && !showAddHobby && (
        <View className="mt-4 bg-green-50 rounded-xl p-4 border border-green-100">
          <Text className="text-gray-700 text-sm font-semibold mb-2">
            Suggested Hobbies:
          </Text>
          <Text className="text-gray-600 text-xs">
            Reading, Gaming, Photography, Hiking, Cooking, Traveling, Music, Sports, Painting, Gardening, Dancing, Writing
          </Text>
        </View>
      )}
    </View>
  );
};
