import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Dimensions } from 'react-native';
import { Canvas, RoundedRect, LinearGradient as SkiaLinearGradient, vec, Shadow } from '@shopify/react-native-skia';
import { GlassDatePicker, DatePickerTrigger } from '../../../../components/ui/GlassDatePicker';
import { GlassButton } from '../../../../components/ui/GlassButton';
import { EditIcon, DeleteIcon } from '../../../../components/profile/Icons';
import {
  useAddEducationMutation,
  useUpdateEducationMutation,
  useDeleteEducationMutation,
} from '../../../../services/api';
import { useAlert } from '../../../../contexts/AlertContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  // Date picker modal states
  const [datePickerConfig, setDatePickerConfig] = useState<{
    visible: boolean;
    field: 'startDate' | 'endDate';
    minDate?: Date;
    selectedDate?: Date;
  }>({
    visible: false,
    field: 'startDate',
  });

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

  // Helper to parse date string (MM/DD/YYYY format)
  const parseDateString = (dateStr?: string): Date | undefined => {
    if (!dateStr) return undefined;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    return undefined;
  };

  // Open date picker modal
  const openDatePicker = (field: 'startDate' | 'endDate') => {
    let minDate: Date | undefined;
    let selectedDate: Date | undefined;

    // For end date, set minDate to start date + 1 day
    if (field === 'endDate' && newEducation.startDate) {
      const startDate = parseDateString(newEducation.startDate);
      if (startDate) {
        minDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      }
    }
    selectedDate = parseDateString(newEducation[field]);

    setDatePickerConfig({
      visible: true,
      field,
      minDate,
      selectedDate,
    });
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    const { field } = datePickerConfig;
    const formattedDate = date.toLocaleDateString('en-US');
    setNewEducation({ ...newEducation, [field]: formattedDate });
  };

  // Close date picker
  const closeDatePicker = () => {
    setDatePickerConfig(prev => ({ ...prev, visible: false }));
  };

  return (
    <>
    <View>
      {/* Existing Education List */}
      {educationList.map((edu) => (
        <View key={edu.id} style={styles.glassCardWrapper}>
          {/* Skia Glass Background */}
          <Canvas style={styles.glassCanvas}>
            <RoundedRect x={0} y={0} width={SCREEN_WIDTH - 48} height={100} r={16}>
              <SkiaLinearGradient
                start={vec(0, 0)}
                end={vec(SCREEN_WIDTH - 48, 100)}
                colors={['rgba(255, 255, 255, 0.95)', 'rgba(241, 245, 249, 0.9)', 'rgba(255, 255, 255, 0.85)']}
              />
              <Shadow dx={0} dy={4} blur={12} color="rgba(37, 99, 235, 0.15)" />
            </RoundedRect>
            {/* Top highlight for liquid glass effect */}
            <RoundedRect x={1} y={1} width={SCREEN_WIDTH - 50} height={40} r={15}>
              <SkiaLinearGradient
                start={vec(0, 0)}
                end={vec(0, 40)}
                colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
              />
            </RoundedRect>
          </Canvas>
          {/* Content overlay */}
          <View style={styles.glassCardContent}>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryTitle}>{edu.degree || 'Degree'}</Text>
              <Text style={styles.summarySubtitle}>{edu.institution || 'Institution'}</Text>
              <Text style={styles.summaryMeta}>
                {edu.fieldOfStudy && `${edu.fieldOfStudy} • `}
                {edu.startDate} - {edu.endDate}
                {edu.grade && ` • Grade: ${edu.grade}`}
              </Text>
            </View>
            <View style={styles.summaryActions}>
              <TouchableOpacity
                style={styles.summaryActionButton}
                onPress={() => handleEditEducation(edu)}
              >
                <Text style={styles.summaryActionEdit}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.summaryActionButton}
                onPress={() => handleDeleteEducation(edu.id)}
              >
                <Text style={styles.summaryActionDelete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      {/* Add Education Form */}
      {showAddEducation && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {editingEducationId ? 'Edit Education' : 'Add Education'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Degree / Qualification</Text>
            <TextInput
              style={styles.input}
              placeholder="Bachelor of Science in Computer Science"
              placeholderTextColor="#9CA3AF"
              value={newEducation.degree}
              onChangeText={(text) =>
                setNewEducation({ ...newEducation, degree: text })
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Institution Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter institution name"
              placeholderTextColor="#9CA3AF"
              value={newEducation.institution}
              onChangeText={(text) =>
                setNewEducation({ ...newEducation, institution: text })
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Field of Study / Major</Text>
            <TextInput
              style={styles.input}
              placeholder="UI/UX Design"
              placeholderTextColor="#9CA3AF"
              value={newEducation.fieldOfStudy}
              onChangeText={(text) =>
                setNewEducation({ ...newEducation, fieldOfStudy: text })
              }
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Start Date</Text>
              <DatePickerTrigger
                value={newEducation.startDate}
                placeholder="Select start date"
                onPress={() => openDatePicker('startDate')}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>End Date</Text>
              <DatePickerTrigger
                value={newEducation.endDate}
                placeholder="Select end date"
                onPress={() => openDatePicker('endDate')}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Grade / GPA (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="3.7 / 4.0"
              placeholderTextColor="#9CA3AF"
              value={newEducation.grade}
              onChangeText={(text) =>
                setNewEducation({ ...newEducation, grade: text })
              }
            />
          </View>

          <View style={styles.buttonRow}>
            <GlassButton
              text={isAdding || isUpdating ? 'Saving...' : editingEducationId ? 'Update' : 'Save'}
              width={(SCREEN_WIDTH - 72) / 2}
              height={48}
              onPress={handleSaveEducation}
              disabled={isAdding || isUpdating}
            />
            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.8}
              onPress={resetForm}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Add Education Button */}
      {!showAddEducation && (
        <GlassButton
          text={educationList.length > 0 ? 'Add More Education' : '+ Add Education'}
          width={SCREEN_WIDTH - 48}
          height={52}
          onPress={() => setShowAddEducation(true)}
        />
      )}
    </View>

    {/* Glass Date Picker Modal */}
    <GlassDatePicker
      visible={datePickerConfig.visible}
      onClose={closeDatePicker}
      onSelect={handleDateSelect}
      selectedDate={datePickerConfig.selectedDate}
      minDate={datePickerConfig.minDate}
      title={datePickerConfig.field === 'startDate' ? 'Start Date' : 'End Date'}
    />
    </>
  );
};

const styles = StyleSheet.create({
  glassCardWrapper: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  glassCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  glassCardContent: {
    padding: 16,
    minHeight: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryContent: {
    flex: 1,
    marginRight: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  summarySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 4,
  },
  summaryMeta: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  summaryActions: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'flex-end',
  },
  summaryActionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  summaryActionEdit: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  summaryActionDelete: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
  },
  inputRow: {
    flexDirection: 'row',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
});
