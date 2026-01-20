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
  useAddLeadershipSocialMutation,
  useDeleteLeadershipSocialMutation,
  useUpdateLeadershipSocialMutation,
  useGetCandidateProfileQuery,
  AddLeadershipSocialInput,
  UpdateLeadershipSocialInput
} from '../../../../services/api';
import { useAlert } from '../../../../contexts/AlertContext';
import { GlassDatePicker, DatePickerTrigger } from '../../../../components/ui/GlassDatePicker';
import { KeyboardAwareFormModal, FormInputGroup } from '../../../../components/ui/KeyboardAwareFormModal';
import { GlassButton } from '../../../../components/ui/GlassButton';
import Svg, { Path } from 'react-native-svg';

interface LeadershipSocialImpact {
  id: string;
  title: string;
  organization?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  impact?: string;
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

const LeadershipIcon = ({ size = 24, color = "#3B82F6" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 11V7a3 3 0 016 0v4M5 11h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 16v2"
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

export default function LeadershipSocialTab() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentlyActive, setCurrentlyActive] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const { data: profileData, refetch: refetchProfile } = useGetCandidateProfileQuery();
  const [addLeadershipSocial] = useAddLeadershipSocialMutation();
  const [deleteLeadershipSocial] = useDeleteLeadershipSocialMutation();
  const [updateLeadershipSocial] = useUpdateLeadershipSocialMutation();
  const { showAlert } = useAlert();

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
    itemTitle: {
      fontSize: isSmallScreen ? 14 : isMediumScreen ? 15 : 17,
      lineHeight: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
    },
    itemRole: {
      fontSize: isSmallScreen ? 12 : isMediumScreen ? 13 : 14,
    },
    actionButton: {
      width: isSmallScreen ? 30 : isMediumScreen ? 32 : 36,
      height: isSmallScreen ? 30 : isMediumScreen ? 32 : 36,
      borderRadius: isSmallScreen ? 8 : 10,
    },
    actionButtons: {
      gap: isSmallScreen ? 4 : 8,
    },
    organizationBadge: {
      paddingHorizontal: isSmallScreen ? 8 : 12,
      paddingVertical: isSmallScreen ? 4 : 6,
    },
    organizationText: {
      fontSize: isSmallScreen ? 11 : isMediumScreen ? 12 : 13,
    },
    description: {
      fontSize: isSmallScreen ? 12 : isMediumScreen ? 13 : 14,
      lineHeight: isSmallScreen ? 17 : isMediumScreen ? 18 : 20,
      padding: isSmallScreen ? 8 : 10,
    },
    metaBadge: {
      paddingHorizontal: isSmallScreen ? 8 : 12,
      paddingVertical: isSmallScreen ? 6 : 8,
    },
    metaText: {
      fontSize: isSmallScreen ? 10 : isMediumScreen ? 11 : 12,
    },
    impactBadge: {
      padding: isSmallScreen ? 8 : 12,
    },
    impactLabel: {
      fontSize: isSmallScreen ? 10 : isMediumScreen ? 11 : 12,
    },
    impactText: {
      fontSize: isSmallScreen ? 12 : isMediumScreen ? 13 : 14,
      lineHeight: isSmallScreen ? 17 : isMediumScreen ? 18 : 20,
    },
    cardInner: {
      padding: isSmallScreen ? 12 : isMediumScreen ? 14 : 16,
    },
  }), [isSmallScreen, isMediumScreen]);

  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [description, setDescription] = useState('');
  const [impactMetrics, setImpactMetrics] = useState('');

  const leadershipItems: LeadershipSocialImpact[] = React.useMemo(() => {
    const items = profileData?.myProfile?.leadershipSocial || [];
    return items.map((item: any) => ({
      id: item.id,
      title: item.title,
      organization: item.organization,
      role: item.role,
      description: item.description,
      impact: item.impact,
      startDate: item.start_date || item.startDate,
      endDate: item.end_date || item.endDate,
    }));
  }, [profileData]);

  const resetForm = () => {
    setTitle('');
    setOrganization('');
    setRole('');
    setStartDate(null);
    setEndDate(null);
    setDescription('');
    setImpactMetrics('');
    setCurrentlyActive(false);
    setEditingIndex(null);
  };

  const handleEdit = (item: LeadershipSocialImpact, index: number) => {
    setEditingIndex(index);
    setTitle(item.title);
    setOrganization(item.organization || '');
    setRole(item.role || '');
    setDescription(item.description || '');
    setImpactMetrics(item.impact || '');

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
      title: 'Delete Leadership',
      message: 'Are you sure you want to delete this leadership & social impact item? This action cannot be undone.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteLeadershipSocial({ index }).unwrap();
              if (response.deleteLeadershipSocial?.__typename === 'SuccessType') {
                showAlert({
                  type: 'success',
                  title: 'Success!',
                  message: 'Leadership & social impact deleted successfully',
                  buttons: [{ text: 'OK', style: 'default' }],
                });
                await refetchProfile();
              } else {
                throw new Error('Failed to delete item');
              }
            } catch (error) {
              showAlert({
                type: 'error',
                title: 'Error',
                message: 'Failed to delete leadership & social impact',
                buttons: [{ text: 'OK', style: 'default' }],
              });
            }
          },
        },
      ],
    });
  };

  const handleAddLeadership = async () => {
    if (!authToken) {
      showAlert({
        type: 'error',
        title: 'Session Expired',
        message: 'Please log in again to continue.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    if (!title.trim()) {
      showAlert({
        type: 'error',
        title: 'Required Field',
        message: 'Please enter the initiative/project title',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let startDateStr: string | undefined;
      let endDateStr: string | undefined;

      if (startDate) {
        startDateStr = startDate.toISOString().split('T')[0];
      }

      if (endDate && !currentlyActive) {
        endDateStr = endDate.toISOString().split('T')[0];
      }

      const input: AddLeadershipSocialInput = {
        leadershipSocial: {
          title: title.trim(),
          organization: organization.trim(),
          ...(role.trim() && { role: role.trim() }),
          ...(description.trim() && { description: description.trim() }),
          ...(impactMetrics.trim() && { impact: impactMetrics.trim() }),
          ...(startDateStr && { startDate: startDateStr }),
          ...(endDateStr && { endDate: endDateStr }),
        }
      };

      const response = await addLeadershipSocial(input).unwrap();

      if (response.addLeadershipSocial?.__typename === 'SuccessType') {
        showAlert({
          type: 'success',
          title: 'Success!',
          message: 'Leadership & social impact added successfully',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        resetForm();
        setShowAddModal(false);
        await refetchProfile();
      } else {
        throw new Error(response.addLeadershipSocial?.message || 'Failed to add');
      }
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to add leadership & social impact.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateLeadership = async () => {
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

    if (!title.trim()) {
      showAlert({
        type: 'error',
        title: 'Required Field',
        message: 'Please enter the initiative/project title',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let startDateStr: string | undefined;
      let endDateStr: string | undefined;

      if (startDate) {
        startDateStr = startDate.toISOString().split('T')[0];
      }

      if (endDate && !currentlyActive) {
        endDateStr = endDate.toISOString().split('T')[0];
      }

      const input: UpdateLeadershipSocialInput = {
        index: editingIndex,
        leadershipSocial: {
          title: title.trim(),
          organization: organization.trim(),
          ...(role.trim() && { role: role.trim() }),
          ...(description.trim() && { description: description.trim() }),
          ...(impactMetrics.trim() && { impact: impactMetrics.trim() }),
          ...(startDateStr && { startDate: startDateStr }),
          ...(endDateStr && { endDate: endDateStr }),
        }
      };

      const response = await updateLeadershipSocial(input).unwrap();

      if (response.updateLeadershipSocial?.__typename === 'SuccessType') {
        showAlert({
          type: 'success',
          title: 'Success!',
          message: 'Leadership & social impact updated successfully',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        resetForm();
        setShowEditModal(false);
        await refetchProfile();
      } else {
        throw new Error('Failed to update');
      }
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to update leadership & social impact.',
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

  // Form content component to avoid duplication
  const renderFormContent = () => (
    <>
      {/* Initiative/Project Title */}
      <FormInputGroup label="Initiative/Project Title" required>
        <TextInput
          style={glassStyles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Community Food Drive"
          placeholderTextColor="#9CA3AF"
          editable={!isSubmitting}
        />
      </FormInputGroup>

      {/* Your Role */}
      <FormInputGroup label="Your Role">
        <TextInput
          style={glassStyles.input}
          value={role}
          onChangeText={setRole}
          placeholder="e.g., Founder, Lead Organizer"
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
          placeholder="e.g., Red Cross, Local NGO"
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
          placeholder="Describe your role and the initiative's purpose..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={!isSubmitting}
        />
      </FormInputGroup>

      {/* Impact Metrics */}
      <FormInputGroup label="Impact Metrics">
        <TextInput
          style={[glassStyles.input, glassStyles.textArea]}
          value={impactMetrics}
          onChangeText={setImpactMetrics}
          placeholder="e.g., Raised $5000, Helped 200+ families..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          editable={!isSubmitting}
        />
      </FormInputGroup>
    </>
  );

  return (
    <>
      <ScrollView style={glassStyles.container} showsVerticalScrollIndicator={false}>
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
            <Text style={cardStyles.addButtonText}>Add Impact</Text>
          </View>
        </TouchableOpacity>

        {leadershipItems.length === 0 ? (
          <View style={glassStyles.emptyState}>
            <LeadershipIcon size={48} color="#D1D5DB" />
            <Text style={glassStyles.emptyStateText}>
              No leadership or social impact activities added yet
            </Text>
            <Text style={glassStyles.emptyStateSubtext}>
              Share your leadership roles, community service, and social initiatives
            </Text>
          </View>
        ) : (
          <View style={{ marginBottom: 16 }}>
            {leadershipItems.map((item, index) => (
              <View key={item.id || index} style={cardStyles.cardWrapper}>
                {/* Shadow layer */}
                <View style={cardStyles.cardShadow} />

                {/* Glass card with gradient border */}
                <View style={cardStyles.cardOuter}>
                  <View style={[cardStyles.cardInner, responsiveCardStyles.cardInner]}>
                    {/* Header Row */}
                    <View style={cardStyles.headerRow}>
                      {/* Leadership Icon Badge with glow */}
                      <View style={[cardStyles.iconBadgeOuter, responsiveCardStyles.iconBadgeOuter]}>
                        <View style={[cardStyles.iconBadge, responsiveCardStyles.iconBadge]}>
                          <LeadershipIcon size={isSmallScreen ? 18 : isMediumScreen ? 20 : 24} color="#3B82F6" />
                        </View>
                      </View>

                      <View style={cardStyles.titleContainer}>
                        <Text style={[cardStyles.itemTitle, responsiveCardStyles.itemTitle]} numberOfLines={2}>{item.title}</Text>
                        {item.role && (
                          <Text style={[cardStyles.itemRole, responsiveCardStyles.itemRole]} numberOfLines={1}>{item.role}</Text>
                        )}
                      </View>

                      <View style={[cardStyles.actionButtons, responsiveCardStyles.actionButtons]}>
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            handleEdit(item, index);
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

                    {item.organization && (
                      <View style={[cardStyles.organizationBadge, responsiveCardStyles.organizationBadge]}>
                        <Text style={[cardStyles.organizationText, responsiveCardStyles.organizationText]} numberOfLines={1}>{item.organization}</Text>
                      </View>
                    )}

                    {item.description && (
                      <Text style={[cardStyles.description, responsiveCardStyles.description]} numberOfLines={2}>{item.description}</Text>
                    )}

                    {/* Divider */}
                    <View style={cardStyles.divider} />

                    <View style={cardStyles.metaRow}>
                      <View style={[cardStyles.metaBadge, responsiveCardStyles.metaBadge]}>
                        <Text style={[cardStyles.metaText, responsiveCardStyles.metaText]}>
                          {formatDisplayDate(item.startDate) || 'Start'} - {item.endDate ? formatDisplayDate(item.endDate) : 'Present'}
                        </Text>
                      </View>
                    </View>

                    {item.impact && (
                      <View style={[cardStyles.impactBadge, responsiveCardStyles.impactBadge]}>
                        <Text style={[cardStyles.impactLabel, responsiveCardStyles.impactLabel]}>Impact:</Text>
                        <Text style={[cardStyles.impactText, responsiveCardStyles.impactText]} numberOfLines={2}>{item.impact}</Text>
                      </View>
                    )}
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
        title="Add Leadership & Impact"
        isLoading={isSubmitting}
        footerContent={
          <GlassButton
            text={isSubmitting ? '' : 'Add Impact'}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleAddLeadership();
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
        {renderFormContent()}
      </KeyboardAwareFormModal>

      {/* Edit Modal - Using KeyboardAwareFormModal */}
      <KeyboardAwareFormModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Edit Impact"
        isLoading={isSubmitting}
        footerContent={
          <GlassButton
            text={isSubmitting ? '' : 'Update Impact'}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleUpdateLeadership();
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
        {renderFormContent()}
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
  itemTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
    lineHeight: 22,
  },
  itemRole: {
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
  impactBadge: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(219, 234, 254, 0.8)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  impactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 4,
  },
  impactText: {
    fontSize: 14,
    color: '#1D4ED8',
    lineHeight: 20,
  },
});
