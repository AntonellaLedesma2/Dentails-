import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Alert, TouchableOpacity, useColorScheme,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Input from '../../components/Input';

const THEMES = {
  light: {
    background: '#EEF0FF',
    card: '#FFFFFF',
    text: '#20243B',
    muted: '#747B95',
    border: '#EAECF4',
    input: '#FFFFFF',
    inputBorder: '#ECEEF4',
    primary: '#24399F',
    primaryText: '#FFFFFF',
    soft: '#F6F7FC',
    logo: '#24399F',
    shadow: '#26399B',
  },
  dark: {
    background: '#141817',
    card: '#191E1C',
    text: '#F5F3F7',
    muted: '#A9A3B1',
    border: '#292E2C',
    input: '#070908',
    inputBorder: '#070908',
    primary: '#B79AE8',
    primaryText: '#17121F',
    soft: '#202522',
    logo: '#C0A7F0',
    shadow: '#000000',
  },
};

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const theme = isDark ? THEMES.dark : THEMES.light;

  function validate() {
    const nextErrors = {};
    if (!identifier.trim()) nextErrors.identifier = 'Ingresá tu correo o usuario';
    if (!password) nextErrors.password = 'Ingresá tu contraseña';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await login(identifier.trim(), password);
      if (result.twoFARequired) navigation.navigate('TwoFA', { userId: result.userId });
    } catch (err) {
      const msg = err.response?.data?.message || (err.response
        ? 'No se pudo completar el inicio de sesión.'
        : 'No se pudo conectar con el servidor. Verificá que el backend siga iniciado.');
      Alert.alert('Error al iniciar sesión', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        <View style={styles.topRow}>
          <View style={styles.brandLockup}>
            <View style={[styles.toothBadge, { backgroundColor: theme.primary }]}>
              <Text style={[styles.tooth, { color: theme.primaryText }]}>✦</Text>
            </View>
            <View>
              <Text style={[styles.brand, { color: theme.logo }]}>DENTALIS</Text>
              <Text style={[styles.tagline, { color: theme.muted }]}>GESTIÓN CLÍNICA</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setIsDark((value) => !value)}
            style={[styles.themeToggle, { backgroundColor: theme.soft, borderColor: theme.border }]}
            accessibilityRole="button"
            accessibilityLabel={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
          >
            <Text style={[styles.themeToggleText, { color: theme.text }]}>{isDark ? '☼' : '☾'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Iniciar sesión</Text>
          <Text style={[styles.cardSubtitle, { color: theme.muted }]}>Ingresá a tu cuenta de Dentalis</Text>

          <View style={styles.form}>
            <Input
              label="Correo o usuario"
              placeholder="nombre@clinica.com"
              value={identifier}
              onChangeText={setIdentifier}
              error={errors.identifier}
              leftIcon="✉"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              themeColors={{ label: theme.muted, inputBackground: theme.input, inputBorder: theme.inputBorder, text: theme.text, placeholder: theme.muted }}
            />
            <Input
              label="Contraseña"
              placeholder="Ingresá tu contraseña"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              leftIcon="⌑"
              secureTextEntry
              autoComplete="password"
              themeColors={{ label: theme.muted, inputBackground: theme.input, inputBorder: theme.inputBorder, text: theme.text, placeholder: theme.muted }}
            />
            <TouchableOpacity
              onPress={() => Alert.alert('Recuperar acceso', 'Contactá al administrador del sistema para restablecer tu contraseña.')}
              style={styles.forgotRow}
              accessibilityRole="button"
            >
              <Text style={[styles.forgotText, { color: theme.primary }]}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
            <Button
              title="Iniciar sesión"
              onPress={handleLogin}
              loading={loading}
              size="lg"
              style={[styles.loginBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
              textStyle={{ color: theme.primaryText }}
            />
          </View>

          <View style={styles.dividerRow}>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.muted }]}>o continuar con</Text>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
          </View>

          <View style={styles.oauthRow}>
            {[
              { provider: 'google', label: 'Google', icon: 'G' },
              { provider: 'github', label: 'GitHub', icon: '⌘' },
              { provider: 'facebook', label: 'Facebook', icon: 'f' },
            ].map(({ provider, label, icon }) => (
              <TouchableOpacity
                key={provider}
                style={[styles.oauthBtn, { backgroundColor: theme.soft, borderColor: theme.border }]}
                onPress={() => navigation.navigate('OAuthLogin', { provider })}
                accessibilityRole="button"
                accessibilityLabel={`Iniciar sesión con ${label}`}
              >
                <Text style={[styles.oauthIcon, { color: theme.primary }]}>{icon}</Text>
                <Text style={[styles.oauthLabel, { color: theme.text }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.footer, { color: theme.muted }]}>¿Problemas para acceder? Contactá al administrador.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, width: '100%', alignSelf: 'center', maxWidth: 560, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 30 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toothBadge: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tooth: { fontSize: 26, fontWeight: '800' },
  brand: { fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  tagline: { fontSize: 10, marginTop: 3, letterSpacing: 1.5, fontWeight: '600' },
  themeToggle: { width: 42, height: 42, borderWidth: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  themeToggleText: { fontSize: 22, lineHeight: 26 },
  card: { width: '100%', borderWidth: 1, borderRadius: 24, padding: 26, shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.08, shadowRadius: 32, elevation: 4 },
  cardTitle: { fontSize: 25, fontWeight: '800', marginBottom: 6 },
  cardSubtitle: { fontSize: 14, marginBottom: 26 },
  form: { gap: 0 },
  forgotRow: { alignSelf: 'flex-end', paddingVertical: 1, marginTop: -7, marginBottom: 18 },
  forgotText: { fontSize: 12, fontWeight: '600' },
  loginBtn: { borderRadius: 12, minHeight: 52, marginTop: 2 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, marginBottom: 17 },
  line: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },
  oauthRow: { flexDirection: 'row', gap: 10 },
  oauthBtn: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderRadius: 11 },
  oauthIcon: { fontSize: 16, fontWeight: '800' },
  oauthLabel: { fontSize: 12, fontWeight: '600' },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 22, lineHeight: 18 },
});
