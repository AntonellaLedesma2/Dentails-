import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Colors from '../../constants/colors';

export default function TwoFAScreen({ route }) {
  const { userId } = route.params;
  const { verifyTwoFA } = useAuth();

  const [code, setCode]     = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  async function handleVerify() {
    if (code.length !== 6) {
      Alert.alert('Error', 'El código debe tener 6 dígitos');
      return;
    }
    setLoading(true);
    try {
      await verifyTwoFA(userId, code);
      // El contexto actualiza isAuthenticated y el navigator redirige automáticamente
    } catch (err) {
      const msg = err.response?.data?.message || 'Código incorrecto o expirado';
      Alert.alert('Error', msg);
      setCode('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.title}>Verificación en 2 pasos</Text>
        <Text style={styles.subtitle}>
          Ingresá el código de 6 dígitos que enviamos a tu correo.
        </Text>

        <TextInput
          ref={inputRef}
          style={styles.codeInput}
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor={Colors.gray[300]}
          textAlign="center"
          accessibilityLabel="Código de verificación"
        />

        <Button
          title="Verificar"
          onPress={handleVerify}
          loading={loading}
          disabled={code.length !== 6}
          style={styles.btn}
        />

        <Text style={styles.hint}>
          El código expira en 10 minutos.{'\n'}
          Si no llegó, cerrá sesión y volvé a intentarlo.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  icon: { fontSize: 56, marginBottom: 16 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
    lineHeight: 20,
  },
  codeInput: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 12,
    color: Colors.text.primary,
    borderBottomWidth: 3,
    borderBottomColor: Colors.primary,
    paddingVertical: 8,
    width: 200,
    marginBottom: 32,
  },
  btn: { width: '100%' },
  hint: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});
