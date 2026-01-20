import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import { Canvas, RoundedRect, LinearGradient as SkiaLinearGradient, vec, Shadow } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { GlassDatePicker, DatePickerTrigger } from '../../../../components/ui/GlassDatePicker';
import { styles } from '../../../../styles/ProfileSetupStyles';

const SCREEN_WIDTH = Dimensions.get('window').width;

export interface ExperienceEntry {
  position: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  description?: string;
  current: boolean;
}

interface ExperienceSetupTabProps {
  experienceEntries: ExperienceEntry[];
  setExperienceEntries: React.Dispatch<React.SetStateAction<ExperienceEntry[]>>;
  initialExperienceCount: number;
  editingExperienceIndex: number | null;
  renderKey: number;
  onEditExperience: (index: number) => void;
  onSaveExperienceEdit: (index: number) => void;
  onCancelExperienceEdit: () => void;
  onDeleteExperience: (index: number) => void;
  onRemoveNewExperience: (index: number) => void;
  onAddExperience: () => void;
}

export const ExperienceSetupTab: React.FC<ExperienceSetupTabProps> = ({
  experienceEntries,
  setExperienceEntries,
  initialExperienceCount,
  editingExperienceIndex,
  renderKey,
  onEditExperience,
  onSaveExperienceEdit,
  onCancelExperienceEdit,
  onDeleteExperience,
  onRemoveNewExperience,
  onAddExperience,
}) => {
  const handleExperienceChange = (index: number, field: keyof ExperienceEntry, value: string | boolean) => {
    setExperienceEntries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // If marking as current, clear end date
      if (field === 'current' && value === true) {
        updated[index].endDate = '';
      }
      return updated;
    });
  };

  const handleDateSelect = (index: number, field: 'startDate' | 'endDate', date: Date) => {
    const formattedDate = date.toLocaleDateString('en-US');
    handleExperienceChange(index, field, formattedDate);
  };

  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Work Experience</Text>
        <TouchableOpacity style={styles.glassAddButtonSmall} onPress={onAddExperience}>
          <Text style={styles.glassAddButtonSmallText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Empty State */}
      {experienceEntries.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No experience added yet</Text>
          <Text style={styles.emptyStateText}>
            Add your work history to showcase your professional background.
          </Text>
        </View>
      )}

      {experienceEntries.map((entry, index) => {
        const isExisting = index < initialExperienceCount;
        const isEditing = editingExperienceIndex === index;

        // Render collapsed glass summary for existing entries (unless editing)
        if (isExisting && !isEditing) {
          return (
            <View key={`exp-${index}-${renderKey}`} style={styles.glassCardWrapper}>
              {/* Skia Glass Background */}
              <Canvas style={styles.glassCanvasLarge}>
                <RoundedRect x={0} y={0} width={SCREEN_WIDTH - 40} height={120} r={16}>
                  <SkiaLinearGradient
                    start={vec(0, 0)}
                    end={vec(SCREEN_WIDTH - 40, 120)}
                    colors={['rgba(255, 255, 255, 0.95)', 'rgba(241, 245, 249, 0.9)', 'rgba(255, 255, 255, 0.85)']}
                  />
                  <Shadow dx={0} dy={4} blur={12} color="rgba(37, 99, 235, 0.15)" />
                </RoundedRect>
                {/* Top highlight for liquid glass effect */}
                <RoundedRect x={1} y={1} width={SCREEN_WIDTH - 42} height={40} r={15}>
                  <SkiaLinearGradient
                    start={vec(0, 0)}
                    end={vec(0, 40)}
                    colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
                  />
                </RoundedRect>
              </Canvas>
              {/* Content overlay */}
              <View style={styles.glassCardContentLarge}>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryTitle}>{entry.position || 'Position'}</Text>
                  <Text style={styles.summarySubtitle}>{entry.company || 'Company'}</Text>
                  <Text style={styles.summaryMeta}>
                    {entry.location && `${entry.location} • `}
                    {entry.startDate} - {entry.current ? 'Present' : entry.endDate}
                  </Text>
                  {entry.description && (
                    <Text style={styles.summaryDescription} numberOfLines={2}>
                      {entry.description}
                    </Text>
                  )}
                </View>
                <View style={styles.summaryActions}>
                  <TouchableOpacity
                    style={styles.summaryActionButton}
                    onPress={() => onEditExperience(index)}
                  >
                    <Text style={styles.summaryActionEdit}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.summaryActionButton}
                    onPress={() => onDeleteExperience(index)}
                  >
                    <Text style={styles.summaryActionDelete}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }

        // Render full editable form for new entries OR when editing existing
        return (
          <View key={`exp-form-${index}`} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryTitle}>
                {isExisting ? 'Edit Experience' : `Experience ${index + 1}`}
              </Text>
              {isExisting && isEditing ? (
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.cancelEditButton}
                    onPress={onCancelExperienceEdit}
                  >
                    <Text style={styles.cancelEditText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveEditButton}
                    onPress={() => onSaveExperienceEdit(index)}
                  >
                    <Text style={styles.saveEditText}>Save</Text>
                  </TouchableOpacity>
                </View>
              ) : !isExisting ? (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => onRemoveNewExperience(index)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Job Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Senior Software Engineer"
                placeholderTextColor="#9CA3AF"
                value={entry.position}
                onChangeText={(value) => handleExperienceChange(index, 'position', value)}
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Company</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Google"
                placeholderTextColor="#9CA3AF"
                value={entry.company}
                onChangeText={(value) => handleExperienceChange(index, 'company', value)}
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. San Francisco, CA"
                placeholderTextColor="#9CA3AF"
                value={entry.location || ''}
                onChangeText={(value) => handleExperienceChange(index, 'location', value)}
                maxLength={100}
              />
            </View>

            {/* Current job checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => handleExperienceChange(index, 'current', !entry.current)}
            >
              <View style={[styles.checkbox, entry.current && styles.checkboxChecked]}>
                {entry.current && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>I currently work here</Text>
            </TouchableOpacity>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Start Date</Text>
                <GlassDatePicker
                  onDateSelect={(date) => handleDateSelect(index, 'startDate', date)}
                  initialDate={entry.startDate ? new Date(entry.startDate) : undefined}
                  maxDate={new Date()}
                >
                  <DatePickerTrigger
                    value={entry.startDate}
                    placeholder="Select start date"
                  />
                </GlassDatePicker>
              </View>
              {!entry.current && (
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>End Date</Text>
                  <GlassDatePicker
                    onDateSelect={(date) => handleDateSelect(index, 'endDate', date)}
                    initialDate={entry.endDate ? new Date(entry.endDate) : undefined}
                    minDate={entry.startDate ? new Date(entry.startDate) : undefined}
                  >
                    <DatePickerTrigger
                      value={entry.endDate}
                      placeholder="Select end date"
                    />
                  </GlassDatePicker>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Describe your responsibilities and achievements..."
                placeholderTextColor="#9CA3AF"
                value={entry.description || ''}
                onChangeText={(value) => handleExperienceChange(index, 'description', value)}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>
          </View>
        );
      })}

      {/* Add Button when there are entries but want to add more */}
      {experienceEntries.length > 0 && experienceEntries.length < 10 && (
        <TouchableOpacity style={styles.glassAddButton} onPress={onAddExperience}>
          <Text style={styles.glassAddButtonText}>+ Add Another Experience</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
