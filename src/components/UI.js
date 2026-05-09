import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing, radius, typography } from '../constants/theme';

// ─── ThemedView ───────────────────────────────────────────────────────────────

export const ThemedView = ({ style, card, elevated, children, ...props }) => {
  const { theme } = useTheme();
  return (
    <View
      style={[
        { backgroundColor: elevated ? theme.cardElevated : card ? theme.card : theme.bg },
        card && { borderRadius: radius.lg, borderWidth: 1, borderColor: theme.cardBorder },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

// ─── ThemedText ───────────────────────────────────────────────────────────────

export const ThemedText = ({ style, variant = 'body', secondary, muted, accent, children, ...props }) => {
  const { theme } = useTheme();
  const color = accent
    ? theme.accentLight
    : muted
    ? theme.textMuted
    : secondary
    ? theme.textSecondary
    : theme.text;

  return (
    <Text style={[typography[variant], { color }, style]} {...props}>
      {children}
    </Text>
  );
};

// ─── PrimaryButton ────────────────────────────────────────────────────────────

export const PrimaryButton = ({ onPress, label, loading, style, small, danger, disabled }) => {
  const { theme } = useTheme();
  const bg = danger ? theme.danger : theme.accent;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.btn,
        { backgroundColor: bg, paddingVertical: small ? 10 : 16 },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color="#fff" size="small" />
        : <Text style={[typography.bodyMed, { color: '#fff', textAlign: 'center' }]}>{label}</Text>
      }
    </TouchableOpacity>
  );
};

// ─── GhostButton ─────────────────────────────────────────────────────────────

export const GhostButton = ({ onPress, label, style, small, accent }) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.btn,
        {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: accent ? theme.accent : theme.cardBorder,
          paddingVertical: small ? 10 : 16,
        },
        style,
      ]}
    >
      <Text style={[
        typography.bodyMed,
        { color: accent ? theme.accentLight : theme.textSecondary, textAlign: 'center' },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// ─── CategoryPill ─────────────────────────────────────────────────────────────

export const CategoryPill = ({ label, color, icon, selected, onPress }) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.pill,
        {
          backgroundColor: selected ? color + '25' : theme.cardElevated,
          borderColor: selected ? color : theme.cardBorder,
        },
      ]}
    >
      <Text style={{ fontSize: 14 }}>{icon} </Text>
      <Text style={[
        typography.smallMed,
        { color: selected ? color : theme.textSecondary },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// ─── Divider ─────────────────────────────────────────────────────────────────

export const Divider = ({ style }) => {
  const { theme } = useTheme();
  return <View style={[{ height: 1, backgroundColor: theme.separator }, style]} />;
};

// ─── ProgressBar ─────────────────────────────────────────────────────────────

export const ProgressBar = ({ progress, color, style, height = 4 }) => {
  const { theme } = useTheme();
  const pct = Math.min(1, Math.max(0, progress));
  return (
    <View style={[{ height, backgroundColor: theme.cardBorder, borderRadius: radius.full }, style]}>
      <View style={{
        height,
        width: `${pct * 100}%`,
        backgroundColor: color || theme.accent,
        borderRadius: radius.full,
      }} />
    </View>
  );
};

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
});
