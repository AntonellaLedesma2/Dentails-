import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Alert, TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Colors from '../../constants/colors';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [errors, setErrors]         = useState({});

  function validate() {
    const e = {};
    if (!identifier.trim()) e.identifier = 'Ingresá tu correo o usuario';
    if (!password)          e.password   = 'Ingresá tu contraseña';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await login(identifier.trim(), password);
      if (result.twoFARequired) {
        navigation.navigate('TwoFA', { userId: result.userId });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Credenciales incorrectas';
      Alert.alert('Error al iniciar sesión', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>🦷</Text>
          </View>
          <Text style={styles.brand}>DENTALIS</Text>
          <Text style={styles.tagline}>Sistema de gestión odontológica</Text>
        </View>

        {/* Card de login */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar sesión</Text>
          <Text style={styles.cardSubtitle}>Ingresá con tu cuenta del sistema</Text>

          <View style={styles.form}>
            <Input
              label="Correo o usuario"
              placeholder="admin@dentalis.com"
              value={identifier}
              onChangeText={setIdentifier}
              error={errors.identifier}
              leftIcon="✉️"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              leftIcon="🔑"
              secureTextEntry
              autoComplete="password"
            />

            <Button
              title="Iniciar sesión"
              onPress={handleLogin}
              loading={loading}
              size="lg"
              style={styles.loginBtn}
            />
          </View>
        </View>

        {/* OAuth */}
        <View style={styles.dividerRow}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>o continuar con</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.oauthRow}>
          {[
            { provider: 'google',   label: 'Google',   icon: 'G'  },
            { provider: 'github',   label: 'GitHub',   icon: '🐙' },
            { provider: 'facebook', label: 'Facebook', icon: 'f'  },
          ].map(({ provider, label, icon }) => (
            <TouchableOpacity
              key={provider}
              style={styles.oauthBtn}
              onPress={() => navigation.navigate('OAuthLogin', { provider })}
              accessibilityLabel={`Iniciar sesión con ${label}`}
            >
              <Text style={styles.oauthIcon}>{icon}</Text>
              <Text style={styles.oauthLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footer}>
          ¿Problemas para acceder?{'\n'}Contactá al administrador del sistema.
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },

  header: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoIcon: { fontSize: 36 },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.navy,
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 4,
  },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
  },
  cardTitle:    { fontSize: 20, fontWeight: '700', color: Colors.text.primary, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: Colors.text.secondary, marginBottom: 20 },
  form: { gap: 0 },
  loginBtn: { marginTop: 4 },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  line:        { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 12, color: Colors.text.label },

  oauthRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  oauthBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  oauthIcon:  { fontSize: 14, fontWeight: '800', color: Colors.text.primary },
  oauthLabel: { fontSize: 13, color: Colors.text.primary, fontWeight: '500' },

  footer: {
    textAlign: 'center',
    color: Colors.text.label,
    fontSize: 12,
    lineHeight: 18,
  },
});
