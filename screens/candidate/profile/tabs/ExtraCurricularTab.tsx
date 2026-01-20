import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSelector } from 'react-redux';
import {
  useAddExtraCurricularMutation,
  useDeleteExtraCurricularMutation,
  useUpdateExtraCurricularMutation,
  useGetCandidateProfileQuery,
  AddExtraCurricularInput,
  UpdateExtraCurricularInput
} from '../../../../services/api';
import { useAlert } from '../../../../contexts/AlertContext';
import { GlassDatePicker, DatePickerTrigger } from '../../../../components/ui/GlassDatePicker';
import { KeyboardAwareFormModal, FormInputGroup } from '../../../../components/ui/KeyboardAwareFormModal';
import { GlassButton } from '../../../../components/ui/GlassButton';
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
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const { data: profileData, refetch: refetchProfile } = useGetCandidateProfileQuery();
  const [addExtraCurricular] = useAddExtraCurricularMutation();
  const [deleteExtraCurricular] = useDeleteExtraCurricularMutation();
  const [updateExtraCurricular] = useUpdateExtraCurricularMutation();
  const { showAlert } = useAlert();

  // Auth check
  const authToken = useSelector((state: any) => state.auth?.token);

  // Responsive dimensions
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 360;
  const isMediumScreen = screenWidth < 400;

  // Responsive card styles
  const responsiveCardStyles = useMemo(() => ({
    iconBadgeOuter: {
      width: isSmallScreen ? 40 : isMediumScreen ? 46 : 52,
      height: isSmallScreen ? 40 : isMediumScreen ? 46 : 52,
      borderRadius: isSmallScreen ? 12 : 16,
      marginRight: isSmallScreen ? 8 : 12,
    },
    iconBadge: {
      width: isSmallScreen ? 36 : isMediumScreen ? 42 : 48,
      height: isSmallScreen ? 36 : isMediumScreen ? 42 : 48,
      borderRadius: isSmallScreen ? 10 : 14,
    },
    activityName: {
      fontSize: isSmallScreen ? 14 : isMediumScreen ? 15 : 17,
      lineHeight: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
    },
    activityRole: {
      fontSize: isSmallScreen ? 12 : isMediumScreen ? 13 : 14,
    },
    actionButton: {
      width: isSmallScreen ? 30 : isMediumScreen ? 33 : 36,
      height: isSmallScreen ? 30 : isMediumScreen ? 33 : 36,
      borderRadius: isSmallScreen ? 8 : 10,
    },
    cardPadding: {
      padding: isSmallScreen ? 12 : 16,
    },
    metaBadge: {
      paddingHorizontal: isSmallScreen ? 8 : 12,
      paddingVertical: isSmallScreen ? 6 : 8,
    },
    metaText: {
      fontSize: isSmallScreen ? 10 : 12,
    },
    description: {
      fontSize: isSmallScreen ? 12 : 14,
      padding: isSmallScreen ? 8 : 10,
    },
    organizationText: {
      fontSize: isSmallScreen ? 11 : 13,
    },
  }), [isSmallScreen, isMediumScreen]);

  // Form fields
  const [activityName, setActivityName] = useState('');
  const [role, setRole] = useState('');
  const [organization, setOrganization] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
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
    setStartDate(null);
    setEndDate(null);
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
      setStartDate(new Date(item.startDate));
    } else {
      setStartDate(null);
    }

    if (item.endDate) {
      setEndDate(new Date(item.endDate));
      setCurrentlyActive(false);
    } else {
      setEndDate(null);
      setCurrentlyActive(true);
    }

    setShowEditModal(true);
  };

  const handleDelete = async (index: number) => {
    showAlert({
      type: 'warning',
      title: 'Delete Activity',
      message: 'Are you sure you want to delete this extra-curricular activity? This action cannot be undone.',
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
    });
  };

  const handleAddActivity = async () => {
    // Auth check before API call
    if (!authToken) {
      showAlert({
        type: 'error',
        title: 'Session Expired',
        message: 'Please log in again to continue.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

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
      // Create date strings from Date objects
      let startDateStr: string | undefined;
      let endDateStr: string | undefined;

      if (startDate) {
        startDateStr = startDate.toISOString().split('T')[0];
      }

      if (endDate && !currentlyActive) {
        endDateStr = endDate.toISOString().split('T')[0];
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
    // Auth check before API call
    if (!authToken) {
      showAlert({
        type: 'error',
        title: 'Session Expired',
        message: 'Please log in again to continue.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

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
      // Create date strings from Date objects
      let startDateStr: string | undefined;
      let endDateStr: string | undefined;

      if (startDate) {
        startDateStr = startDate.toISOString().split('T')[0];
      }

      if (endDate && !currentlyActive) {
        endDateStr = endDate.toISOString().split('T')[0];
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

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <>
      <ScrollView style={glassStyles.container} showsVerticalScrollIndicator={false}>
        {/* Add Button at Top */}
        <TouchableOpacity
          style={cardStyles.addButton}
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowAddModal(true);
          }}
        >
          <View style={cardStyles.addButtonContent}>
            <PlusIcon size={20} color="#FFFFFF" />
            <Text style={cardStyles.addButtonText}>Add Activity</Text>
          </View>
        </TouchableOpacity>

        {activities.length === 0 ? (
          <View style={glassStyles.emptyState}>
            <ActivityIcon size={48} color="#D1D5DB" />
            <Text style={glassStyles.emptyStateText}>
              No extra-curricular activities added yet
            </Text>
            <Text style={glassStyles.emptyStateSubtext}>
              Add your clubs, sports, volunteering, and other activities
            </Text>
          </View>
        ) : (
          <View style={{ marginBottom: 16 }}>
            {activities.map((activity, index) => (
              <View key={activity.id || index} style={cardStyles.cardWrapper}>
                {/* Shadow layer */}
                <View style={cardStyles.cardShadow} />

                {/* Glass card with gradient border */}
                <View style={cardStyles.cardOuter}>
                  <View style={[cardStyles.cardInner, responsiveCardStyles.cardPadding]}>
                    {/* Header Row */}
                    <View style={cardStyles.headerRow}>
                      {/* Activity Icon Badge with glow */}
                      <View style={[cardStyles.iconBadgeOuter, responsiveCardStyles.iconBadgeOuter]}>
                        <View style={[cardStyles.iconBadge, responsiveCardStyles.iconBadge]}>
                          <ActivityIcon size={isSmallScreen ? 18 : 24} color="#3B82F6" />
                        </View>
                      </View>

                      <View style={cardStyles.titleContainer}>
                        <Text style={[cardStyles.activityName, responsiveCardStyles.activityName]} numberOfLines={2}>{activity.activity}</Text>
                        {activity.role && (
                          <Text style={[cardStyles.activityRole, responsiveCardStyles.activityRole]} numberOfLines={1}>{activity.role}</Text>
                        )}
                      </View>

                      <View style={cardStyles.actionButtons}>
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            handleEdit(activity, index);
                          }}
                          style={[cardStyles.actionButton, responsiveCardStyles.actionButton]}
                        >
                          <EditIcon size={isSmallScreen ? 14 : 16} color="#64748B" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            handleDelete(index);
                          }}
                          style={[cardStyles.actionButton, responsiveCardStyles.actionButton]}
                        >
                          <DeleteIcon size={isSmallScreen ? 14 : 16} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {activity.organization && (
                      <View style={[cardStyles.organizationBadge, responsiveCardStyles.metaBadge]}>
                        <Text style={[cardStyles.organizationText, responsiveCardStyles.organizationText]} numberOfLines={1}>{activity.organization}</Text>
                      </View>
                    )}

                    {activity.description && (
                      <Text style={[cardStyles.description, responsiveCardStyles.description]} numberOfLines={2}>{activity.description}</Text>
                    )}

                    {/* Divider */}
                    <View style={cardStyles.divider} />

                    <View style={cardStyles.metaRow}>
                      <View style={[cardStyles.metaBadge, responsiveCardStyles.metaBadge]}>
                        <Text style={[cardStyles.metaText, responsiveCardStyles.metaText]}>
                          {formatDisplayDate(activity.startDate) || 'Start'} - {activity.endDate ? formatDisplayDate(activity.endDate) : 'Present'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Modal - Using KeyboardAwareFormModal */}
      <KeyboardAwareFormModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add Extra-curricular Activity"
        isLoading={isSubmitting}
        footerContent={
          <GlassButton
            text={isSubmitting ? '' : 'Add Activity'}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleAddActivity();
            }}
            disabled={isSubmitting}
            loading={isSubmitting}
            colors={['#3B82F6', '#2563EB']}
            shadowColor="rgba(37, 99, 235, 0.4)"
            height={52}
            borderRadius={14}
          />
        }
      >
        {/* Activity Name */}
        <FormInputGroup label="Activity Name" required>
          <TextInput
            style={glassStyles.input}
            value={activityName}
            onChangeText={setActivityName}
            placeholder="e.g., Debate Club, Basketball Team"
            placeholderTextColor="#9CA3AF"
            editable={!isSubmitting}
          />
        </FormInputGroup>

        {/* Role/Position */}
        <FormInputGroup label="Role/Position">
          <TextInput
            style={glassStyles.input}
            value={role}
            onChangeText={setRole}
            placeholder="e.g., President, Captain, Member"
            placeholderTextColor="#9CA3AF"
            editable={!isSubmitting}
          />
        </FormInputGroup>

        {/* Organization */}
        <FormInputGroup label="Organization">
          <TextInput
            style={glassStyles.input}
            value={organization}
            onChangeText={setOrganization}
            placeholder="e.g., School, University, Community Center"
            placeholderTextColor="#9CA3AF"
            editable={!isSubmitting}
          />
        </FormInputGroup>

        {/* Start Date */}
        <FormInputGroup label="Start Date">
          <DatePickerTrigger
            value={startDate?.toLocaleDateString() || ''}
            placeholder="Select start date"
            onPress={() => setShowStartDatePicker(true)}
          />
        </FormInputGroup>

        {/* Currently Active Checkbox */}
        <View style={glassStyles.checkboxRow}>
          <TouchableOpacity
            style={glassStyles.checkbox}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCurrentlyActive(!currentlyActive);
            }}
          >
            {currentlyActive && (
              <View style={glassStyles.checkboxChecked}>
                <Text style={glassStyles.checkmark}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={glassStyles.checkboxLabel}>Currently Active</Text>
        </View>

        {/* End Date */}
        {!currentlyActive && (
          <FormInputGroup label="End Date">
            <DatePickerTrigger
              value={endDate?.toLocaleDateString() || ''}
              placeholder="Select end date"
              onPress={() => setShowEndDatePicker(true)}
            />
          </FormInputGroup>
        )}

        {/* Description */}
        <FormInputGroup label="Description">
          <TextInput
            style={[glassStyles.input, glassStyles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your role, achievements, and activities..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isSubmitting}
          />
        </FormInputGroup>
      </KeyboardAwareFormModal>

      {/* Edit Modal - Using KeyboardAwareFormModal */}
      <KeyboardAwareFormModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Edit Activity"
        isLoading={isSubmitting}
        footerContent={
          <GlassButton
            text={isSubmitting ? '' : 'Update Activity'}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleUpdateActivity();
            }}
            disabled={isSubmitting}
            loading={isSubmitting}
            colors={['#3B82F6', '#2563EB']}
            shadowColor="rgba(37, 99, 235, 0.4)"
            height={52}
            borderRadius={14}
          />
        }
      >
        {/* Activity Name */}
        <FormInputGroup label="Activity Name" required>
          <TextInput
            style={glassStyles.input}
            value={activityName}
            onChangeText={setActivityName}
            placeholder="e.g., Debate Club, Basketball Team"
            placeholderTextColor="#9CA3AF"
            editable={!isSubmitting}
          />
        </FormInputGroup>

        {/* Role/Position */}
        <FormInputGroup label="Role/Position">
          <TextInput
            style={glassStyles.input}
            value={role}
            onChangeText={setRole}
            placeholder="e.g., President, Captain, Member"
            placeholderTextColor="#9CA3AF"
            editable={!isSubmitting}
          />
        </FormInputGroup>

        {/* Organization */}
        <FormInputGroup label="Organization">
          <TextInput
            style={glassStyles.input}
            value={organization}
            onChangeText={setOrganization}
            placeholder="e.g., School, University, Community Center"
            placeholderTextColor="#9CA3AF"
            editable={!isSubmitting}
          />
        </FormInputGroup>

        {/* Start Date */}
        <FormInputGroup label="Start Date">
          <DatePickerTrigger
            value={startDate?.toLocaleDateString() || ''}
            placeholder="Select start date"
            onPress={() => setShowStartDatePicker(true)}
          />
        </FormInputGroup>

        {/* Currently Active Checkbox */}
        <View style={glassStyles.checkboxRow}>
          <TouchableOpacity
            style={glassStyles.checkbox}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCurrentlyActive(!currentlyActive);
            }}
          >
            {currentlyActive && (
              <View style={glassStyles.checkboxChecked}>
                <Text style={glassStyles.checkmark}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={glassStyles.checkboxLabel}>Currently Active</Text>
        </View>

        {/* End Date */}
        {!currentlyActive && (
          <FormInputGroup label="End Date">
            <DatePickerTrigger
              value={endDate?.toLocaleDateString() || ''}
              placeholder="Select end date"
              onPress={() => setShowEndDatePicker(true)}
            />
          </FormInputGroup>
        )}

        {/* Description */}
        <FormInputGroup label="Description">
          <TextInput
            style={[glassStyles.input, glassStyles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your role, achievements, and activities..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isSubmitting}
          />
        </FormInputGroup>
      </KeyboardAwareFormModal>

      {/* Glass Date Pickers */}
      <GlassDatePicker
        visible={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
        onSelect={(date) => {
          setStartDate(date);
          setShowStartDatePicker(false);
        }}
        selectedDate={startDate || undefined}
        maxDate={new Date()}
        title="Select Start Date"
      />

      <GlassDatePicker
        visible={showEndDatePicker}
        onClose={() => setShowEndDatePicker(false)}
        onSelect={(date) => {
          setEndDate(date);
          setShowEndDatePicker(false);
        }}
        selectedDate={endDate || undefined}
        minDate={startDate || undefined}
        maxDate={new Date()}
        title="Select End Date"
      />
    </>
  );
}

// Glassmorphism Styles
const glassStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 24,
    paddingTop: 20,
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
  input: {
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    width: '100%',
    height: '100%',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '500',
  },
});

// Card Styles for Activity Display
const cardStyles = StyleSheet.create({
  addButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 20,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // New glass card styles
  cardWrapper: {
    marginBottom: 16,
    borderRadius: 20,
  },
  cardShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: 'rgba(59, 130, 246, 1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  cardOuter: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    backgroundColor: 'rgba(219, 234, 254, 0.4)',
    overflow: 'hidden',
  },
  cardInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 16,
    borderRadius: 18,
    margin: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconBadgeOuter: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: 'rgba(59, 130, 246, 1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  titleContainer: {
    flex: 1,
    paddingTop: 4,
  },
  activityName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
    lineHeight: 22,
  },
  activityRole: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(241, 245, 249, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  organizationBadge: {
    backgroundColor: 'rgba(219, 234, 254, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  organizationText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
    backgroundColor: 'rgba(241, 245, 249, 0.5)',
    padding: 10,
    borderRadius: 10,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(241, 245, 249, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});