import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { EditIcon, DeleteIcon } from '../../../../components/profile/Icons';
import {
  useAddEducationMutation,
  useUpdateEducationMutation,
  useDeleteEducationMutation,
} from '../../../../services/api';
import { useAlert } from '../../../../contexts/AlertContext';

interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  grade: string;
}

interface EducationTabProps {
  educationList: EducationEntry[];
  setEducationList: (list: EducationEntry[]) => void;
}

export const EducationTab: React.FC<EducationTabProps> = ({ educationList, setEducationList }) => {
  const [showAddEducation, setShowAddEducation] = useState(false);
  const [editingEducationId, setEditingEducationId] = useState<string | null>(null);
  const [newEducation, setNewEducation] = useState({
    degree: '',
    institution: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    grade: '',
  });

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [addEducation, { isLoading: isAdding }] = useAddEducationMutation();
  const [updateEducation, { isLoading: isUpdating }] = useUpdateEducationMutation();
  const [deleteEducation] = useDeleteEducationMutation();
  const { showAlert } = useAlert();

  const handleSaveEducation = async () => {
    if (newEducation.startDate && newEducation.endDate) {
      const start = new Date(newEducation.startDate);
      const end = new Date(newEducation.endDate);

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
      if (editingEducationId) {
        // Find the index of the education entry being edited
        const educationIndex = educationList.findIndex((edu) => edu.id === editingEducationId);

        const result = await updateEducation({
          index: educationIndex,
          degree: newEducation.degree,
          institution: newEducation.institution,
          fieldOfStudy: newEducation.fieldOfStudy,
          startDate: newEducation.startDate,
          endDate: newEducation.endDate,
          grade: newEducation.grade,
        }).unwrap();

        if (result.updateEducation.__typename === 'SuccessType') {
          setEducationList(
            educationList.map((edu) =>
              edu.id === editingEducationId
                ? { id: editingEducationId, ...newEducation }
                : edu
            )
          );
          resetForm();
          showAlert({
            type: 'success',
            title: 'Success',
            message: result.updateEducation.message,
            buttons: [{ text: 'OK', style: 'default' }],
          });
        } else {
          showAlert({
            type: 'error',
            title: 'Error',
            message: result.updateEducation.message,
            buttons: [{ text: 'OK', style: 'default' }],
          });
        }
      } else {
        const result = await addEducation({
          degree: newEducation.degree,
          institution: newEducation.institution,
          fieldOfStudy: newEducation.fieldOfStudy,
          startDate: newEducation.startDate,
          endDate: newEducation.endDate,
          grade: newEducation.grade,
        }).unwrap();

        if (result.addEducation.__typename === 'SuccessType') {
          const education: EducationEntry = {
            id: Date.now().toString(),
            ...newEducation,
          };
          setEducationList([...educationList, education]);
          resetForm();
          showAlert({
            type: 'success',
            title: 'Success',
            message: result.addEducation.message,
            buttons: [{ text: 'OK', style: 'default' }],
          });
        } else {
          showAlert({
            type: 'error',
            title: 'Error',
            message: result.addEducation.message,
            buttons: [{ text: 'OK', style: 'default' }],
          });
        }
      }
    } catch (error) {
      console.error('Failed to save education:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to save education. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const handleEditEducation = (edu: EducationEntry) => {
    setEditingEducationId(edu.id);
    setNewEducation({
      degree: edu.degree,
      institution: edu.institution,
      fieldOfStudy: edu.fieldOfStudy,
      startDate: edu.startDate,
      endDate: edu.endDate,
      grade: edu.grade,
    });
    setStartDate(new Date(edu.startDate));
    setEndDate(new Date(edu.endDate));
    setShowAddEducation(true);
  };

  const handleDeleteEducation = async (id: string) => {
    try {
      // Find the index of the education entry to delete
      const educationIndex = educationList.findIndex((edu) => edu.id === id);

      if (educationIndex === -1) {
        showAlert({
          type: 'error',
          title: 'Error',
          message: 'Education entry not found.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      const result = await deleteEducation({ index: educationIndex }).unwrap();

      if (result.deleteEducation.__typename === 'SuccessType') {
        setEducationList(educationList.filter((edu) => edu.id !== id));
        showAlert({
          type: 'success',
          title: 'Success',
          message: result.deleteEducation.message,
          buttons: [{ text: 'OK', style: 'default' }],
        });
      } else {
        showAlert({
          type: 'error',
          title: 'Error',
          message: result.deleteEducation.message,
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error) {
      console.error('Failed to delete education:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete education. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const resetForm = () => {
    setNewEducation({
      degree: '',
      institution: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      grade: '',
    });
    setEditingEducationId(null);
    setShowAddEducation(false);
  };

  const handleStartDateChange = (_event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      setNewEducation({
        ...newEducation,
        startDate: selectedDate.toLocaleDateString('en-US'),
      });
    }
  };

  const handleEndDateChange = (_event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      if (newEducation.startDate) {
        const start = new Date(newEducation.startDate);
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
      setEndDate(selectedDate);
      setNewEducation({
        ...newEducation,
        endDate: selectedDate.toLocaleDateString('en-US'),
      });
    }
  };

  return (
    <View>
      {/* Existing Education List */}
      {educationList.map((edu) => (
        <View
          key={edu.id}
          className="bg-white rounded-xl p-4 mb-4 border border-gray-100"
        >
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <Text className="text-gray-900 font-semibold text-base mb-1">
                {edu.degree}
              </Text>
              <Text className="text-gray-600 text-sm mb-1">
                {edu.institution}
              </Text>
              <Text className="text-gray-500 text-xs">
                {edu.startDate} - {edu.endDate}
              </Text>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => handleEditEducation(edu)}
                activeOpacity={0.7}
              >
                <EditIcon />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteEducation(edu.id)}
                activeOpacity={0.7}
              >
                <DeleteIcon />
              </TouchableOpacity>
            </View>
          </View>
          <Text className="text-gray-500 text-sm">
            {edu.fieldOfStudy} • Grade: {edu.grade}
          </Text>
        </View>
      ))}

      {/* Add Education Form */}
      {showAddEducation && (
        <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
          <Text className="text-gray-900 font-bold text-lg mb-4">
            Education
          </Text>

          <View className="mb-4">
            <Text className="text-gray-600 text-sm mb-2">
              Degree / Qualification
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700"
              placeholder="Bachelor of Science in Computer Science"
              placeholderTextColor="#9CA3AF"
              value={newEducation.degree}
              onChangeText={(text) =>
                setNewEducation({ ...newEducation, degree: text })
              }
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-600 text-sm mb-2">
              Institution Name
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700"
              placeholder="Enter institution name"
              placeholderTextColor="#9CA3AF"
              value={newEducation.institution}
              onChangeText={(text) =>
                setNewEducation({ ...newEducation, institution: text })
              }
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-600 text-sm mb-2">
              Field of Study / Major
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700"
              placeholder="UI/UX Design"
              placeholderTextColor="#9CA3AF"
              value={newEducation.fieldOfStudy}
              onChangeText={(text) =>
                setNewEducation({ ...newEducation, fieldOfStudy: text })
              }
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-600 text-sm mb-2">Start Date</Text>
            <TouchableOpacity
              onPress={() => setShowStartDatePicker(true)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
            >
              <Text className={newEducation.startDate ? "text-gray-700" : "text-gray-400"}>
                {newEducation.startDate || 'MM/DD/YYYY'}
              </Text>
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={handleStartDateChange}
              />
            )}
          </View>

          <View className="mb-4">
            <Text className="text-gray-600 text-sm mb-2">End Date</Text>
            <TouchableOpacity
              onPress={() => setShowEndDatePicker(true)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
            >
              <Text className={newEducation.endDate ? "text-gray-700" : "text-gray-400"}>
                {newEducation.endDate || 'MM/DD/YYYY'}
              </Text>
            </TouchableOpacity>
            {showEndDatePicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={handleEndDateChange}
              />
            )}
          </View>

          <View className="mb-4">
            <Text className="text-gray-600 text-sm mb-2">Grade / GPA</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700"
              placeholder="3.7 / 4.0"
              placeholderTextColor="#9CA3AF"
              value={newEducation.grade}
              onChangeText={(text) =>
                setNewEducation({ ...newEducation, grade: text })
              }
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            className="bg-primary-blue rounded-xl py-3 mb-3 items-center"
            activeOpacity={0.8}
            onPress={handleSaveEducation}
            disabled={isAdding || isUpdating}
          >
            <Text className="text-white text-sm font-semibold">
              {isAdding || isUpdating ? 'Saving...' : 'Update'}
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

      {/* Add Education Button */}
      {!showAddEducation && (
        <TouchableOpacity
          className="bg-primary-blue rounded-xl py-3 items-center"
          activeOpacity={0.8}
          onPress={() => setShowAddEducation(true)}
        >
          <Text className="text-white text-sm font-semibold">
            {educationList.length > 0
              ? 'Add More Education'
              : '+ Add Education'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
