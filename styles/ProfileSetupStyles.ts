import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  pointsToast: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  pointsToastText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  backRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  progressRing: {
    position: 'absolute',
  },
  avatarInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  levelBadge: {
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  levelBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  tabsScroll: {
    marginBottom: 16,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  tabCompleted: {
    borderColor: '#10B981',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  formCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tabContent: {
    minHeight: 200,
  },
  // Empty state styles
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
  },
  inputDisabled: {
    backgroundColor: '#E5E7EB',
    color: '#6B7280',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
  },
  entryCard: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  removeButtonText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  bottomButtons: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  skipButtonText: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '500',
  },
  // Date picker styles
  datePickerButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  datePickerText: {
    fontSize: 15,
    color: '#1F2937',
  },
  datePickerPlaceholder: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  // Glass Add Button styles (from Figma)
  glassAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(241, 245, 249, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    borderRadius: 34,
    // Shadow for iOS
    shadowColor: 'rgba(37, 99, 235, 1)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    // Elevation for Android
    elevation: 4,
  },
  glassAddButtonText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#64748B',
    fontWeight: '700',
  },
  // Small Glass Add Button for header
  glassAddButtonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    // backgroundColor: 'rgba(241, 245, 249, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(148, 165, 188, 0.2)',
    borderRadius: 20,
    // Shadow for iOS
    shadowColor: 'rgba(160, 186, 244, 1)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    // Elevation for Android
    elevation: 3,
  },
  glassAddButtonSmallText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
  },
  // Checkbox styles
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  // Summary card styles for existing entries (read-only)
  summaryCard: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryContent: {
    flex: 1,
    marginRight: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  summarySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 4,
  },
  summaryMeta: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  summaryDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 18,
  },
  summaryBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  summaryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  // Glass card with Skia styles
  glassCardWrapper: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  glassCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  glassCanvasLarge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  glassCardContent: {
    padding: 16,
    minHeight: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  glassCardContentLarge: {
    padding: 16,
    minHeight: 120,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  // Summary action buttons
  summaryActions: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'flex-end',
  },
  summaryActionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  summaryActionEdit: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  summaryActionDelete: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  // Edit mode buttons
  editActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelEditButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cancelEditText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  saveEditButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  saveEditText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  // Glass Badge/Chip styles for skills, hobbies, locations
  glassBadgeWrapper: {
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  glassBadgeCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glassBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  glassBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginRight: 8,
  },
  glassBadgeDelete: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassBadgeDeleteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  // Glass Card for list items (certificates, extracurricular, leadership)
  glassListCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  glassListCardCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  glassListCardContent: {
    padding: 16,
    minHeight: 120,
  },
  glassListCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  glassListCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  glassListCardSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 4,
  },
  glassListCardMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  glassListCardDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
    lineHeight: 18,
  },
  glassListCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  // Quick add / suggestion chips
  glassSuggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    marginRight: 8,
    marginBottom: 8,
  },
  glassSuggestionChipText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  // Warning banner
  glassWarningBanner: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(254, 243, 199, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    padding: 16,
  },
  glassWarningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  glassWarningText: {
    fontSize: 13,
    color: '#A16207',
    lineHeight: 18,
  },
});
