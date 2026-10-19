import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import Colors from '../constants/colors';

export default function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  icon,
  style,
  textStyle,
}) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.white}
          size="small"
        />
      ) : (
        <View style={styles.row}>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={[styles.text, styles[`${variant}Text`], styles[`size_${size}Text`], textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: { fontSize: 16 },

  // Variantes
  primary: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  secondary: { backgroundColor: Colors.navy },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghost: { backgroundColor: Colors.primaryLight },
  danger: { backgroundColor: Colors.error },
  success: { backgroundColor: Colors.success },
  disabled: { opacity: 0.45, shadowOpacity: 0 },

  // Tamaños
  size_sm: { paddingVertical: 8,  paddingHorizontal: 16, minHeight: 36 },
  size_md: { paddingVertical: 12, paddingHorizontal: 20, minHeight: 46 },
  size_lg: { paddingVertical: 15, paddingHorizontal: 24, minHeight: 52 },

  // Textos
  text: { fontWeight: '600', letterSpacing: 0.2 },
  primaryText:   { color: Colors.white },
  secondaryText: { color: Colors.white },
  outlineText:   { color: Colors.primary },
  ghostText:     { color: Colors.primary },
  dangerText:    { color: Colors.white },
  successText:   { color: Colors.white },

  size_smText: { fontSize: 13 },
  size_mdText: { fontSize: 15 },
  size_lgText: { fontSize: 16 },
});
