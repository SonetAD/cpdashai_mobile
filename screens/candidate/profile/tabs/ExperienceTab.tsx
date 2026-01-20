import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, TouchableWithoutFeedback, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Canvas, RoundedRect, LinearGradient as SkiaLinearGradient, vec, Shadow, BackdropBlur, Fill, Group } from '@shopify/react-native-skia';
import { BlurView } from '@react-native-community/blur';
import { GlassDatePicker, DatePickerTrigger } from '../../../../components/ui/GlassDatePicker';
import { GlassButton } from '../../../../components/ui/GlassButton';
import { ChevronDownIcon } from '../../../../components/profile/Icons';
import {
  useAddExperienceMutation,
  useUpdateExperienceMutation,
  useDeleteExperienceMutation,
} from '../../../../services/api';
import { useAlert } from '../../../../contexts/AlertContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    if (field === 'endDate' && newExperience.startDate) {
      const startDate = parseDateString(newExperience.startDate);
      if (startDate) {
        minDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      }
    }
    selectedDate = parseDateString(newExperience[field]);

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
    setNewExperience({ ...newExperience, [field]: formattedDate });
  };

  // Close date picker
  const closeDatePicker = () => {
    setDatePickerConfig(prev => ({ ...prev, visible: false }));
  };

  return (
    <>
      <View>
        {/* Existing Experience List */}
        {experienceList.map((exp) => (
          <View key={exp.id} style={styles.glassCardWrapper}>
            {/* Skia Glass Background */}
            <Canvas style={styles.glassCanvasLarge}>
              <RoundedRect x={0} y={0} width={SCREEN_WIDTH - 48} height={120} r={16}>
                <SkiaLinearGradient
                  start={vec(0, 0)}
                  end={vec(SCREEN_WIDTH - 48, 120)}
                  colors={['rgba(255, 255, 255, 0.95)', 'rgba(241, 245, 249, 0.9)', 'rgba(255, 255, 255, 0.85)']}
                />
                <Shadow dx={0} dy={4} blur={12} color="rgba(37, 99, 235, 0.15)" />
              </RoundedRect>
              {/* Top highlight for liquid glass effect */}
              <RoundedRect x={1} y={1} width={SCREEN_WIDTH - 50} height={45} r={15}>
                <SkiaLinearGradient
                  start={vec(0, 0)}
                  end={vec(0, 45)}
                  colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
                />
              </RoundedRect>
            </Canvas>
            {/* Content overlay */}
            <View style={styles.glassCardContentLarge}>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryTitle}>{exp.position || 'Position'}</Text>
                <Text style={styles.summarySubtitle}>{exp.company || 'Company'}</Text>
                <Text style={styles.summaryMeta}>
                  {exp.location && `${exp.location} • `}
                  {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                </Text>
                {exp.employmentType && (
                  <Text style={styles.summaryMeta}>
                    {EMPLOYMENT_TYPE_LABELS[exp.employmentType] || exp.employmentType}
                  </Text>
                )}
                {exp.description && (
                  <Text style={styles.summaryDescription} numberOfLines={1}>
                    {exp.description}
                  </Text>
                )}
              </View>
              <View style={styles.summaryActions}>
                <TouchableOpacity
                  style={styles.summaryActionButton}
                  onPress={() => handleEditExperience(exp)}
                  disabled={isDeletingExperience}
                >
                  <Text style={styles.summaryActionEdit}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.summaryActionButton}
                  onPress={() => handleDeleteExperience(exp.index)}
                  disabled={isDeletingExperience}
                >
                  <Text style={styles.summaryActionDelete}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {/* Add/Edit Experience Form */}
        {showAddExperience && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {editingExperienceIndex !== null ? 'Edit Experience' : 'Add Experience'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Job Title / Role</Text>
              <TextInput
                style={styles.input}
                placeholder="UX/UI Designer"
                placeholderTextColor="#9CA3AF"
                value={newExperience.position}
                onChangeText={(text) =>
                  setNewExperience({ ...newExperience, position: text })
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Company Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Chawla Solutions"
                placeholderTextColor="#9CA3AF"
                value={newExperience.company}
                onChangeText={(text) =>
                  setNewExperience({ ...newExperience, company: text })
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Toronto, Canada"
                placeholderTextColor="#9CA3AF"
                value={newExperience.location}
                onChangeText={(text) =>
                  setNewExperience({ ...newExperience, location: text })
                }
              />
            </View>

            {/* Current Job Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() =>
                setNewExperience({
                  ...newExperience,
                  current: !newExperience.current,
                  endDate: !newExperience.current ? '' : newExperience.endDate,
                })
              }
            >
              <View style={[styles.checkbox, newExperience.current && styles.checkboxChecked]}>
                {newExperience.current && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>I currently work here</Text>
            </TouchableOpacity>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Start Date</Text>
                <DatePickerTrigger
                  value={newExperience.startDate}
                  placeholder="Select start date"
                  onPress={() => openDatePicker('startDate')}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>End Date</Text>
                <DatePickerTrigger
                  value={newExperience.current ? 'Present' : newExperience.endDate}
                  placeholder="Select end date"
                  onPress={() => openDatePicker('endDate')}
                  disabled={newExperience.current}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Employment Type</Text>
              <TouchableOpacity
                onPress={() => setShowEmploymentTypeModal(true)}
                style={styles.selectButton}
              >
                <Text style={newExperience.employmentType ? styles.selectText : styles.selectPlaceholder}>
                  {newExperience.employmentType ?
                    EMPLOYMENT_TYPE_LABELS[newExperience.employmentType] || newExperience.employmentType :
                    'Select employment type'}
                </Text>
                <ChevronDownIcon />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description / Responsibilities</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
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

            <View style={styles.buttonRow}>
              <GlassButton
                text={isAddingExperience || isUpdatingExperience
                  ? 'Saving...'
                  : editingExperienceIndex !== null
                  ? 'Update'
                  : 'Save'}
                width={(SCREEN_WIDTH - 72) / 2}
                height={48}
                onPress={handleSaveExperience}
                disabled={isAddingExperience || isUpdatingExperience}
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

        {/* Add Experience Button */}
        {!showAddExperience && (
          <GlassButton
            text={experienceList.length > 0 ? 'Add More Experience' : '+ Add Experience'}
            width={SCREEN_WIDTH - 48}
            height={52}
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

      {/* Employment Type Modal - True Glassmorphism */}
      <Modal
        visible={showEmploymentTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmploymentTypeModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowEmploymentTypeModal(false)}>
          <View style={styles.glassModalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.glassModalContainer}>
                {/* BlurView - Real frosted glass blur */}
                <BlurView
                  style={styles.glassModalBlur}
                  blurType="light"
                  blurAmount={20}
                  reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.95)"
                />

                {/* Skia Glass Polish Layer */}
                <Canvas style={styles.glassModalCanvas}>
                  {/* Semi-transparent glass gradient */}
                  <RoundedRect x={0} y={0} width={SCREEN_WIDTH - 48} height={420} r={24}>
                    <SkiaLinearGradient
                      start={vec(0, 0)}
                      end={vec(0, 420)}
                      colors={[
                        'rgba(255, 255, 255, 0.75)',
                        'rgba(248, 250, 252, 0.65)',
                        'rgba(255, 255, 255, 0.70)',
                      ]}
                    />
                  </RoundedRect>

                  {/* Top highlight - liquid glass reflection */}
                  <RoundedRect x={1} y={1} width={SCREEN_WIDTH - 50} height={50} r={23}>
                    <SkiaLinearGradient
                      start={vec(0, 0)}
                      end={vec(0, 50)}
                      colors={['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0)']}
                    />
                  </RoundedRect>

                  {/* Subtle border for glass edge */}
                  <RoundedRect
                    x={0.5}
                    y={0.5}
                    width={SCREEN_WIDTH - 49}
                    height={419}
                    r={23.5}
                    style="stroke"
                    strokeWidth={1}
                    color="rgba(255, 255, 255, 0.5)"
                  />
                </Canvas>

                {/* Content */}
                <View style={styles.glassModalContent}>
                  <View style={styles.glassModalHeader}>
                    <Text style={styles.glassModalTitle}>Employment Type</Text>
                    <TouchableOpacity
                      onPress={() => setShowEmploymentTypeModal(false)}
                      style={styles.glassModalCloseButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.glassModalCloseText}>×</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.glassModalOptions}>
                    {EMPLOYMENT_TYPES.map((type, index) => {
                      const isSelected = newExperience.employmentType === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          onPress={() => {
                            setNewExperience({ ...newExperience, employmentType: type });
                            setShowEmploymentTypeModal(false);
                          }}
                          style={[
                            styles.glassModalOption,
                            isSelected && styles.glassModalOptionSelected,
                            index === EMPLOYMENT_TYPES.length - 1 && styles.glassModalOptionLast,
                          ]}
                          activeOpacity={0.7}
                        >
                          <View style={[
                            styles.glassModalRadio,
                            isSelected && styles.glassModalRadioSelected,
                          ]}>
                            {isSelected && <View style={styles.glassModalRadioDot} />}
                          </View>
                          <Text style={[
                            styles.glassModalOptionText,
                            isSelected && styles.glassModalOptionTextSelected,
                          ]}>
                            {EMPLOYMENT_TYPE_LABELS[type]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  glassCardWrapper: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  glassCanvasLarge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  glassCardContentLarge: {
    padding: 16,
    minHeight: 120,
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
  summaryDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
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
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  selectButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 15,
    color: '#1F2937',
  },
  selectPlaceholder: {
    fontSize: 15,
    color: '#9CA3AF',
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
  // Glass Modal styles
  glassModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  glassModalContainer: {
    width: SCREEN_WIDTH - 48,
    height: 420,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: 'rgba(37, 99, 235, 1)',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 15,
  },
  glassModalBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  glassModalCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  glassModalContent: {
    flex: 1,
    padding: 24,
  },
  glassModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  glassModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  glassModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(241, 245, 249, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassModalCloseText: {
    fontSize: 20,
    color: '#64748B',
    fontWeight: '500',
    marginTop: -2,
  },
  glassModalOptions: {
    flex: 1,
  },
  glassModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
  },
  glassModalOptionSelected: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    marginHorizontal: -4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderBottomColor: 'transparent',
  },
  glassModalOptionLast: {
    borderBottomWidth: 0,
  },
  glassModalRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassModalRadioSelected: {
    borderColor: '#2563EB',
    borderWidth: 2,
  },
  glassModalRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  glassModalOptionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  glassModalOptionTextSelected: {
    color: '#2563EB',
    fontWeight: '600',
  },
});
