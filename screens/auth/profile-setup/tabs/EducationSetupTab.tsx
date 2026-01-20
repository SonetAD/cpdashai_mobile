import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import { Canvas, RoundedRect, LinearGradient as SkiaLinearGradient, vec, Shadow } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { GlassDatePicker, DatePickerTrigger } from '../../../../components/ui/GlassDatePicker';
import { styles } from '../../../../styles/ProfileSetupStyles';

const SCREEN_WIDTH = Dimensions.get('window').width;

export interface EducationEntry {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  grade?: string;
}

interface EducationSetupTabProps {
  educationEntries: EducationEntry[];
  setEducationEntries: React.Dispatch<React.SetStateAction<EducationEntry[]>>;
  initialEducationCount: number;
  editingEducationIndex: number | null;
  renderKey: number;
  onEditEducation: (index: number) => void;
  onSaveEducationEdit: (index: number) => void;
  onCancelEducationEdit: () => void;
  onDeleteEducation: (index: number) => void;
  onRemoveNewEducation: (index: number) => void;
  onAddEducation: () => void;
}

export const EducationSetupTab: React.FC<EducationSetupTabProps> = ({
  educationEntries,
  setEducationEntries,
  initialEducationCount,
  editingEducationIndex,
  renderKey,
  onEditEducation,
  onSaveEducationEdit,
  onCancelEducationEdit,
  onDeleteEducation,
  onRemoveNewEducation,
  onAddEducation,
}) => {
  const handleEducationChange = (index: number, field: keyof EducationEntry, value: string) => {
    setEducationEntries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDateSelect = (index: number, field: 'startDate' | 'endDate', date: Date) => {
    const formattedDate = date.toLocaleDateString('en-US');
    handleEducationChange(index, field, formattedDate);
  };

  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Education</Text>
        <TouchableOpacity style={styles.glassAddButtonSmall} onPress={onAddEducation}>
          <Text style={styles.glassAddButtonSmallText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Empty State */}
      {educationEntries.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No education added yet</Text>
          <Text style={styles.emptyStateText}>
            Add your educational background to help employers understand your qualifications.
          </Text>
        </View>
      )}

      {educationEntries.map((entry, index) => {
        const isExisting = index < initialEducationCount;
        const isEditing = editingEducationIndex === index;

        // Render collapsed glass summary for existing entries (unless editing)
        if (isExisting && !isEditing) {
          return (
            <View key={`edu-${index}-${renderKey}`} style={styles.glassCardWrapper}>
              {/* Skia Glass Background */}
              <Canvas style={styles.glassCanvas}>
                <RoundedRect x={0} y={0} width={SCREEN_WIDTH - 40} height={100} r={16}>
                  <SkiaLinearGradient
                    start={vec(0, 0)}
                    end={vec(SCREEN_WIDTH - 40, 100)}
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
              <View style={styles.glassCardContent}>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryTitle}>{entry.degree || 'Degree'}</Text>
                  <Text style={styles.summarySubtitle}>{entry.institution || 'Institution'}</Text>
                  <Text style={styles.summaryMeta}>
                    {entry.fieldOfStudy && `${entry.fieldOfStudy} • `}
                    {entry.startDate} - {entry.endDate}
                    {entry.grade && ` • Grade: ${entry.grade}`}
                  </Text>
                </View>
                <View style={styles.summaryActions}>
                  <TouchableOpacity
                    style={styles.summaryActionButton}
                    onPress={() => onEditEducation(index)}
                  >
                    <Text style={styles.summaryActionEdit}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.summaryActionButton}
                    onPress={() => onDeleteEducation(index)}
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
          <View key={`edu-form-${index}`} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryTitle}>
                {isExisting ? 'Edit Education' : `Education ${index + 1}`}
              </Text>
              {isExisting && isEditing ? (
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.cancelEditButton}
                    onPress={onCancelEducationEdit}
                  >
                    <Text style={styles.cancelEditText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveEditButton}
                    onPress={() => onSaveEducationEdit(index)}
                  >
                    <Text style={styles.saveEditText}>Save</Text>
                  </TouchableOpacity>
                </View>
              ) : !isExisting ? (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => onRemoveNewEducation(index)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Institution</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Stanford University"
                placeholderTextColor="#9CA3AF"
                value={entry.institution}
                onChangeText={(value) => handleEducationChange(index, 'institution', value)}
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Degree</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Bachelor of Science"
                placeholderTextColor="#9CA3AF"
                value={entry.degree}
                onChangeText={(value) => handleEducationChange(index, 'degree', value)}
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Field of Study</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Computer Science"
                placeholderTextColor="#9CA3AF"
                value={entry.fieldOfStudy}
                onChangeText={(value) => handleEducationChange(index, 'fieldOfStudy', value)}
                maxLength={100}
              />
            </View>

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
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Grade/GPA (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 3.8 or First Class Honours"
                placeholderTextColor="#9CA3AF"
                value={entry.grade || ''}
                onChangeText={(value) => handleEducationChange(index, 'grade', value)}
                maxLength={20}
              />
            </View>
          </View>
        );
      })}

      {/* Add Button when there are entries but want to add more */}
      {educationEntries.length > 0 && educationEntries.length < 5 && (
        <TouchableOpacity style={styles.glassAddButton} onPress={onAddEducation}>
          <Text style={styles.glassAddButtonText}>+ Add Another Education</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
