import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Dimensions, StyleSheet, ActivityIndicator, TextInput, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSelector } from 'react-redux';
import {
  useGetCandidateProfileQuery,
  useAddPreferredLocationsMutation,
  useDeletePreferredLocationsMutation,
  WorkType,
  EmploymentType,
} from '../../../../services/api';
import { useAlert } from '../../../../contexts/AlertContext';
import Svg, { Path } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;

// CountriesNow API endpoints
const COUNTRIES_API = 'https://countriesnow.space/api/v0.1/countries';
const CITIES_API = 'https://countriesnow.space/api/v0.1/countries/cities';

const WORK_TYPES: { label: string; value: WorkType }[] = [
  { label: 'Remote', value: 'REMOTE' },
  { label: 'Hybrid', value: 'HYBRID' },
  { label: 'On-site', value: 'ONSITE' },
];

const EMPLOYMENT_TYPES: { label: string; value: EmploymentType }[] = [
  { label: 'Full Time', value: 'FULL_TIME' },
  { label: 'Part Time', value: 'PART_TIME' },
  { label: 'Contract', value: 'CONTRACT' },
  { label: 'Internship', value: 'INTERNSHIP' },
  { label: 'Freelance', value: 'FREELANCE' },
];

const LocationIcon = ({ size = 20, color = "#3B82F6" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21c-4.97-4.97-7-7.97-7-11a7 7 0 1114 0c0 3.03-2.03 6.03-7 11z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 13a3 3 0 100-6 3 3 0 000 6z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronDownIcon = ({ color = "#64748B" }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Location Card Component
const LocationCard = ({
  location,
  onDelete,
}: {
  location: {
    id?: string;
    city: string;
    country: string;
    workTypes: string[];
    employmentType: string;
  };
  onDelete: () => void;
}) => {
  const getWorkTypeLabel = (type: string) => {
    const found = WORK_TYPES.find(w => w.value === type);
    return found?.label || type;
  };

  const getEmploymentTypeLabel = (type: string) => {
    const found = EMPLOYMENT_TYPES.find(e => e.value === type);
    return found?.label || type;
  };

  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.header}>
        <View style={cardStyles.locationInfo}>
          <LocationIcon size={18} color="#3B82F6" />
          <Text style={cardStyles.locationText}>{location.city}, {location.country}</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDelete();
          }}
          style={cardStyles.deleteButton}
        >
          <Text style={cardStyles.deleteIcon}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={cardStyles.tagsContainer}>
        {location.workTypes.map((type, idx) => (
          <View key={idx} style={cardStyles.workTypeTag}>
            <Text style={cardStyles.workTypeText}>{getWorkTypeLabel(type)}</Text>
          </View>
        ))}
        <View style={cardStyles.employmentTag}>
          <Text style={cardStyles.employmentText}>{getEmploymentTypeLabel(location.employmentType)}</Text>
        </View>
      </View>
    </View>
  );
};

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
  deleteButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  workTypeTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  workTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  employmentTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  employmentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
});

// Search Icon Component
const SearchIcon = ({ color = "#94A3B8" }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Loading Skeleton Component for dropdown options
const LoadingSkeleton = ({ count = 5 }: { count?: number }) => {
  const pulseAnim = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={skeletonStyles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            skeletonStyles.item,
            { opacity: pulseAnim },
            index % 3 === 0 && { width: '85%' },
            index % 3 === 1 && { width: '70%' },
            index % 3 === 2 && { width: '90%' },
          ]}
        />
      ))}
    </View>
  );
};

const skeletonStyles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  item: {
    height: 44,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    marginBottom: 8,
    width: '100%',
  },
});

