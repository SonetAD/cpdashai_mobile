import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import {
  useAddExtraCurricularMutation,
  useDeleteExtraCurricularMutation,
  useUpdateExtraCurricularMutation,
  useGetCandidateProfileQuery,
  AddExtraCurricularInput,
  UpdateExtraCurricularInput
} from '../../../../services/api';
import { useAlert } from '../../../../contexts/AlertContext';
import Svg, { Path } from 'react-native-svg';

interface ExtraCurricularActivity {
  id: string;
  activity: string;
  role?: string;
  organization?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

const PlusIcon = ({ size = 20, color = "#437EF4" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5v14M5 12h14"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EditIcon = ({ size = 16, color = "#6B7280" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const DeleteIcon = ({ size = 16, color = "#DC2626" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ActivityIcon = ({ size = 48, color = "#D1D5DB" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

export default function ExtraCurricularTab() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentlyActive, setCurrentlyActive] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState<'start' | 'end' | null>(null);
  const [showYearPicker, setShowYearPicker] = useState<'start' | 'end' | null>(null);

  const { data: profileData, refetch: refetchProfile } = useGetCandidateProfileQuery();
  const [addExtraCurricular] = useAddExtraCurricularMutation();
  const [deleteExtraCurricular] = useDeleteExtraCurricularMutation();
  const [updateExtraCurricular] = useUpdateExtraCurricularMutation();
  const { showAlert } = useAlert();

  // Form fields
  const [activityName, setActivityName] = useState('');
  const [role, setRole] = useState('');
  const [organization, setOrganization] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [endYear, setEndYear] = useState('');
  const [description, setDescription] = useState('');

  // Get activities from profile and map snake_case to camelCase
  const activities: ExtraCurricularActivity[] = React.useMemo(() => {
    const items = profileData?.myProfile?.extraCurricular || [];
    // Map snake_case fields to camelCase
    return items.map((item: any) => ({
      id: item.id,
      activity: item.activity,
      role: item.role,
      organization: item.organization,
      description: item.description,
      startDate: item.start_date || item.startDate,
      endDate: item.end_date || item.endDate,
    }));
  }, [profileData]);

  const resetForm = () => {
    setActivityName('');
    setRole('');
    setOrganization('');
    setStartMonth('');
    setStartYear('');
    setEndMonth('');
    setEndYear('');
    setDescription('');
    setCurrentlyActive(false);
    setEditingIndex(null);
  };

  const handleEdit = (item: ExtraCurricularActivity, index: number) => {
    setEditingIndex(index);
    setActivityName(item.activity);
    setOrganization(item.organization || '');
    setRole(item.role || '');
    setDescription(item.description || '');

    // Parse dates
    if (item.startDate) {
      const startDate = new Date(item.startDate);
      setStartMonth(months[startDate.getMonth()]);
      setStartYear(startDate.getFullYear().toString());
    }

    if (item.endDate) {
      const endDate = new Date(item.endDate);
      setEndMonth(months[endDate.getMonth()]);
      setEndYear(endDate.getFullYear().toString());
      setCurrentlyActive(false);
    } else {
      setCurrentlyActive(true);
    }

    setShowEditModal(true);
  };

  const handleDelete = async (index: number) => {
    Alert.alert(
      'Delete Extra-curricular Activity',
      'Are you sure you want to delete this activity?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteExtraCurricular({ index }).unwrap();

              if (response.deleteExtraCurricular?.__typename === 'SuccessType') {
                showAlert({
                  type: 'success',
                  title: 'Success!',
                  message: 'Extra-curricular activity deleted successfully',
                  buttons: [{ text: 'OK', style: 'default' }],
                });
                await refetchProfile();
              } else {
                throw new Error('Failed to delete activity');
              }
            } catch (error) {
              showAlert({
                type: 'error',
                title: 'Error',
                message: 'Failed to delete extra-curricular activity',
                buttons: [{ text: 'OK', style: 'default' }],
              });
            }
          },
        },
      ],
    );
  };

  const handleAddActivity = async () => {
    if (!activityName.trim()) {
      showAlert({
        type: 'error',
        title: 'Required Field',
        message: 'Please enter the activity name',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create date strings from month and year
      let startDateStr: string | undefined;
      let endDateStr: string | undefined;

      if (startMonth && startYear) {
        const monthIndex = months.indexOf(startMonth) + 1;
        startDateStr = `${startYear}-${monthIndex.toString().padStart(2, '0')}-01`;
      }

      if (endMonth && endYear && !currentlyActive) {
        const monthIndex = months.indexOf(endMonth) + 1;
        endDateStr = `${endYear}-${monthIndex.toString().padStart(2, '0')}-01`;
      }

      const input: AddExtraCurricularInput = {
        extraCurricular: {
          activity: activityName.trim(),
          organization: organization.trim(),
          ...(role.trim() && { role: role.trim() }),
          ...(description.trim() && { description: description.trim() }),
          ...(startDateStr && { startDate: startDateStr }),
          ...(endDateStr && { endDate: endDateStr }),
        }
      };

      const response = await addExtraCurricular(input).unwrap();

      if (response.addExtraCurricular?.__typename === 'SuccessType') {
        showAlert({
          type: 'success',
          title: 'Success!',
          message: 'Extra-curricular activity added successfully',
          buttons: [{ text: 'OK', style: 'default' }],
        });

        resetForm();
        setShowAddModal(false);
        await refetchProfile();
      } else {
        const errorData = response.addExtraCurricular;
        let errorMessage = 'Failed to add extra-curricular activity';

        if (errorData?.errors && errorData.errors.length > 0) {
          errorMessage = errorData.errors[0].message;
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        }

        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error adding extra-curricular:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to add extra-curricular activity. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateActivity = async () => {
    if (editingIndex === null) return;

    if (!activityName.trim()) {
      showAlert({
        type: 'error',
        title: 'Required Field',
        message: 'Please enter the activity name',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create date strings from month and year
      let startDateStr: string | undefined;
      let endDateStr: string | undefined;

      if (startMonth && startYear) {
        const monthIndex = months.indexOf(startMonth) + 1;
        startDateStr = `${startYear}-${monthIndex.toString().padStart(2, '0')}-01`;
      }

      if (endMonth && endYear && !currentlyActive) {
        const monthIndex = months.indexOf(endMonth) + 1;
        endDateStr = `${endYear}-${monthIndex.toString().padStart(2, '0')}-01`;
      }

      const input: UpdateExtraCurricularInput = {
        index: editingIndex,
        extraCurricular: {
          activity: activityName.trim(),
          organization: organization.trim(),
          ...(role.trim() && { role: role.trim() }),
          ...(description.trim() && { description: description.trim() }),
          ...(startDateStr && { startDate: startDateStr }),
          ...(endDateStr && { endDate: endDateStr }),
        }
      };

      const response = await updateExtraCurricular(input).unwrap();

      if (response.updateExtraCurricular?.__typename === 'SuccessType') {
        showAlert({
          type: 'success',
          title: 'Success!',
          message: 'Extra-curricular activity updated successfully',
          buttons: [{ text: 'OK', style: 'default' }],
        });

        resetForm();
        setShowEditModal(false);
        await refetchProfile();
      } else {
        throw new Error('Failed to update extra-curricular activity');
      }
    } catch (error: any) {
      console.error('Error updating extra-curricular:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to update extra-curricular activity. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Extra-curricular Activities</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.7}
          >
            <PlusIcon size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Activity</Text>
          </TouchableOpacity>
        </View>

        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIcon size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>
              No extra-curricular activities added yet
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Add your clubs, sports, volunteering, and other activities
            </Text>
          </View>
        ) : (
          <View style={styles.activitiesList}>
            {activities.map((activity, index) => {
              // Parse dates to show month and year
              const formatDate = (dateStr?: string) => {
                if (!dateStr) return null;
                const date = new Date(dateStr);
                return `${months[date.getMonth()]} ${date.getFullYear()}`;
              };

              return (
                <View key={activity.id || index} style={styles.activityCard}>
                  <View style={styles.activityHeader}>
                    <Text style={styles.activityName}>{activity.activity}</Text>
                    <View style={styles.activityActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEdit(activity, index)}
                      >
                        <EditIcon size={16} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(index)}
                      >
                        <DeleteIcon size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {activity.role && (
                    <Text style={styles.activityRole}>{activity.role}</Text>
                  )}

                  {activity.organization && (
                    <Text style={styles.activityOrganization}>{activity.organization}</Text>
                  )}

                  <View style={styles.activityPeriod}>
                    <Text style={styles.periodText}>
                      {formatDate(activity.startDate) || 'Start date'} - {' '}
                      {activity.endDate ? formatDate(activity.endDate) : 'Present'}
                    </Text>
                  </View>

                  {activity.description && (
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Extra-curricular Activity</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formGroup}>
                <Text style={styles.label}>Activity Name *</Text>
                <TextInput
                  style={styles.input}
                  value={activityName}
                  onChangeText={setActivityName}
                  placeholder="e.g., Debate Club, Basketball Team"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Role/Position</Text>
                <TextInput
                  style={styles.input}
                  value={role}
                  onChangeText={setRole}
                  placeholder="e.g., President, Captain, Member"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Organization</Text>
                <TextInput
                  style={styles.input}
                  value={organization}
                  onChangeText={setOrganization}
                  placeholder="e.g., School, University, Community Center"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Start Month</Text>
                  <TouchableOpacity
                    style={styles.selectInput}
                    onPress={() => setShowMonthPicker('start')}
                  >
                    <Text style={startMonth ? styles.selectText : styles.selectPlaceholder}>
                      {startMonth || 'Select month'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Start Year</Text>
                  <TouchableOpacity
                    style={styles.selectInput}
                    onPress={() => setShowYearPicker('start')}
                  >
                    <Text style={startYear ? styles.selectText : styles.selectPlaceholder}>
                      {startYear || 'Select year'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setCurrentlyActive(!currentlyActive)}
                >
                  {currentlyActive && (
                    <View style={styles.checkboxChecked}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Currently Active</Text>
              </View>

              {!currentlyActive && (
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, styles.halfWidth]}>
                    <Text style={styles.label}>End Month</Text>
                    <TouchableOpacity
                      style={styles.selectInput}
                      onPress={() => setShowMonthPicker('end')}
                    >
                      <Text style={endMonth ? styles.selectText : styles.selectPlaceholder}>
                        {endMonth || 'Select month'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.formGroup, styles.halfWidth]}>
                    <Text style={styles.label}>End Year</Text>
                    <TouchableOpacity
                      style={styles.selectInput}
                      onPress={() => setShowYearPicker('end')}
                    >
                      <Text style={endYear ? styles.selectText : styles.selectPlaceholder}>
                        {endYear || 'Select year'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe your role, achievements, and activities..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleAddActivity}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Activity</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Extra-curricular Activity</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formGroup}>
                <Text style={styles.label}>Activity Name *</Text>
                <TextInput
                  style={styles.input}
                  value={activityName}
                  onChangeText={setActivityName}
                  placeholder="e.g., Debate Club, Basketball Team"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Role/Position</Text>
                <TextInput
                  style={styles.input}
                  value={role}
                  onChangeText={setRole}
                  placeholder="e.g., President, Captain, Member"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Organization</Text>
                <TextInput
                  style={styles.input}
                  value={organization}
                  onChangeText={setOrganization}
                  placeholder="e.g., School, University, Community Center"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Start Month</Text>
                  <TouchableOpacity
                    style={styles.selectInput}
                    onPress={() => setShowMonthPicker('start')}
                  >
                    <Text style={startMonth ? styles.selectText : styles.selectPlaceholder}>
                      {startMonth || 'Select month'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Start Year</Text>
                  <TouchableOpacity
                    style={styles.selectInput}
                    onPress={() => setShowYearPicker('start')}
                  >
                    <Text style={startYear ? styles.selectText : styles.selectPlaceholder}>
                      {startYear || 'Select year'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setCurrentlyActive(!currentlyActive)}
                >
                  {currentlyActive && (
                    <View style={styles.checkboxChecked}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Currently Active</Text>
              </View>

              {!currentlyActive && (
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, styles.halfWidth]}>
                    <Text style={styles.label}>End Month</Text>
                    <TouchableOpacity
                      style={styles.selectInput}
                      onPress={() => setShowMonthPicker('end')}
                    >
                      <Text style={endMonth ? styles.selectText : styles.selectPlaceholder}>
                        {endMonth || 'Select month'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.formGroup, styles.halfWidth]}>
                    <Text style={styles.label}>End Year</Text>
                    <TouchableOpacity
                      style={styles.selectInput}
                      onPress={() => setShowYearPicker('end')}
                    >
                      <Text style={endYear ? styles.selectText : styles.selectPlaceholder}>
                        {endYear || 'Select year'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe your role, achievements, and activities..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleUpdateActivity}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Activity</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Month Picker Modal */}
      {showMonthPicker && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMonthPicker(null)}
        >
          <TouchableOpacity
            style={styles.pickerOverlay}
            activeOpacity={1}
            onPress={() => setShowMonthPicker(null)}
          >
            <View style={styles.pickerContent}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Month</Text>
                <TouchableOpacity onPress={() => setShowMonthPicker(null)}>
                  <Text style={styles.pickerClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerScroll}>
                {months.map((month) => (
                  <TouchableOpacity
                    key={month}
                    style={styles.pickerItem}
                    onPress={() => {
                      if (showMonthPicker === 'start') {
                        setStartMonth(month);
                      } else {
                        setEndMonth(month);
                      }
                      setShowMonthPicker(null);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{month}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Year Picker Modal */}
      {showYearPicker && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowYearPicker(null)}
        >
          <TouchableOpacity
            style={styles.pickerOverlay}
            activeOpacity={1}
            onPress={() => setShowYearPicker(null)}
          >
            <View style={styles.pickerContent}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Year</Text>
                <TouchableOpacity onPress={() => setShowYearPicker(null)}>
                  <Text style={styles.pickerClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerScroll}>
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={styles.pickerItem}
                    onPress={() => {
                      if (showYearPicker === 'start') {
                        setStartYear(year.toString());
                      } else {
                        setEndYear(year.toString());
                      }
                      setShowYearPicker(null);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{year}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    flexWrap: 'wrap',
    rowGap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    minWidth: 150,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#437EF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexShrink: 0,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  activitiesList: {
    padding: 20,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  activityActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  activityRole: {
    fontSize: 14,
    fontWeight: '500',
    color: '#437EF4',
    marginBottom: 4,
  },
  activityOrganization: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  activityPeriod: {
    marginBottom: 8,
  },
  periodText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  activityDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    display: 'flex',
    flexDirection: 'column',
  },
  modalScrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6B7280',
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectText: {
    fontSize: 14,
    color: '#111827',
  },
  selectPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#437EF4',
    width: '100%',
    height: '100%',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#437EF4',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Picker Modal Styles
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '80%',
    maxHeight: '60%',
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  pickerClose: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '600',
  },
  pickerScroll: {
    maxHeight: 300,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerItemText: {
    fontSize: 15,
    color: '#374151',
  },
});