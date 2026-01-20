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
    // Glass Effect shadow - 0px 5px 10px -2px rgba(37, 99, 235, 0.25)
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

  // Main card - Section Container from Figma
  // Pure white card with glass effect shadow
  mainCard: {
    marginHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    gap: 20,
    // Glass Effect shadow
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },

  // Empty state (document icon + No CV Yet text)
  emptyState: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 5,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 16,
  },

  // Inner card - Section Container from Figma
  // background: rgba(37, 99, 235, 0.05), border-radius: 10px, padding: 15px, gap: 10px
  createCard: {
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
    borderRadius: 10,
    padding: 15,
    gap: 10,
    alignItems: 'center',
  },
  createCardContent: {
    width: '100%',
    gap: 5,
  },
  // Item Title - font-weight: 600, font-size: 16px, line-height: 24px, color: #0F172A
  createTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: '#0F172A',
  },
  // Item Subtitle - font-weight: 400, font-size: 12px, line-height: 16px, color: #64748B
  createDescription: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: '#64748B',
  },

  // Create button wrapper for outer shadow (glass effect)
  createButtonWrapper: {
    marginTop: 10,
    width: 253,
    height: 50,
    borderRadius: 33.5,
    // Outer glass shadow - 0px 5px 10px -2px rgba(37, 99, 235, 0.25)
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  // Button outer frame - blue background
  createButton: {
    width: 253,
    height: 50,
    backgroundColor: '#2563EB',
    borderRadius: 33.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // Button inner glass layer
  createButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 33.5,
    // Simulate glass effect with slight lighter overlay
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  // Button text - font-weight: 600, font-size: 16px, line-height: 24px, color: #FFFFFF
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    // Text shadow for glass effect - 0px 5px 10px rgba(37, 99, 235, 0.25)
    textShadowColor: 'rgba(37, 99, 235, 0.25)',
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 10,
  },

  // Skip button - font-weight: 400, font-size: 16px, line-height: 24px, color: #2563EB
  skipButton: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 10,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: '#2563EB',
    textAlign: 'center',
  },
});
