import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { EditIcon, DeleteIcon } from './Icons';

interface ProfileFieldDisplayProps {
  label: string;
  value: string;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export const ProfileFieldDisplay: React.FC<ProfileFieldDisplayProps> = ({
  label,
  value,
  onEdit,
  onDelete,
  showActions = false,
}) => {
  return (
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-gray-600 text-sm">{label}</Text>
        {showActions && (
          <View className="flex-row gap-3">
            {onEdit && (
              <TouchableOpacity onPress={onEdit} activeOpacity={0.7}>
                <EditIcon />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={onDelete} activeOpacity={0.7}>
                <DeleteIcon />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        <Text className="text-gray-700 text-sm">{value || 'Not provided'}</Text>
      </View>
    </View>
  );
};
