import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Canvas, RoundedRect, LinearGradient as SkiaLinearGradient, vec } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useSelector } from 'react-redux';
import { useAddHobbyMutation, useRemoveHobbyMutation } from '../../../../services/api';
import { useAlert } from '../../../../contexts/AlertContext';
import Svg, { Path } from 'react-native-svg';

const HobbyIcon = ({ size = 20, color = "#3B82F6" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Glass Hobby Badge Component (green themed)
const GlassHobbyBadge = ({
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

interface HobbyTabProps {
  hobbies?: string[];
  onUpdateHobbies?: (hobbies: string[]) => void;
}

export const HobbyTab: React.FC<HobbyTabProps> = ({ hobbies = [], onUpdateHobbies }) => {
  const [hobbiesList, setHobbiesList] = useState<string[]>(hobbies);
  const [newHobby, setNewHobby] = useState('');
  const [showAddHobby, setShowAddHobby] = useState(false);

  const [addHobby, { isLoading: isAdding }] = useAddHobbyMutation();
  const [removeHobby, { isLoading: isRemoving }] = useRemoveHobbyMutation();
  const { showAlert } = useAlert();
  const authToken = useSelector((state: any) => state.auth?.token);

  useEffect(() => {
    setHobbiesList(hobbies);
  }, [hobbies]);

  const handleAddHobby = async () => {
    if (!authToken) {
      showAlert({
        type: 'error',
        title: 'Session Expired',
        message: 'Please log in again to continue.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    if (!newHobby.trim()) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Please enter a hobby',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    if (hobbiesList.includes(newHobby.trim())) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'This hobby already exists',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    try {
      const result = await addHobby({ hobby: newHobby.trim() }).unwrap();

      if (result.addHobby.__typename === 'SuccessType') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const updatedHobbies = [...hobbiesList, newHobby.trim()];
        setHobbiesList(updatedHobbies);
        setNewHobby('');
        setShowAddHobby(false);
        onUpdateHobbies?.(updatedHobbies);

        showAlert({
          type: 'success',
          title: 'Success',
          message: result.addHobby.message,
          buttons: [{ text: 'OK', style: 'default' }],
        });
      } else {
        showAlert({
          type: 'error',
          title: 'Error',
          message: result.addHobby.message,
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to add hobby. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const handleDeleteHobby = async (hobbyToDelete: string) => {
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
      title: 'Delete Hobby',
      message: `Are you sure you want to remove "${hobbyToDelete}"?`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await removeHobby({ hobby: hobbyToDelete }).unwrap();

              if (result.removeHobby.__typename === 'SuccessType') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                const updatedHobbies = hobbiesList.filter(hobby => hobby !== hobbyToDelete);
                setHobbiesList(updatedHobbies);
                onUpdateHobbies?.(updatedHobbies);

                showAlert({
                  type: 'success',
                  title: 'Success',
                  message: result.removeHobby.message,
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              } else {
                showAlert({
                  type: 'error',
                  title: 'Error',
                  message: result.removeHobby.message,
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              }
            } catch (error) {
              showAlert({
                type: 'error',
                title: 'Error',
                message: 'Failed to remove hobby. Please try again.',
                buttons: [{ text: 'OK', style: 'default' }],
              });
            }
          },
        },
      ],
    });
  };

  const suggestedHobbies = [
    'Reading', 'Gaming', 'Photography', 'Hiking', 'Cooking',
    'Traveling', 'Music', 'Sports', 'Painting', 'Dancing'
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Add Button at Top */}
      <TouchableOpacity
        style={styles.addButton}
        activeOpacity={0.8}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowAddHobby(true);
        }}
      >
        <View style={styles.addButtonContent}>
          <HobbyIcon size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Hobby</Text>
        </View>
      </TouchableOpacity>

      {/* Hobbies List */}
      {hobbiesList.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Hobbies</Text>
          <View style={styles.badgesContainer}>
            {hobbiesList.map((hobby, index) => (
              <GlassHobbyBadge
                key={index}
                text={hobby}
                onDelete={() => handleDeleteHobby(hobby)}
              />
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <HobbyIcon size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No hobbies added yet</Text>
          <Text style={styles.emptyStateText}>
            Share your interests and hobbies to show your personality!
          </Text>
        </View>
      )}

      {/* Add Hobby Form */}
      {showAddHobby && (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Add New Hobby</Text>
            <TouchableOpacity
              onPress={() => {
                setNewHobby('');
                setShowAddHobby(false);
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hobby Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Reading, Photography, Hiking"
              placeholderTextColor="#9CA3AF"
              value={newHobby}
              onChangeText={setNewHobby}
              autoFocus
              editable={!isAdding}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isAdding && styles.submitButtonDisabled]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleAddHobby();
            }}
            disabled={isAdding}
          >
            {isAdding ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Add Hobby</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Suggestions */}
      {hobbiesList.length === 0 && !showAddHobby && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested Hobbies</Text>
          <View style={styles.suggestionsContainer}>
            {suggestedHobbies.map((hobby) => (
              <TouchableOpacity
                key={hobby}
                style={styles.suggestionChip}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNewHobby(hobby);
                  setShowAddHobby(true);
                }}
              >
                <Text style={styles.suggestionText}>+ {hobby}</Text>
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
    borderColor: 'rgba(59, 130, 246, 0.2)',
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
    borderColor: 'rgba(59, 130, 246, 0.3)',
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
    backgroundColor: 'rgba(220, 252, 231, 0.8)',
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
