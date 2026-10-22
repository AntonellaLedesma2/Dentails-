import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../constants/colors';
import Button from '../../components/Button';

WebBrowser.maybeCompleteAuthSession();

const PROVIDERS = {
  google: {
    label: 'Google',
    icon: '🌐',
    clientId: Platform.OS === 'web'
      ? process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
      : process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '721085208228-nej5f804cd8frbdsl43tg8ej4lql3q7g.apps.googleusercontent.com',
    discovery: {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
    },
    scopes: ['openid', 'profile', 'email'],
  },
  github: {
    label: 'GitHub',
    icon: '🐙',
    clientId: process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID || 'Ov23ct5VVwItyH442s5I',
    discovery: {
      authorizationEndpoint: 'https://github.com/login/oauth/authorize',
      tokenEndpoint: 'https://github.com/login/oauth/access_token',
    },
    scopes: ['read:user', 'user:email'],
  },
  facebook: {
    label: 'Facebook',
    icon: 'f',
    clientId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
    discovery: {
      authorizationEndpoint: 'https://www.facebook.com/v26.0/dialog/oauth',
      tokenEndpoint: 'https://graph.facebook.com/v26.0/oauth/access_token',
    },
    scopes: ['public_profile', 'email'],
  },
};

export default function OAuthLoginScreen({ route, navigation }) {
  const { provider: providerKey } = route.params;
  const { oauthLogin } = useAuth();
  const [status, setStatus] = useState('Tocá el botón para continuar con tu proveedor.');
  const [loading, setLoading] = useState(false);
  const provider = PROVIDERS[providerKey];
  const redirectUri = AuthSession.makeRedirectUri({ native: 'com.dentalis.app://oauth' });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: provider?.clientId || '',
      scopes: provider?.scopes || [],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    provider?.discovery
  );

  useEffect(() => {
    async function handleResponse() {
      if (!response) return;
      if (response.type === 'cancel' || response.type === 'dismiss') {
        setLoading(false);
        setStatus('Inicio de sesión cancelado.');
        navigation.goBack();
        return;
      }
      if (response.type !== 'success') {
        Alert.alert('Error', response.error?.message || `No se pudo autenticar con ${provider.label}.`);
        setLoading(false);
        navigation.goBack();
        return;
      }

      const code = response.params?.code;
      if (!code || !request?.codeVerifier) {
        Alert.alert('Error', 'El proveedor no devolvió un código válido. Intentá de nuevo.');
        setLoading(false);
        navigation.goBack();
        return;
      }

      setStatus('Verificando con el servidor...');
      try {
        await oauthLogin(providerKey, code, redirectUri, request.codeVerifier, provider.clientId);
      } catch (err) {
        const message = err.response?.data?.message || 'No se pudo completar el inicio de sesión.';
        Alert.alert('Error al iniciar sesión', message);
        setLoading(false);
        navigation.goBack();
      }
    }
    handleResponse();
  }, [response, request, provider, providerKey, redirectUri, oauthLogin, navigation]);

  async function startLogin() {
    if (!request || loading) return;
    setLoading(true);
    setStatus(`Abriendo ${provider.label}...`);
    try {
      const result = await promptAsync();
      if (result.type !== 'success') setLoading(false);
    } catch (error) {
      setLoading(false);
      setStatus('No se pudo abrir el inicio de sesión.');
      Alert.alert('Error', error.message || 'No se pudo abrir el proveedor.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{provider?.icon || '🔐'}</Text>
      <Text style={styles.title}>Iniciar sesión con {provider?.label || 'tu cuenta'}</Text>
      {loading && <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />}
      <Text style={styles.status}>
        {!provider?.clientId
          ? providerKey === 'google'
            ? 'Falta EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID. Configurá un cliente OAuth de tipo Web para Chrome.'
            : `Falta configurar el ID de ${provider?.label || 'este proveedor'}.`
          : status}
      </Text>
      <Text style={styles.redirect}>Retorno configurado: {redirectUri}</Text>
      <Button
        title={`Continuar con ${provider?.label || 'el proveedor'}`}
        onPress={startLogin}
        disabled={!request || !provider?.clientId}
        loading={loading}
        style={styles.loginButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  icon: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text.primary, marginBottom: 24 },
  spinner: { marginBottom: 16 },
  status: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center' },
  redirect: { fontSize: 11, color: Colors.text.label, textAlign: 'center', marginTop: 18, marginBottom: 14 },
  loginButton: { width: '100%' },
});
