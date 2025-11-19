import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { ProfileFieldDisplay } from '../../../../components/profile/ProfileFieldDisplay';
import { User } from '../../../../services/api';

interface PersonalInfoTabProps {
  user: User | null;
  getFullName: () => string;
}

export const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ user, getFullName }) => {
  return (
    <View>
      <ProfileFieldDisplay
        label="Full Name"
        value={getFullName()}
      />
      <ProfileFieldDisplay
        label="E-mail"
        value={user?.email || ''}
      />
      <ProfileFieldDisplay
        label="Phone Number (Optional)"
        value={user?.phoneNumber || ''}
      />
      <ProfileFieldDisplay
        label="Current Company Role"
        value="Not provided"
        showActions
        onEdit={() => console.log('Edit role')}
      />

      {/* Update Button */}
      <TouchableOpacity
        className="bg-primary-blue rounded-xl py-4 mt-2 items-center"
        activeOpacity={0.8}
      >
        <Text className="text-white text-base font-semibold">Update</Text>
      </TouchableOpacity>
    </View>
  );
};
