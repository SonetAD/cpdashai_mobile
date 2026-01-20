import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface GlassSectionCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
}

/**
 * GlassSectionCard - A card with glass effect and shadow
 * Used for sections like "My Resumes", "Create Resume", etc.
 */
export const GlassSectionCard: React.FC<GlassSectionCardProps> = ({
  children,
  style,
  noPadding = false,
}) => {
  return (
    <View style={[styles.card, noPadding ? styles.noPadding : null, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    // Glass effect border
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    // Shadow
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  noPadding: {
    padding: 0,
  },
});

export default GlassSectionCard;
