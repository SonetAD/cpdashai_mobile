import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  // Header styles
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
    lineHeight: 18,
  },

  // Content area
  content: {
    flex: 1,
    paddingHorizontal: 0,
  },

  // Back button row
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    gap: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    // Glass Effect shadow
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  backText: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 25,
    color: '#0F172A',
  },

  // Scrollview content
  scrollContent: {
    paddingBottom: 140,
  },

  // Main card - Section Container with glass effect
  sectionCard: {
    marginHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    gap: 15,
    // Glass Effect shadow
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },

  // Section header row
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: '#64748B',
    marginTop: 2,
  },

  // Inner card with light blue background
  innerCard: {
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
    borderRadius: 10,
    padding: 15,
    gap: 10,
  },

  // Input styles
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: '#0F172A',
    marginBottom: 8,
  },
  inputLabelRequired: {
    color: '#EF4444',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#0F172A',
  },
  textInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  textInputError: {
    borderColor: '#EF4444',
  },
  textInputPlaceholder: {
    color: '#94A3B8',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: '#EF4444',
    marginTop: 4,
  },

  // Input row for side-by-side inputs
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputHalf: {
    flex: 1,
  },

  // Date picker button
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#0F172A',
  },
  dateButtonPlaceholder: {
    color: '#94A3B8',
  },

  // Action buttons (Improve Clarity, Add Keywords, etc.)
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    color: '#2563EB',
  },

  // Add button (+ Add Experience, etc.)
  addButton: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: '#2563EB',
  },

  // Remove button
  removeButton: {
    alignSelf: 'flex-end',
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    color: '#EF4444',
  },

  // Experience/Education item card
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 15,
    gap: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: '#0F172A',
  },

  // Checkbox styles
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkboxText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#64748B',
  },

  // Toggle switch styles
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    color: '#0F172A',
  },
  toggleSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    color: '#64748B',
    marginTop: 2,
  },
  toggleSwitch: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#2563EB',
  },
  toggleKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },

  // Bottom button container - fixed at bottom
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    gap: 12,
  },

  // Save button (transparent/outlined)
  saveButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: '#2563EB',
  },

  // Export PDF button (blue with glass effect)
  exportButtonWrapper: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    // Glass Effect shadow
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  exportButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#2563EB',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  exportButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    textShadowColor: 'rgba(37, 99, 235, 0.25)',
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 10,
  },

  // Date picker modal
  datePickerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  datePickerCancel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    color: '#64748B',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: '#0F172A',
  },
  datePickerDone: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: '#2563EB',
  },

  // AI button
  aiButton: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aiButtonText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    color: '#FFFFFF',
  },

  // Empty state message
  emptyStateCard: {
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
  },
});
