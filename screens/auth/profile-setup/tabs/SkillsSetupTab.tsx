import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Canvas, RoundedRect, LinearGradient as SkiaLinearGradient, vec } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useSelector } from 'react-redux';
import { useAddSkillMutation, useRemoveSkillMutation } from '../../../../services/api';
import { useAlert } from '../../../../contexts/AlertContext';
import { styles } from '../../../../styles/ProfileSetupStyles';

// SCREEN_WIDTH removed - not needed for badge sizing

// Glass Badge component for skills - using React Native shadows for proper rounded effect
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
    <View style={[skillBadgeStyles.wrapper, { width: badgeWidth, height: badgeHeight }]}>
      {/* Use React Native shadow instead of Skia shadow */}
      <View
        style={[
          skillBadgeStyles.shadowContainer,
          {
            width: badgeWidth,
            height: badgeHeight,
            borderRadius: badgeHeight / 2,
          },
        ]}
      />

      <Canvas style={{ position: 'absolute', width: badgeWidth, height: badgeHeight }}>
        {/* Main badge background */}
        <RoundedRect x={0} y={0} width={badgeWidth} height={badgeHeight} r={badgeHeight / 2}>
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(badgeWidth, badgeHeight)}
            colors={['rgba(239, 246, 255, 1)', 'rgba(219, 234, 254, 1)', 'rgba(191, 219, 254, 1)']}
          />
        </RoundedRect>

        {/* Top highlight for liquid glass */}
        <RoundedRect x={2} y={2} width={badgeWidth - 4} height={badgeHeight / 2 - 2} r={badgeHeight / 2 - 2}>
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(0, badgeHeight / 2)}
            colors={['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0)']}
          />
        </RoundedRect>

        {/* Border */}
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

      {/* Content */}
      <View style={skillBadgeStyles.content}>
        <Text style={[skillBadgeStyles.text, { color: '#1E40AF' }]}>{text}</Text>

        {/* Delete button */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDelete();
          }}
          activeOpacity={0.7}
          style={[skillBadgeStyles.deleteButton, { backgroundColor: '#3B82F6' }]}
        >
          <Text style={skillBadgeStyles.deleteIcon}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const skillBadgeStyles = StyleSheet.create({
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
  },
  deleteButton: {
    width: 24,
    height: 24,
    marginLeft: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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

interface SkillsSetupTabProps {
  skills: string[];
  onUpdateSkills?: (skills: string[]) => void;
}

export const SkillsSetupTab: React.FC<SkillsSetupTabProps> = ({ skills = [], onUpdateSkills }) => {
  const [skillsList, setSkillsList] = useState<string[]>(skills);
  const [newSkill, setNewSkill] = useState('');
  const [showAddSkill, setShowAddSkill] = useState(false);

  const [addSkill, { isLoading: isAdding }] = useAddSkillMutation();
  const [removeSkill] = useRemoveSkillMutation();
  const { showAlert } = useAlert();

  // Auth check
  const authToken = useSelector((state: any) => state.auth?.token);

  useEffect(() => {
    setSkillsList(skills);
  }, [skills]);

  const handleAddSkill = async () => {
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
      console.error('Failed to add skill:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to add skill. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const handleDeleteSkill = async (skillToDelete: string) => {
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
              console.error('Failed to remove skill:', error);
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
    'UI/UX Design', 'Project Management', 'Data Analysis'
  ];

  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Skills</Text>
        <TouchableOpacity
          style={styles.glassAddButtonSmall}
          onPress={() => setShowAddSkill(true)}
        >
          <Text style={styles.glassAddButtonSmallText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Skills List */}
      {skillsList.length > 0 ? (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 12 }}>Your Skills</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
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
          <Text style={styles.emptyStateTitle}>No skills added yet</Text>
          <Text style={styles.emptyStateText}>
            Add your skills to showcase your expertise to employers.
          </Text>
        </View>
      )}

      {/* Add Skill Form */}
      {showAddSkill && (
        <View style={styles.entryCard}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryTitle}>Add New Skill</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => {
                setNewSkill('');
                setShowAddSkill(false);
              }}
            >
              <Text style={styles.removeButtonText}>Cancel</Text>
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
            />
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: '#2563EB',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              marginBottom: 8,
            }}
            onPress={handleAddSkill}
            disabled={isAdding}
          >
            <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>
              {isAdding ? 'Adding...' : 'Add Skill'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Button */}
      {!showAddSkill && (
        <TouchableOpacity
          style={styles.glassAddButton}
          onPress={() => setShowAddSkill(true)}
        >
          <Text style={styles.glassAddButtonText}>
            {skillsList.length > 0 ? '+ Add More Skills' : '+ Add Skills'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Suggestions */}
      {skillsList.length === 0 && !showAddSkill && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 12 }}>
            Suggested Skills
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {suggestedSkills.map((skill) => (
              <TouchableOpacity
                key={skill}
                style={styles.glassSuggestionChip}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNewSkill(skill);
                  setShowAddSkill(true);
                }}
              >
                <Text style={styles.glassSuggestionChipText}>+ {skill}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default SkillsSetupTab;
