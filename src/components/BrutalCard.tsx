import React from 'react';
import { View, StyleSheet, ViewStyle, ReactNode } from 'react-native';
import { theme } from '../styles/theme';

interface BrutalCardProps {
  children: ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
}

export const BrutalCard: React.FC<BrutalCardProps> = ({ 
  children, 
  style, 
  backgroundColor = theme.colors.card 
}) => {
  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: theme.borders.width,
    borderColor: theme.colors.border,
    borderRadius: theme.borders.radius,
    padding: theme.spacing.md,
    ...theme.brutalShadow,
  },
});
