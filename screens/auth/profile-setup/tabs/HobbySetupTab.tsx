import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Canvas, RoundedRect, LinearGradient as SkiaLinearGradient, vec } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useSelector } from 'react-redux';
import { useAddHobbyMutation, useRemoveHobbyMutation } from '../../../../services/api';
import { useAlert } from '../../../../contexts/AlertContext';
import { styles } from '../../../../styles/ProfileSetupStyles';

// SCREEN_WIDTH removed - not needed for badge sizing

// Glass Badge component for hobbies (green themed) - using React Native shadows for proper rounded effect
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
    <View style={[hobbyBadgeStyles.wrapper, { width: badgeWidth, height: badgeHeight }]}>
      {/* Use React Native shadow instead of Skia shadow */}
      <View
        style={[
          hobbyBadgeStyles.shadowContainer,
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
            colors={['rgba(240, 253, 244, 1)', 'rgba(220, 252, 231, 1)', 'rgba(187, 247, 208, 1)']}
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
          color="rgba(34, 197, 94, 0.4)"
        />
      </Canvas>

      {/* Content */}
      <View style={hobbyBadgeStyles.content}>
        <Text style={[hobbyBadgeStyles.text, { color: '#166534' }]}>{text}</Text>

        {/* Delete button */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDelete();
          }}
          activeOpacity={0.7}
          style={[hobbyBadgeStyles.deleteButton, { backgroundColor: '#22C55E' }]}
        >
          <Text style={hobbyBadgeStyles.deleteIcon}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const hobbyBadgeStyles = StyleSheet.create({
  wrapper: {
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 22,
  },
  shadowContainer: {
    position: 'absolute',
    backgroundColor: 'white',
    shadowColor: 'rgba(34, 197, 94, 1)',
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

interface HobbySetupTabProps {
  hobbies?: string[];
  onUpdateHobbies?: (hobbies: string[]) => void;
}

export const HobbySetupTab: React.FC<HobbySetupTabProps> = ({ hobbies = [], onUpdateHobbies }) => {
  const [hobbiesList, setHobbiesList] = useState<string[]>(hobbies);
  const [newHobby, setNewHobby] = useState('');
  const [showAddHobby, setShowAddHobby] = useState(false);

  const [addHobby, { isLoading: isAdding }] = useAddHobbyMutation();
  const [removeHobby] = useRemoveHobbyMutation();
  const { showAlert } = useAlert();

  // Auth check
  const authToken = useSelector((state: any) => state.auth?.token);

  useEffect(() => {
    setHobbiesList(hobbies);
  }, [hobbies]);

  const handleAddHobby = async () => {
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
      console.error('Failed to add hobby:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to add hobby. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const handleDeleteHobby = async (hobbyToDelete: string) => {
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
              console.error('Failed to remove hobby:', error);
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
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Hobbies & Interests</Text>
        <TouchableOpacity
          style={styles.glassAddButtonSmall}
          onPress={() => setShowAddHobby(true)}
        >
          <Text style={styles.glassAddButtonSmallText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Hobbies List */}
      {hobbiesList.length > 0 ? (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 12 }}>Your Hobbies</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
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
          <Text style={styles.emptyStateTitle}>No hobbies added yet</Text>
          <Text style={styles.emptyStateText}>
            Share your interests and hobbies to show your personality!
          </Text>
        </View>
      )}

      {/* Add Hobby Form */}
      {showAddHobby && (
        <View style={styles.entryCard}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryTitle}>Add New Hobby</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => {
                setNewHobby('');
                setShowAddHobby(false);
              }}
            >
              <Text style={styles.removeButtonText}>Cancel</Text>
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
            />
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: '#16A34A',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              marginBottom: 8,
            }}
            onPress={handleAddHobby}
            disabled={isAdding}
          >
            <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>
              {isAdding ? 'Adding...' : 'Add Hobby'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Button */}
      {!showAddHobby && (
        <TouchableOpacity
          style={styles.glassAddButton}
          onPress={() => setShowAddHobby(true)}
        >
          <Text style={styles.glassAddButtonText}>
            {hobbiesList.length > 0 ? '+ Add More Hobbies' : '+ Add Hobbies'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Suggestions */}
      {hobbiesList.length === 0 && !showAddHobby && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 12 }}>
            Suggested Hobbies
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {suggestedHobbies.map((hobby) => (
              <TouchableOpacity
                key={hobby}
                style={[styles.glassSuggestionChip, { backgroundColor: 'rgba(220, 252, 231, 0.8)', borderColor: 'rgba(34, 197, 94, 0.2)' }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNewHobby(hobby);
                  setShowAddHobby(true);
                }}
              >
                <Text style={[styles.glassSuggestionChipText, { color: '#166534' }]}>+ {hobby}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default HobbySetupTab;
