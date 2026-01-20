import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { GetCandidateProfileSuccessType, useUpdateCandidateProfileMutation, useUpdatePersonalInfoMutation } from '../../../../services/api';
import { GlassButton } from '../../../../components/ui/GlassButton';

interface PersonalInfoTabProps {
  candidateProfile: GetCandidateProfileSuccessType | null;
}

// Icon Components
const LinkedInIcon = ({ size = 20, color = '#0A66C2' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z"
      fill={color}
    />
  </Svg>
);

const GitHubIcon = ({ size = 20, color = '#333' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
      fill={color}
    />
  </Svg>
);

const PortfolioIcon = ({ size = 20, color = '#6366F1' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EditIcon = ({ size = 18, color = '#3B82F6' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ExternalLinkIcon = ({ size = 14, color = '#3B82F6' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BriefcaseIcon = ({ size = 20, color = '#6366F1' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BuildingIcon = ({ size = 20, color = '#10B981' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 13v.01M9 17v.01"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ candidateProfile }) => {
  // Basic info editing state
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [fullName, setFullName] = useState(
    candidateProfile?.user?.fullName ||
    `${candidateProfile?.user?.firstName || ''} ${candidateProfile?.user?.lastName || ''}`.trim() || ''
  );

  // Work info editing state
  const [isEditingWorkInfo, setIsEditingWorkInfo] = useState(false);
  const [title, setTitle] = useState(candidateProfile?.title || '');
  const [workplace, setWorkplace] = useState(candidateProfile?.workplace || '');

  // Links editing state
  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState(candidateProfile?.linkedinUrl || '');
  const [githubUrl, setGithubUrl] = useState(candidateProfile?.githubUrl || '');
  const [portfolioUrl, setPortfolioUrl] = useState(candidateProfile?.portfolioUrl || '');

  const [updateCandidateProfile, { isLoading: isSavingLinks }] = useUpdateCandidateProfileMutation();
  const [updatePersonalInfo, { isLoading: isSavingPersonalInfo }] = useUpdatePersonalInfoMutation();

  // Sync local state when profile data updates (after mutation invalidates cache)
  useEffect(() => {
    if (candidateProfile && !isEditingBasicInfo) {
      setFullName(
        candidateProfile.user?.fullName ||
        `${candidateProfile.user?.firstName || ''} ${candidateProfile.user?.lastName || ''}`.trim() || ''
      );
    }
  }, [candidateProfile?.user?.fullName, candidateProfile?.user?.firstName, candidateProfile?.user?.lastName, isEditingBasicInfo]);

  useEffect(() => {
    if (candidateProfile && !isEditingWorkInfo) {
      setTitle(candidateProfile.title || '');
      setWorkplace(candidateProfile.workplace || '');
    }
  }, [candidateProfile?.title, candidateProfile?.workplace, isEditingWorkInfo]);

  useEffect(() => {
    if (candidateProfile && !isEditingLinks) {
      setLinkedinUrl(candidateProfile.linkedinUrl || '');
      setGithubUrl(candidateProfile.githubUrl || '');
      setPortfolioUrl(candidateProfile.portfolioUrl || '');
    }
  }, [candidateProfile?.linkedinUrl, candidateProfile?.githubUrl, candidateProfile?.portfolioUrl, isEditingLinks]);

  // Basic info handlers
  const handleEditBasicInfo = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFullName(
      candidateProfile?.user?.fullName ||
      `${candidateProfile?.user?.firstName || ''} ${candidateProfile?.user?.lastName || ''}`.trim() || ''
    );
    setIsEditingBasicInfo(true);
  }, [candidateProfile]);

  const handleCancelBasicInfo = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditingBasicInfo(false);
  }, []);

  const handleSaveBasicInfo = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await updatePersonalInfo({
        fullName: fullName.trim() || undefined,
      }).unwrap();
      setIsEditingBasicInfo(false);
    } catch (error) {
      console.error('Failed to update basic info:', error);
    }
  }, [fullName, updatePersonalInfo]);

  // Work info handlers
  const handleEditWorkInfo = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTitle(candidateProfile?.title || '');
    setWorkplace(candidateProfile?.workplace || '');
    setIsEditingWorkInfo(true);
  }, [candidateProfile]);

  const handleCancelWorkInfo = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditingWorkInfo(false);
  }, []);

  const handleSaveWorkInfo = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await updatePersonalInfo({
        jobTitle: title.trim() || undefined,
        workplace: workplace.trim() || undefined,
      }).unwrap();
      setIsEditingWorkInfo(false);
    } catch (error) {
      console.error('Failed to update work info:', error);
    }
  }, [title, workplace, updatePersonalInfo]);

  // Links handlers
  const handleEditLinks = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLinkedinUrl(candidateProfile?.linkedinUrl || '');
    setGithubUrl(candidateProfile?.githubUrl || '');
    setPortfolioUrl(candidateProfile?.portfolioUrl || '');
    setIsEditingLinks(true);
  }, [candidateProfile]);

  const handleCancelLinks = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditingLinks(false);
  }, []);

  const handleSaveLinks = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await updateCandidateProfile({
        linkedinUrl: linkedinUrl.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
        portfolioUrl: portfolioUrl.trim() || undefined,
      }).unwrap();
      setIsEditingLinks(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  }, [linkedinUrl, githubUrl, portfolioUrl, updateCandidateProfile]);

  const handleOpenUrl = useCallback((url: string) => {
    if (url) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(url.startsWith('http') ? url : `https://${url}`);
    }
  }, []);

  if (!candidateProfile) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No profile data available</Text>
      </View>
    );
  }

  const { user } = candidateProfile;
  const hasLinks = candidateProfile.linkedinUrl || candidateProfile.githubUrl || candidateProfile.portfolioUrl;

  return (
    <View>
      {/* Basic Information */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Basic Information</Text>
          {!isEditingBasicInfo && (
            <TouchableOpacity onPress={handleEditBasicInfo} style={styles.editButton}>
              <EditIcon size={16} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditingBasicInfo ? (
          <View style={styles.editForm}>
            {/* Full Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabelText}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                maxLength={50}
              />
            </View>

            {/* Non-editable fields display */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValue}>{user.email || 'Not provided'}</Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <Text style={styles.fieldValue}>{user.phoneNumber || 'Not provided'}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelBasicInfo}
                disabled={isSavingPersonalInfo}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.saveButtonContainer}>
                <GlassButton
                  text={isSavingPersonalInfo ? '' : 'Save'}
                  width={120}
                  height={44}
                  borderRadius={22}
                  colors={['#3B82F6', '#2563EB']}
                  shadowColor="rgba(37, 99, 235, 0.4)"
                  onPress={handleSaveBasicInfo}
                  disabled={isSavingPersonalInfo}
                  loading={isSavingPersonalInfo}
                />
              </View>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <Text style={styles.fieldValue}>
                {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Not provided'}
              </Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValue}>{user.email || 'Not provided'}</Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <Text style={styles.fieldValue}>{user.phoneNumber || 'Not provided'}</Text>
            </View>

            {user.bio && (
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Bio</Text>
                <Text style={styles.fieldValue}>{user.bio}</Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Work Information - Always show (editable) */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Work Information</Text>
          {!isEditingWorkInfo && (
            <TouchableOpacity onPress={handleEditWorkInfo} style={styles.editButton}>
              <EditIcon size={16} />
              <Text style={styles.editButtonText}>
                {candidateProfile.title || candidateProfile.workplace ? 'Edit' : 'Add'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditingWorkInfo ? (
          <View style={styles.editForm}>
            {/* Job Title Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <BriefcaseIcon size={18} />
                <Text style={styles.inputLabelText}>Job Title / Role</Text>
              </View>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. UX Designer, Software Engineer"
                placeholderTextColor="#9CA3AF"
                maxLength={100}
              />
            </View>

            {/* Workplace Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <BuildingIcon size={18} />
                <Text style={styles.inputLabelText}>Current Workplace</Text>
              </View>
              <TextInput
                style={styles.input}
                value={workplace}
                onChangeText={setWorkplace}
                placeholder="e.g. Google, Freelance, Student"
                placeholderTextColor="#9CA3AF"
                maxLength={100}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelWorkInfo}
                disabled={isSavingPersonalInfo}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.saveButtonContainer}>
                <GlassButton
                  text={isSavingPersonalInfo ? '' : 'Save'}
                  width={120}
                  height={44}
                  borderRadius={22}
                  colors={['#3B82F6', '#2563EB']}
                  shadowColor="rgba(37, 99, 235, 0.4)"
                  onPress={handleSaveWorkInfo}
                  disabled={isSavingPersonalInfo}
                  loading={isSavingPersonalInfo}
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.workInfoDisplay}>
            {/* Job Title */}
            <View style={[styles.workInfoItem, !candidateProfile.title && styles.workInfoItemEmpty]}>
              <View style={[styles.workInfoIcon, { backgroundColor: '#EEF2FF' }]}>
                <BriefcaseIcon size={22} color={candidateProfile.title ? '#6366F1' : '#D1D5DB'} />
              </View>
              <View style={styles.workInfoContent}>
                <Text style={styles.workInfoLabel}>Job Title / Role</Text>
                <Text style={[styles.workInfoValue, !candidateProfile.title && styles.workInfoValueEmpty]}>
                  {candidateProfile.title || 'Not added'}
                </Text>
              </View>
            </View>

            {/* Workplace */}
            <View style={[styles.workInfoItem, styles.workInfoItemLast, !candidateProfile.workplace && styles.workInfoItemEmpty]}>
              <View style={[styles.workInfoIcon, { backgroundColor: '#ECFDF5' }]}>
                <BuildingIcon size={22} color={candidateProfile.workplace ? '#10B981' : '#D1D5DB'} />
              </View>
              <View style={styles.workInfoContent}>
                <Text style={styles.workInfoLabel}>Current Workplace</Text>
                <Text style={[styles.workInfoValue, !candidateProfile.workplace && styles.workInfoValueEmpty]}>
                  {candidateProfile.workplace || 'Not added'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Professional Links - Always show (even if empty, so users can add) */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Professional Links</Text>
          {!isEditingLinks && (
            <TouchableOpacity onPress={handleEditLinks} style={styles.editButton}>
              <EditIcon size={16} />
              <Text style={styles.editButtonText}>{hasLinks ? 'Edit' : 'Add'}</Text>
            </TouchableOpacity>
          )}
        </View>


        {isEditingLinks ? (
          <View style={styles.editForm}>
            {/* LinkedIn Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <LinkedInIcon size={18} />
                <Text style={styles.inputLabelText}>LinkedIn Profile</Text>
              </View>
              <TextInput
                style={styles.input}
                value={linkedinUrl}
                onChangeText={setLinkedinUrl}
                placeholder="https://linkedin.com/in/username"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            {/* GitHub Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <GitHubIcon size={18} />
                <Text style={styles.inputLabelText}>GitHub Profile</Text>
              </View>
              <TextInput
                style={styles.input}
                value={githubUrl}
                onChangeText={setGithubUrl}
                placeholder="https://github.com/username"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            {/* Portfolio Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <PortfolioIcon size={18} />
                <Text style={styles.inputLabelText}>Portfolio Website</Text>
              </View>
              <TextInput
                style={styles.input}
                value={portfolioUrl}
                onChangeText={setPortfolioUrl}
                placeholder="https://yourportfolio.com"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelLinks}
                disabled={isSavingLinks}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.saveButtonContainer}>
                <GlassButton
                  text={isSavingLinks ? '' : 'Save'}
                  width={120}
                  height={44}
                  borderRadius={22}
                  colors={['#3B82F6', '#2563EB']}
                  shadowColor="rgba(37, 99, 235, 0.4)"
                  onPress={handleSaveLinks}
                  disabled={isSavingLinks}
                  loading={isSavingLinks}
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.linksDisplay}>
            {/* LinkedIn */}
            <TouchableOpacity
              style={[styles.linkItem, !candidateProfile.linkedinUrl && styles.linkItemEmpty]}
              onPress={() => candidateProfile.linkedinUrl && handleOpenUrl(candidateProfile.linkedinUrl)}
              disabled={!candidateProfile.linkedinUrl}
            >
              <View style={styles.linkIcon}>
                <LinkedInIcon size={22} color={candidateProfile.linkedinUrl ? '#0A66C2' : '#D1D5DB'} />
              </View>
              <View style={styles.linkContent}>
                <Text style={styles.linkLabel}>LinkedIn</Text>
                <Text style={[styles.linkValue, !candidateProfile.linkedinUrl && styles.linkValueEmpty]} numberOfLines={1}>
                  {candidateProfile.linkedinUrl || 'Not added'}
                </Text>
              </View>
              {candidateProfile.linkedinUrl && <ExternalLinkIcon />}
            </TouchableOpacity>

            {/* GitHub */}
            <TouchableOpacity
              style={[styles.linkItem, !candidateProfile.githubUrl && styles.linkItemEmpty]}
              onPress={() => candidateProfile.githubUrl && handleOpenUrl(candidateProfile.githubUrl)}
              disabled={!candidateProfile.githubUrl}
            >
              <View style={styles.linkIcon}>
                <GitHubIcon size={22} color={candidateProfile.githubUrl ? '#333' : '#D1D5DB'} />
              </View>
              <View style={styles.linkContent}>
                <Text style={styles.linkLabel}>GitHub</Text>
                <Text style={[styles.linkValue, !candidateProfile.githubUrl && styles.linkValueEmpty]} numberOfLines={1}>
                  {candidateProfile.githubUrl || 'Not added'}
                </Text>
              </View>
              {candidateProfile.githubUrl && <ExternalLinkIcon />}
            </TouchableOpacity>

            {/* Portfolio */}
            <TouchableOpacity
              style={[styles.linkItem, styles.linkItemLast, !candidateProfile.portfolioUrl && styles.linkItemEmpty]}
              onPress={() => candidateProfile.portfolioUrl && handleOpenUrl(candidateProfile.portfolioUrl)}
              disabled={!candidateProfile.portfolioUrl}
            >
              <View style={styles.linkIcon}>
                <PortfolioIcon size={22} color={candidateProfile.portfolioUrl ? '#6366F1' : '#D1D5DB'} />
              </View>
              <View style={styles.linkContent}>
                <Text style={styles.linkLabel}>Portfolio</Text>
                <Text style={[styles.linkValue, !candidateProfile.portfolioUrl && styles.linkValueEmpty]} numberOfLines={1}>
                  {candidateProfile.portfolioUrl || 'Not added'}
                </Text>
              </View>
              {candidateProfile.portfolioUrl && <ExternalLinkIcon />}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Preferences */}
      {candidateProfile.preferredLocations && candidateProfile.preferredLocations.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preferences</Text>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Preferred Locations</Text>
            <View style={styles.tagsContainer}>
              {candidateProfile.preferredLocations.map((location: any, index) => {
                // Handle both old string format and new object format
                const locationText = typeof location === 'string'
                  ? location
                  : `${location.city}, ${location.country}`;
                return (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{locationText}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    marginBottom: 16,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 6,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    color: '#111827',
  },
  linksDisplay: {
    marginTop: 8,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  linkItemLast: {
    borderBottomWidth: 0,
  },
  linkItemEmpty: {
    opacity: 0.7,
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkContent: {
    flex: 1,
  },
  linkLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  linkValue: {
    fontSize: 14,
    color: '#3B82F6',
  },
  linkValueEmpty: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  editForm: {
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButtonContainer: {
    overflow: 'visible',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tag: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
  },
  // Work Info styles
  workInfoDisplay: {
    marginTop: 8,
  },
  workInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  workInfoItemLast: {
    borderBottomWidth: 0,
  },
  workInfoItemEmpty: {
    opacity: 0.7,
  },
  workInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  workInfoContent: {
    flex: 1,
  },
  workInfoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  workInfoValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  workInfoValueEmpty: {
    color: '#9CA3AF',
    fontStyle: 'italic',
    fontWeight: '400',
  },
});