// Dropdown Component
const Dropdown = ({
  label,
  value,
  placeholder,
  options,
  onSelect,
  disabled,
  loading,
  searchPlaceholder,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onSelect: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  searchPlaceholder?: string;
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase().trim();
    return options.filter(option => option.toLowerCase().includes(query));
  }, [options, searchQuery]);

  // Reset search when modal closes
  const handleCloseModal = () => {
    setShowModal(false);
    setSearchQuery('');
  };

  return (
    <View style={dropdownStyles.container}>
      <Text style={dropdownStyles.label}>{label}</Text>
      <TouchableOpacity
        style={[dropdownStyles.button, disabled && dropdownStyles.buttonDisabled]}
        onPress={() => {
          if (!disabled && !loading) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowModal(true);
          }
        }}
        disabled={disabled || loading}
      >
        <Text style={[dropdownStyles.buttonText, !value && dropdownStyles.placeholderText]}>
          {value || placeholder}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color="#64748B" />
        ) : (
          <ChevronDownIcon color={disabled ? '#CBD5E1' : '#64748B'} />
        )}
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="fade">
        <TouchableOpacity
          style={dropdownStyles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseModal}
        >
          <View style={dropdownStyles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={dropdownStyles.modalTitle}>{label.replace(' *', '')}</Text>

            {/* Search Input */}
            <View style={dropdownStyles.searchContainer}>
              <SearchIcon color="#94A3B8" />
              <TextInput
                style={dropdownStyles.searchInput}
                placeholder={searchPlaceholder || `Search ${label.replace(' *', '').toLowerCase()}...`}
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={dropdownStyles.clearButton}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <View style={dropdownStyles.loadingContainer}>
                <ActivityIndicator size="small" color="#3B82F6" style={{ marginBottom: 12 }} />
                <Text style={dropdownStyles.loadingText}>Loading {label.replace(' *', '').toLowerCase()}...</Text>
                <LoadingSkeleton count={5} />
              </View>
            ) : options.length === 0 ? (
              <View style={dropdownStyles.emptyState}>
                <Text style={dropdownStyles.emptyText}>No options available</Text>
              </View>
            ) : filteredOptions.length === 0 ? (
              <View style={dropdownStyles.emptyState}>
                <Text style={dropdownStyles.emptyText}>No results for "{searchQuery}"</Text>
              </View>
            ) : (
              <ScrollView style={dropdownStyles.optionsList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {filteredOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[dropdownStyles.option, value === option && dropdownStyles.optionSelected]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      onSelect(option);
                      handleCloseModal();
                    }}
                  >
                    <Text style={[dropdownStyles.optionText, value === option && dropdownStyles.optionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const dropdownStyles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  buttonDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  buttonText: {
    fontSize: 15,
    color: '#1E293B',
  },
  placeholderText: {
    color: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    width: '100%',
    maxHeight: '70%',
    padding: 18,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 14,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    marginLeft: 8,
    paddingVertical: 0,
  },
  clearButton: {
    fontSize: 14,
    color: '#94A3B8',
    paddingHorizontal: 4,
  },
  optionsList: {
    maxHeight: 400,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 4,
  },
  optionSelected: {
    backgroundColor: '#EFF6FF',
  },
  optionText: {
    fontSize: 15,
    color: '#334155',
  },
  optionTextSelected: {
    color: '#2563EB',
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
  },
  loadingContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    fontWeight: '500',
  },
});

