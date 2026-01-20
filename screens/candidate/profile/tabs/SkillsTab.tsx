import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Canvas, RoundedRect, LinearGradient as SkiaLinearGradient, vec } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useSelector } from 'react-redux';
import { useAddSkillMutation, useRemoveSkillMutation } from '../../../../services/api';
import { useAlert } from '../../../../contexts/AlertContext';
import Svg, { Path } from 'react-native-svg';

const SkillIcon = ({ size = 20, color = "#3B82F6" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Glass Skill Badge Component
const GlassSkillBadge = ({
  text,
  onDelete,
}: {
  text: string;
  onDelete: () => void;
}) => {
  const badgeHeight = 44;
  const badgeWidth = Math.max(text.length * 10 + 70, 100);

  return (
    <View style={[badgeStyles.wrapper, { width: badgeWidth, height: badgeHeight }]}>
      <View
        style={[
          badgeStyles.shadowContainer,
          { width: badgeWidth, height: badgeHeight, borderRadius: badgeHeight / 2 },
        ]}
      />

      <Canvas style={{ position: 'absolute', width: badgeWidth, height: badgeHeight }}>
        <RoundedRect x={0} y={0} width={badgeWidth} height={badgeHeight} r={badgeHeight / 2}>
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(badgeWidth, badgeHeight)}
            colors={['rgba(219, 234, 254, 1)', 'rgba(191, 219, 254, 1)', 'rgba(147, 197, 253, 1)']}
          />
        </RoundedRect>
        <RoundedRect x={2} y={2} width={badgeWidth - 4} height={badgeHeight / 2 - 2} r={badgeHeight / 2 - 2}>
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(0, badgeHeight / 2)}
            colors={['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0)']}
          />
        </RoundedRect>
        <RoundedRect
          x={0.5}
          y={0.5}
          width={badgeWidth - 1}
          height={badgeHeight - 1}
          r={(badgeHeight - 1) / 2}
          style="stroke"
          strokeWidth={1}
          color="rgba(59, 130, 246, 0.4)"
        />
      </Canvas>

      <View style={badgeStyles.content}>
        <Text style={badgeStyles.text}>{text}</Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDelete();
          }}
          activeOpacity={0.7}
          style={badgeStyles.deleteButton}
        >
          <Text style={badgeStyles.deleteIcon}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const badgeStyles = StyleSheet.create({
  wrapper: {
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 22,
  },
  shadowContainer: {
    position: 'absolute',
    backgroundColor: 'white',
    shadowColor: 'rgba(59, 130, 246, 1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 10,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    color: '#1E40AF',
  },
  deleteButton: {
    width: 24,
    height: 24,
    marginLeft: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  deleteIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: -1,
  },
});

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
  const { showAlert } = useAlert();
  const authToken = useSelector((state: any) => state.auth?.token);

  useEffect(() => {
    setSkillsList(skills);
  }, [skills]);

  const handleAddSkill = async () => {
    if (!authToken) {
      showAlert({
        type: 'error',
        title: 'Session Expired',
        message: 'Please log in again to continue.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    if (!newSkill.trim()) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Please enter a skill',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    if (skillsList.includes(newSkill.trim())) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'This skill already exists',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    try {
      const result = await addSkill({ skill: newSkill.trim() }).unwrap();

      if (result.addSkill.__typename === 'SuccessType') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const updatedSkills = [...skillsList, newSkill.trim()];
        setSkillsList(updatedSkills);
        setNewSkill('');
        setShowAddSkill(false);
        onUpdateSkills?.(updatedSkills);

        showAlert({
          type: 'success',
          title: 'Success',
          message: result.addSkill.message,
          buttons: [{ text: 'OK', style: 'default' }],
        });
      } else {
        showAlert({
          type: 'error',
          title: 'Error',
          message: result.addSkill.message,
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to add skill. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const handleDeleteSkill = async (skillToDelete: string) => {
    if (!authToken) {
      showAlert({
        type: 'error',
        title: 'Session Expired',
        message: 'Please log in again to continue.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    showAlert({
      type: 'warning',
      title: 'Delete Skill',
      message: `Are you sure you want to remove "${skillToDelete}"?`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await removeSkill({ skill: skillToDelete }).unwrap();

              if (result.removeSkill.__typename === 'SuccessType') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                const updatedSkills = skillsList.filter(skill => skill !== skillToDelete);
                setSkillsList(updatedSkills);
                onUpdateSkills?.(updatedSkills);

                showAlert({
                  type: 'success',
                  title: 'Success',
                  message: result.removeSkill.message,
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              } else {
                showAlert({
                  type: 'error',
                  title: 'Error',
                  message: result.removeSkill.message,
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              }
            } catch (error) {
              showAlert({
                type: 'error',
                title: 'Error',
                message: 'Failed to remove skill. Please try again.',
                buttons: [{ text: 'OK', style: 'default' }],
              });
            }
          },
        },
      ],
    });
  };

  const suggestedSkills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript',
    'UI/UX Design', 'Project Management', 'Communication', 'Data Analysis', 'Problem Solving'
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Add Button at Top */}
      <TouchableOpacity
        style={styles.addButton}
        activeOpacity={0.8}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowAddSkill(true);
        }}
      >
        <View style={styles.addButtonContent}>
          <SkillIcon size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Skill</Text>
        </View>
      </TouchableOpacity>

      {/* Skills List */}
      {skillsList.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Skills</Text>
          <View style={styles.badgesContainer}>
            {skillsList.map((skill, index) => (
              <GlassSkillBadge
                key={index}
                text={skill}
                onDelete={() => handleDeleteSkill(skill)}
              />
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <SkillIcon size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No skills added yet</Text>
          <Text style={styles.emptyStateText}>
            Add your skills to showcase your expertise
          </Text>
        </View>
      )}

      {/* Add Skill Form */}
      {showAddSkill && (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Add New Skill</Text>
            <TouchableOpacity
              onPress={() => {
                setNewSkill('');
                setShowAddSkill(false);
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Skill Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., React, Python, UI/UX Design"
              placeholderTextColor="#9CA3AF"
              value={newSkill}
              onChangeText={setNewSkill}
              autoFocus
              editable={!isAdding}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isAdding && styles.submitButtonDisabled]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleAddSkill();
            }}
            disabled={isAdding}
          >
            {isAdding ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Add Skill</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Suggestions */}
      {skillsList.length === 0 && !showAddSkill && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested Skills</Text>
          <View style={styles.suggestionsContainer}>
            {suggestedSkills.map((skill) => (
              <TouchableOpacity
                key={skill}
                style={styles.suggestionChip}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNewSkill(skill);
                  setShowAddSkill(true);
                }}
              >
                <Text style={styles.suggestionText}>+ {skill}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  cancelText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
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
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: 'rgba(219, 234, 254, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  suggestionText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
});
