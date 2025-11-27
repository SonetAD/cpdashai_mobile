import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform, Modal, TouchableWithoutFeedback, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { EditIcon, DeleteIcon, ChevronDownIcon } from '../../../../components/profile/Icons';
import {
  useAddExperienceMutation,
  useUpdateExperienceMutation,
  useDeleteExperienceMutation,
} from '../../../../services/api';
import { useAlert } from '../../../../contexts/AlertContext';

interface ExperienceEntry {
  id: string;
  index: number;
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  employmentType: string;
  description: string;
  current: boolean;
}

interface ExperienceTabProps {
  experienceList: ExperienceEntry[];
  setExperienceList: (list: ExperienceEntry[]) => void;
}

const EMPLOYMENT_TYPES = [
  'fulltime',
  'parttime',
  'contract',
  'freelance',
  'internship',
  'temporary',
];

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  'fulltime': 'Full-time',
  'parttime': 'Part-time',
  'contract': 'Contract',
  'freelance': 'Freelance',
  'internship': 'Internship',
  'temporary': 'Temporary',
};

export const ExperienceTab: React.FC<ExperienceTabProps> = ({ experienceList, setExperienceList }) => {
  const [showAddExperience, setShowAddExperience] = useState(false);
  const [showEmploymentTypeModal, setShowEmploymentTypeModal] = useState(false);
  const [editingExperienceIndex, setEditingExperienceIndex] = useState<number | null>(null);
  const [newExperience, setNewExperience] = useState({
    index: 0,
    position: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    employmentType: '',
    description: '',
    current: false,
  });

  const [showExpStartDatePicker, setShowExpStartDatePicker] = useState(false);
  const [showExpEndDatePicker, setShowExpEndDatePicker] = useState(false);
  const [expStartDate, setExpStartDate] = useState(new Date());
  const [expEndDate, setExpEndDate] = useState(new Date());

  const [addExperience, { isLoading: isAddingExperience }] = useAddExperienceMutation();
  const [updateExperience, { isLoading: isUpdatingExperience }] = useUpdateExperienceMutation();
  const [deleteExperience, { isLoading: isDeletingExperience }] = useDeleteExperienceMutation();
  const { showAlert } = useAlert();

  const handleSaveExperience = async () => {
    if (!newExperience.current && newExperience.startDate && newExperience.endDate) {
      const start = new Date(newExperience.startDate);
      const end = new Date(newExperience.endDate);

      if (end <= start) {
        showAlert({
          type: 'error',
          title: 'Invalid Dates',
          message: 'End date must be after start date.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }
    }

    try {
      if (editingExperienceIndex !== null) {
        // Update existing experience
        const result = await updateExperience({
          index: editingExperienceIndex,
          company: newExperience.company,
          position: newExperience.position,
          location: newExperience.location,
          startDate: newExperience.startDate,
          endDate: newExperience.endDate,
          description: newExperience.description,
          current: newExperience.current,
          employmentType: newExperience.employmentType,
        }).unwrap();

        if (result.updateExperience.__typename === 'SuccessType') {
          // Update local state
          setExperienceList(
            experienceList.map((exp) =>
              exp.index === editingExperienceIndex
                ? { ...exp, ...newExperience }
                : exp
            )
          );
          resetForm();
          showAlert({
            type: 'success',
            title: 'Success',
            message: result.updateExperience.message,
            buttons: [{ text: 'OK', style: 'default' }],
          });
        } else {
          showAlert({
            type: 'error',
            title: 'Error',
            message: result.updateExperience.message,
            buttons: [{ text: 'OK', style: 'default' }],
          });
        }
      } else {
        // Add new experience
        const result = await addExperience({
          company: newExperience.company,
          position: newExperience.position,
          location: newExperience.location,
          startDate: newExperience.startDate,
          endDate: newExperience.endDate,
          description: newExperience.description,
          current: newExperience.current,
          employmentType: newExperience.employmentType,
        }).unwrap();

        if (result.addExperience.__typename === 'SuccessType') {
          const { index: _, ...experienceWithoutIndex } = newExperience;
          const experience: ExperienceEntry = {
            id: Date.now().toString(),
            index: experienceList.length,
            ...experienceWithoutIndex,
          };
          const updatedList = [...experienceList, experience];
          setExperienceList(updatedList);
          resetForm();
          showAlert({
            type: 'success',
            title: 'Success',
            message: result.addExperience.message,
            buttons: [{ text: 'OK', style: 'default' }],
          });
        } else {
          showAlert({
            type: 'error',
            title: 'Error',
            message: result.addExperience.message,
            buttons: [{ text: 'OK', style: 'default' }],
          });
        }
      }
    } catch (error) {
      console.error('Failed to save experience:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to save experience. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const handleEditExperience = (exp: ExperienceEntry) => {
    setEditingExperienceIndex(exp.index);
    setNewExperience({
      index: exp.index,
      position: exp.position,
      company: exp.company,
      location: exp.location,
      startDate: exp.startDate,
      endDate: exp.endDate,
      employmentType: exp.employmentType,
      description: exp.description,
      current: exp.current,
    });
    if (exp.startDate) {
      setExpStartDate(new Date(exp.startDate));
    }
    if (exp.endDate) {
      setExpEndDate(new Date(exp.endDate));
    }
    setShowAddExperience(true);
  };

  const handleDeleteExperience = async (index: number) => {
    showAlert({
      type: 'warning',
      title: 'Delete Experience',
      message: 'Are you sure you want to delete this experience?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteExperience({ index }).unwrap();

              if (result.deleteExperience.__typename === 'SuccessType') {
                setExperienceList(experienceList.filter((exp) => exp.index !== index));
                showAlert({
                  type: 'success',
                  title: 'Success',
                  message: result.deleteExperience.message,
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              } else {
                showAlert({
                  type: 'error',
                  title: 'Error',
                  message: result.deleteExperience.message,
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              }
            } catch (error) {
              console.error('Failed to delete experience:', error);
              showAlert({
                type: 'error',
                title: 'Error',
                message: 'Failed to delete experience. Please try again.',
                buttons: [{ text: 'OK', style: 'default' }],
              });
            }
          },
        },
      ],
    });
  };

  const resetForm = () => {
    setNewExperience({
      index: experienceList.length,
      position: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      employmentType: '',
      description: '',
      current: false,
    });
    setEditingExperienceIndex(null);
    setShowAddExperience(false);
  };

  const handleExpStartDateChange = (_event: any, selectedDate?: Date) => {
    setShowExpStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setExpStartDate(selectedDate);
      setNewExperience({
        ...newExperience,
        startDate: selectedDate.toLocaleDateString('en-US'),
      });
    }
  };

  const handleExpEndDateChange = (_event: any, selectedDate?: Date) => {
    setShowExpEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      if (newExperience.startDate) {
        const start = new Date(newExperience.startDate);
        if (selectedDate <= start) {
          showAlert({
            type: 'error',
            title: 'Invalid Date',
            message: 'End date must be after start date.',
            buttons: [{ text: 'OK', style: 'default' }],
          });
          return;
        }
      }
      setExpEndDate(selectedDate);
      setNewExperience({
        ...newExperience,
        endDate: selectedDate.toLocaleDateString('en-US'),
      });
    }
  };

  return (
    <>
      <View>
        {/* Existing Experience List */}
        {experienceList.map((exp) => (
          <View
            key={exp.id}
            className="bg-white rounded-xl p-4 mb-4 border border-gray-100"
          >
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold text-base mb-1">
                  {exp.position}
                </Text>
                <Text className="text-gray-600 text-sm mb-1">
                  {exp.company}
                </Text>
                <Text className="text-gray-500 text-xs mb-1">
                  {exp.location}
                </Text>
                <Text className="text-gray-500 text-xs">
                  {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                </Text>
              </View>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => handleEditExperience(exp)}
                  activeOpacity={0.7}
                  disabled={isDeletingExperience}
                >
                  <EditIcon />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteExperience(exp.index)}
                  activeOpacity={0.7}
                  disabled={isDeletingExperience}
                >
                  <DeleteIcon />
                </TouchableOpacity>
              </View>
            </View>
            {exp.employmentType && (
              <Text className="text-gray-500 text-sm mb-2">
                {EMPLOYMENT_TYPE_LABELS[exp.employmentType] || exp.employmentType}
              </Text>
            )}
            <Text className="text-gray-600 text-sm">
              {exp.description}
            </Text>
          </View>
        ))}

        {/* Add/Edit Experience Form */}
        {showAddExperience && (
          <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
            <Text className="text-gray-900 font-bold text-lg mb-4">
              {editingExperienceIndex !== null ? 'Edit Experience' : 'Add Experience'}
            </Text>

            <View className="mb-4">
              <Text className="text-gray-600 text-sm mb-2">
                Job Title / Role
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700"
                placeholder="UX/UI Designer"
                placeholderTextColor="#9CA3AF"
                value={newExperience.position}
                onChangeText={(text) =>
                  setNewExperience({ ...newExperience, position: text })
                }
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-600 text-sm mb-2">
                Company Name
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700"
                placeholder="Chawla Solutions"
                placeholderTextColor="#9CA3AF"
                value={newExperience.company}
                onChangeText={(text) =>
                  setNewExperience({ ...newExperience, company: text })
                }
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-600 text-sm mb-2">Location</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700"
                placeholder="Toronto, Canada"
                placeholderTextColor="#9CA3AF"
                value={newExperience.location}
                onChangeText={(text) =>
                  setNewExperience({ ...newExperience, location: text })
                }
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-600 text-sm mb-2">Start Date</Text>
              <TouchableOpacity
                onPress={() => setShowExpStartDatePicker(true)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
              >
                <Text className={newExperience.startDate ? "text-gray-700" : "text-gray-400"}>
                  {newExperience.startDate || 'MM/DD/YYYY'}
                </Text>
              </TouchableOpacity>
              {showExpStartDatePicker && (
                <DateTimePicker
                  value={expStartDate}
                  mode="date"
                  display="default"
                  onChange={handleExpStartDateChange}
                />
              )}
            </View>

            <View className="mb-4">
              <TouchableOpacity
                onPress={() =>
                  setNewExperience({
                    ...newExperience,
                    current: !newExperience.current,
                    endDate: !newExperience.current ? '' : newExperience.endDate,
                  })
                }
                className="flex-row items-center"
                activeOpacity={0.7}
              >
                <View
                  className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                    newExperience.current
                      ? 'bg-primary-blue border-primary-blue'
                      : 'border-gray-300'
                  }`}
                >
                  {newExperience.current && (
                    <Text className="text-white text-xs">✓</Text>
                  )}
                </View>
                <Text className="text-gray-600 text-sm">
                  I currently work here
                </Text>
              </TouchableOpacity>
            </View>

            {!newExperience.current && (
              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-2">End Date</Text>
                <TouchableOpacity
                  onPress={() => setShowExpEndDatePicker(true)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
                >
                  <Text className={newExperience.endDate ? "text-gray-700" : "text-gray-400"}>
                    {newExperience.endDate || 'MM/DD/YYYY'}
                  </Text>
                </TouchableOpacity>
                {showExpEndDatePicker && (
                  <DateTimePicker
                    value={expEndDate}
                    mode="date"
                    display="default"
                    onChange={handleExpEndDateChange}
                  />
                )}
              </View>
            )}

            <View className="mb-4">
              <Text className="text-gray-600 text-sm mb-2">
                Employment Type
              </Text>
              <TouchableOpacity
                onPress={() => setShowEmploymentTypeModal(true)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-row items-center justify-between"
              >
                <Text className={newExperience.employmentType ? "text-gray-700" : "text-gray-400"}>
                  {newExperience.employmentType ?
                    EMPLOYMENT_TYPE_LABELS[newExperience.employmentType] || newExperience.employmentType :
                    'Select employment type'}
                </Text>
                <ChevronDownIcon />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-gray-600 text-sm mb-2">
                Description / Responsibilities
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700"
                placeholder="Write here..."
                placeholderTextColor="#9CA3AF"
                value={newExperience.description}
                onChangeText={(text) =>
                  setNewExperience({ ...newExperience, description: text })
                }
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              className="bg-primary-blue rounded-xl py-3 mb-3 items-center"
              activeOpacity={0.8}
              onPress={handleSaveExperience}
              disabled={isAddingExperience || isUpdatingExperience}
            >
              <Text className="text-white text-sm font-semibold">
                {isAddingExperience || isUpdatingExperience
                  ? 'Saving...'
                  : editingExperienceIndex !== null
                  ? 'Update Experience'
                  : 'Add Experience'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-100 rounded-xl py-3 items-center"
              activeOpacity={0.8}
              onPress={resetForm}
            >
              <Text className="text-gray-700 text-sm font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add Experience Button */}
        {!showAddExperience && (
          <TouchableOpacity
            className="bg-primary-blue rounded-xl py-3 items-center"
            activeOpacity={0.8}
            onPress={() => {
              setNewExperience({
                index: experienceList.length,
                position: '',
                company: '',
                location: '',
                startDate: '',
                endDate: '',
                employmentType: '',
                description: '',
                current: false,
              });
              setShowAddExperience(true);
            }}
          >
            <Text className="text-white text-sm font-semibold">
              {experienceList.length > 0
                ? 'Add More Experience'
                : '+ Add Experience'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Employment Type Modal */}
      <Modal
        visible={showEmploymentTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmploymentTypeModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowEmploymentTypeModal(false)}>
          <View className="flex-1 justify-end bg-black/50">
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View className="bg-white rounded-t-3xl p-6">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-gray-900 text-lg font-bold">
                    Select Employment Type
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowEmploymentTypeModal(false)}
                    activeOpacity={0.7}
                  >
                    <Text className="text-gray-500 text-2xl">×</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView className="max-h-96">
                  {EMPLOYMENT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => {
                        setNewExperience({ ...newExperience, employmentType: type });
                        setShowEmploymentTypeModal(false);
                      }}
                      className={`py-4 px-4 border-b border-gray-100 ${
                        newExperience.employmentType === type ? 'bg-blue-50' : ''
                      }`}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`text-base ${
                          newExperience.employmentType === type
                            ? 'text-primary-blue font-semibold'
                            : 'text-gray-700'
                        }`}
                      >
                        {EMPLOYMENT_TYPE_LABELS[type]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};