// Work Type Icons
const WorkTypeIcon = ({ type, color }: { type: WorkType; color: string }) => {
  if (type === 'REMOTE') {
    return (
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (type === 'HYBRID') {
    return (
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

// Multi-Select Work Type Component
const WorkTypeSelector = ({
  selected,
  onToggle,
}: {
  selected: WorkType[];
  onToggle: (type: WorkType) => void;
}) => {
  return (
    <View style={workTypeStyles.container}>
      <Text style={workTypeStyles.label}>Work Types <Text style={workTypeStyles.hint}>(Select one or more)</Text></Text>
      <View style={workTypeStyles.options}>
        {WORK_TYPES.map((type) => {
          const isSelected = selected.includes(type.value);
          return (
            <TouchableOpacity
              key={type.value}
              style={[workTypeStyles.option, isSelected && workTypeStyles.optionSelected]}
              onPress={() => {
                Haptics.selectionAsync();
                onToggle(type.value);
              }}
            >
              <WorkTypeIcon type={type.value} color={isSelected ? '#2563EB' : '#64748B'} />
              <Text style={[workTypeStyles.optionText, isSelected && workTypeStyles.optionTextSelected]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const workTypeStyles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  hint: {
    fontSize: 11,
    fontWeight: '400',
    color: '#94A3B8',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 90,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  optionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  optionTextSelected: {
    color: '#2563EB',
    fontWeight: '600',
  },
});

// Employment Type Selector
const EmploymentTypeSelector = ({
  selected,
  onSelect,
}: {
  selected: EmploymentType | '';
  onSelect: (type: EmploymentType) => void;
}) => {
  return (
    <View style={employmentStyles.container}>
      <Text style={employmentStyles.label}>Employment Type</Text>
      <View style={employmentStyles.options}>
        {EMPLOYMENT_TYPES.map((type) => {
          const isSelected = selected === type.value;
          return (
            <TouchableOpacity
              key={type.value}
              style={[employmentStyles.option, isSelected && employmentStyles.optionSelected]}
              onPress={() => {
                Haptics.selectionAsync();
                onSelect(type.value);
              }}
            >
              <Text style={[employmentStyles.optionText, isSelected && employmentStyles.optionTextSelected]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const employmentStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  optionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  optionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  optionTextSelected: {
    color: '#059669',
    fontWeight: '600',
  },
});

export const LocationSetupTab: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<WorkType[]>([]);
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<EmploymentType | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Countries and Cities state
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const { data: profileData, refetch: refetchProfile } = useGetCandidateProfileQuery();
  const [addPreferredLocations] = useAddPreferredLocationsMutation();
  const [deletePreferredLocations] = useDeletePreferredLocationsMutation();
  const { showAlert } = useAlert();
  const authToken = useSelector((state: any) => state.auth?.token);

  const candidateProfile = profileData?.myProfile?.__typename === 'CandidateType' ? profileData.myProfile : null;
  const locations = candidateProfile?.preferredLocations || [];

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      try {
        const response = await fetch(COUNTRIES_API);
        const data = await response.json();
        if (data.error === false && data.data) {
          const countryNames = data.data.map((item: { country: string }) => item.country).sort();
          setCountries(countryNames);
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
        // Fallback to some common countries if API fails
        setCountries(['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'India', 'Singapore', 'United Arab Emirates']);
      } finally {
        setLoadingCountries(false);
      }
    };
    fetchCountries();
  }, []);

  // Fetch cities when country changes
  const fetchCities = useCallback(async (country: string) => {
    if (!country) {
      setCities([]);
      return;
    }
    setLoadingCities(true);
    setCities([]);
    try {
      const response = await fetch(CITIES_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ country }),
      });
      const data = await response.json();
      if (data.error === false && data.data) {
        setCities(data.data.sort());
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  }, []);

  const resetForm = () => {
    setSelectedCountry('');
    setSelectedCity('');
    setSelectedWorkTypes([]);
    setSelectedEmploymentType('');
    setShowAddForm(false);
  };

  const handleToggleWorkType = (type: WorkType) => {
    setSelectedWorkTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleAddLocation = async () => {
    if (!authToken) {
      showAlert({
        type: 'error',
        title: 'Session Expired',
        message: 'Please log in again to continue.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    // Validation
    const missingFields: string[] = [];
    if (!selectedCountry) missingFields.push('Country');
    if (!selectedCity) missingFields.push('City');
    if (selectedWorkTypes.length === 0) missingFields.push('Work Type');
    if (!selectedEmploymentType) missingFields.push('Employment Type');

    if (missingFields.length > 0) {
      showAlert({
        type: 'error',
        title: 'Required Fields Missing',
        message: `Please select: ${missingFields.join(', ')}`,
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await addPreferredLocations({
        locations: [{
          city: selectedCity,
          country: selectedCountry,
          workTypes: selectedWorkTypes,
          employmentType: selectedEmploymentType as EmploymentType,
        }],
      }).unwrap();

      if (response.addPreferredLocations?.__typename === 'SuccessType') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert({
          type: 'success',
          title: 'Success!',
          message: 'Location added successfully',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        resetForm();
        await refetchProfile();
      } else {
        throw new Error(response.addPreferredLocations?.message || 'Failed to add location');
      }
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to add location',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLocation = async (locationId: string, locationName: string) => {
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
      title: 'Delete Location',
      message: `Are you sure you want to remove "${locationName}"?`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deletePreferredLocations({
                locationIds: [locationId],
              }).unwrap();

              if (response.deletePreferredLocations?.__typename === 'SuccessType') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showAlert({
                  type: 'success',
                  title: 'Success!',
                  message: 'Location removed successfully',
                  buttons: [{ text: 'OK', style: 'default' }],
                });
                await refetchProfile();
              } else {
                throw new Error('Failed to delete location');
              }
            } catch (error: any) {
              showAlert({
                type: 'error',
                title: 'Error',
                message: 'Failed to delete location',
                buttons: [{ text: 'OK', style: 'default' }],
              });
            }
          },
        },
      ],
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Preferred Locations</Text>
        {!showAddForm && (
          <TouchableOpacity
            style={styles.addButtonSmall}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAddForm(true);
            }}
          >
            <Text style={styles.addButtonSmallText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Warning if no locations */}
      {locations.length === 0 && !showAddForm && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningTitle}>No locations added</Text>
          <Text style={styles.warningText}>
            Add at least one preferred location to help employers find you.
          </Text>
        </View>
      )}

      {/* Add Location Form */}
      {showAddForm && (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Add Location</Text>
            <TouchableOpacity onPress={resetForm}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Country Dropdown */}
          <Dropdown
            label="Country *"
            value={selectedCountry}
            placeholder={loadingCountries ? 'Loading countries...' : 'Select a country'}
            options={countries}
            onSelect={(country) => {
              setSelectedCountry(country);
              setSelectedCity('');
              fetchCities(country);
            }}
            disabled={loadingCountries}
            loading={loadingCountries}
          />

          {/* City Dropdown */}
          <Dropdown
            label="City *"
            value={selectedCity}
            placeholder={!selectedCountry ? 'Select country first' : loadingCities ? 'Loading cities...' : 'Select a city'}
            options={cities}
            onSelect={setSelectedCity}
            disabled={!selectedCountry || loadingCities}
            loading={loadingCities}
          />

          {/* Work Type Multi-Select */}
          <WorkTypeSelector
            selected={selectedWorkTypes}
            onToggle={handleToggleWorkType}
          />

          {/* Employment Type */}
          <EmploymentTypeSelector
            selected={selectedEmploymentType}
            onSelect={setSelectedEmploymentType}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleAddLocation();
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Add Location</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Locations List */}
      {Array.isArray(locations) && locations.length > 0 && (
        <ScrollView style={styles.locationsList} showsVerticalScrollIndicator={false}>
          {locations.map((location: any, index: number) => {
            // Handle both old string format and new object format
            if (typeof location === 'string') {
              return (
                <LocationCard
                  key={index}
                  location={{
                    city: location,
                    country: '',
                    workTypes: [],
                    employmentType: 'FULL_TIME',
                  }}
                  onDelete={() => handleDeleteLocation(location, location)}
                />
              );
            }
            // Use city_country combination as unique identifier
            const locationKey = `${location.city}_${location.country}`;
            return (
              <LocationCard
                key={locationKey}
                location={location}
                onDelete={() => handleDeleteLocation(locationKey, `${location.city}, ${location.country}`)}
              />
            );
          })}
        </ScrollView>
      )}

      {/* Empty State */}
      {locations.length === 0 && !showAddForm && (
        <View style={styles.emptyState}>
          <LocationIcon size={40} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No locations yet</Text>
          <Text style={styles.emptyStateText}>
            Tap "+ Add" to add your preferred work locations.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  addButtonSmall: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addButtonSmallText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  warningBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#A16207',
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  cancelText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  locationsList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default LocationSetupTab;
