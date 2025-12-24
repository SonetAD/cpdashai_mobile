import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView, Modal } from 'react-native';
import { 
  useGetCandidateProfileQuery, 
  useAddPreferredLocationsMutation,
  useUpdatePreferredLocationsMutation,
  useDeletePreferredLocationsMutation 
} from '../../../../services/api';
import { useAlert } from '../../../../contexts/AlertContext';

export default function LocationTab() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: profileData, refetch: refetchProfile } = useGetCandidateProfileQuery();
  const [addPreferredLocations] = useAddPreferredLocationsMutation();
  const [updatePreferredLocations] = useUpdatePreferredLocationsMutation();
  const [deletePreferredLocations] = useDeletePreferredLocationsMutation();
  const { showAlert } = useAlert();

  const candidateProfile = profileData?.myProfile?.__typename === 'CandidateType' ? profileData.myProfile : null;
  const locations = candidateProfile?.preferredLocations || [];

  const handleAddLocation = async () => {
    if (!newLocation.trim()) {
      showAlert({
        type: 'error',
        title: 'Required Field',
        message: 'Please enter a location',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    // Check if location already exists
    if (locations.some(loc => loc.toLowerCase() === newLocation.trim().toLowerCase())) {
      showAlert({
        type: 'error',
        title: 'Duplicate Location',
        message: 'This location is already in your list',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await addPreferredLocations({
        locations: [newLocation.trim()],
      }).unwrap();

      if (response.addPreferredLocations?.__typename === 'SuccessType') {
        showAlert({
          type: 'success',
          title: 'Success!',
          message: 'Location added successfully',
          buttons: [{ text: 'OK', style: 'default' }],
        });

        setNewLocation('');
        setShowAddModal(false);
        await refetchProfile();
      } else {
        showAlert({
          type: 'error',
          title: 'Error',
          message: response.addPreferredLocations?.message || 'Failed to add location',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error: any) {
      console.error('Error adding location:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: error?.data?.addPreferredLocations?.message || 'Failed to add location. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLocation = async (location: string) => {
    showAlert({
      type: 'warning',
      title: 'Delete Location',
      message: `Are you sure you want to remove "${location}" from your preferred locations?`,
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deletePreferredLocations({
                locations: [location],
              }).unwrap();

              if (response.deletePreferredLocations?.__typename === 'SuccessType') {
                showAlert({
                  type: 'success',
                  title: 'Success!',
                  message: 'Location removed successfully',
                  buttons: [{ text: 'OK', style: 'default' }],
                });
                await refetchProfile();
              } else {
                showAlert({
                  type: 'error',
                  title: 'Error',
                  message: response.deletePreferredLocations?.message || 'Failed to delete location',
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              }
            } catch (error: any) {
              console.error('Error deleting location:', error);
              showAlert({
                type: 'error',
                title: 'Error',
                message: error?.data?.deletePreferredLocations?.message || 'Failed to delete location. Please try again.',
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
      {/* Header */}
      <View className="bg-white rounded-xl p-5 mb-4 border border-gray-100">
        <Text className="text-gray-900 font-bold text-lg mb-2">Preferred Locations</Text>
        <Text className="text-gray-600 text-sm mb-4">
          Add your preferred work locations. This helps employers understand where you'd like to work and is required when applying for jobs.
        </Text>

        {/* Locations List */}
        {locations.length > 0 ? (
          <View className="flex-row flex-wrap gap-2 mb-4">
            {locations.map((location, index) => (
              <View key={index} className="bg-blue-50 border border-primary-blue rounded-full px-4 py-2 flex-row items-center">
                <Text className="text-primary-blue text-sm font-medium mr-2">{location}</Text>
                <TouchableOpacity onPress={() => handleDeleteLocation(location)}>
                  <Text className="text-primary-blue text-base font-bold">×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
            <Text className="text-yellow-800 text-sm font-medium mb-1">⚠️ No locations added</Text>
            <Text className="text-yellow-700 text-xs">
              You need to add at least one preferred location before you can apply for jobs.
            </Text>
          </View>
        )}

        {/* Add Location Button */}
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          className="bg-primary-blue rounded-xl py-3 items-center"
        >
          <Text className="text-white text-sm font-semibold">+ Add Location</Text>
        </TouchableOpacity>
      </View>

      {/* Common Locations Suggestions */}
      <View className="bg-white rounded-xl p-5 mb-4 border border-gray-100">
        <Text className="text-gray-900 font-bold text-base mb-3">Quick Add</Text>
        <Text className="text-gray-600 text-xs mb-3">Popular location options:</Text>
        <View className="flex-row flex-wrap gap-2">
          {['Remote', 'Hybrid', 'New York', 'San Francisco', 'London', 'Toronto', 'Berlin', 'Singapore'].map((loc) => (
            <TouchableOpacity
              key={loc}
              onPress={() => {
                setNewLocation(loc);
                setShowAddModal(true);
              }}
              className="bg-gray-100 rounded-full px-3 py-2"
            >
              <Text className="text-gray-700 text-xs font-medium">+ {loc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Add Location Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-gray-900 text-xl font-bold mb-4">Add Preferred Location</Text>

            <Text className="text-gray-700 text-sm mb-2">Location *</Text>
            <TextInput
              className="bg-gray-50 rounded-xl p-4 mb-4 text-gray-900 border border-gray-200"
              placeholder="e.g., New York, Remote, Hybrid, etc."
              placeholderTextColor="#9CA3AF"
              value={newLocation}
              onChangeText={setNewLocation}
              autoFocus
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  setNewLocation('');
                }}
                className="flex-1 bg-gray-200 rounded-xl py-4 items-center"
                disabled={isSubmitting}
              >
                <Text className="text-gray-700 font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddLocation}
                className="flex-1 bg-primary-blue rounded-xl py-4 items-center"
                disabled={isSubmitting}
              >
                <Text className="text-white font-semibold">
                  {isSubmitting ? 'Adding...' : 'Add Location'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
