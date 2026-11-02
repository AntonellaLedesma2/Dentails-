import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../constants/colors';
import { useAppUi } from '../context/AppUiContext';

export default function Input({
  label,
  error,
  hint,
  secureTextEntry = false,
  leftIcon,
  style,
  containerStyle,
  themeColors,
  showFocusStyle = true,
  ...props
}) {
  const { colors } = useAppUi();
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: themeColors?.label || colors.muted }]}>{label}</Text>}
      <View style={[
        styles.inputWrapper,
        {
          backgroundColor: themeColors?.inputBackground || colors.surface,
          borderColor: themeColors?.inputBorder || colors.border,
        },
        focused && showFocusStyle && [styles.inputFocused, { borderColor: colors.primary, shadowColor: colors.primary }],
        error && !focused && styles.inputError,
      ]}>
        {leftIcon && <Text style={styles.leftIcon}>{leftIcon}</Text>}
        <TextInput
          style={[styles.input, { color: themeColors?.text || colors.text }, leftIcon && styles.inputWithIcon, style]}
          placeholderTextColor={themeColors?.placeholder || colors.muted}
          secureTextEntry={secureTextEntry && !visible}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setVisible(!visible)}
            style={styles.eyeBtn}
            accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <Text style={styles.eyeIcon}>{visible ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>⚠ {error}</Text>}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  inputFocused: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError:   { borderColor: Colors.error },
  leftIcon:     { fontSize: 16, marginRight: 8, color: Colors.text.secondary },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
    paddingVertical: 10,
  },
  inputWithIcon: { marginLeft: 4 },
  eyeBtn:  { padding: 4 },
  eyeIcon: { fontSize: 16 },
  errorText: { fontSize: 12, color: Colors.error, marginTop: 4 },
  hintText:  { fontSize: 12, color: Colors.text.label, marginTop: 4 },
});
