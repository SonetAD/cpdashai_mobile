import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { styles } from '../../../../styles/ProfileSetupStyles';

interface PersonalData {
  fullName: string;
  phone: string;
  jobTitle: string;
  workplace: string;
}

interface PersonalInfoSetupTabProps {
  personalData: PersonalData;
  onPersonalChange: (field: keyof PersonalData, value: string) => void;
  hasInitialPhone: boolean;
}

export const PersonalInfoSetupTab: React.FC<PersonalInfoSetupTabProps> = ({
  personalData,
  onPersonalChange,
  hasInitialPhone,
}) => {
  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Personal Info</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>What's your full name?</Text>
        <TextInput
          style={styles.input}
          placeholder="John Doe"
          placeholderTextColor="#9CA3AF"
          value={personalData.fullName}
          onChangeText={(value) => onPersonalChange('fullName', value)}
          maxLength={50}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>What's your phone number?</Text>
        <TextInput
          style={[styles.input, hasInitialPhone && styles.inputDisabled]}
          placeholder="1234567890"
          placeholderTextColor="#9CA3AF"
          value={personalData.phone}
          onChangeText={(value) => {
            // Only allow digits and + sign
            const filtered = value.replace(/[^0-9+]/g, '');
            onPersonalChange('phone', filtered);
          }}
          keyboardType="phone-pad"
          maxLength={20}
          editable={!hasInitialPhone}
          selectTextOnFocus={!hasInitialPhone}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>What do you do for a living?</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. UX Designer"
          placeholderTextColor="#9CA3AF"
          value={personalData.jobTitle}
          onChangeText={(value) => onPersonalChange('jobTitle', value)}
          maxLength={100}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Where are you working now?</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Google, Freelance"
          placeholderTextColor="#9CA3AF"
          value={personalData.workplace}
          onChangeText={(value) => onPersonalChange('workplace', value)}
          maxLength={100}
        />
      </View>
    </View>
  );
};
