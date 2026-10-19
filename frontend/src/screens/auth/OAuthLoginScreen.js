import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../constants/colors';

WebBrowser.maybeCompleteAuthSession();

// Configuración por proveedor
const PROVIDERS = {
  google: {
    label: 'Google',
    icon: '🌐',
    // Reemplazá con tu clientId de Google Cloud Console
    clientId: 'TU_GOOGLE_CLIENT_ID',
    discovery: {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      userInfoEndpoint: 'https://www.googleapis.com/oauth2/v3/userinfo',
    },
    scopes: ['openid', 'profile', 'email'],
  },
  github: {
    label: 'GitHub',
    icon: '🐙',
    clientId: 'TU_GITHUB_CLIENT_ID',
    discovery: {
      authorizationEndpoint: 'https://github.com/login/oauth/authorize',
      tokenEndpoint: 'https://github.com/login/oauth/access_token',
    },
    scopes: ['read:user', 'user:email'],
  },
  facebook: {
    label: 'Facebook',
    icon: '📘',
    clientId: 'TU_FACEBOOK_APP_ID',
    discovery: {
      authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
    },
    scopes: ['public_profile', 'email'],
  },
};

export default function OAuthLoginScreen({ route, navigation }) {
  const { provider: providerKey } = route.params;
  const { oauthLogin } = useAuth();
  const [status, setStatus] = useState('Iniciando autenticación...');

  const provider = PROVIDERS[providerKey];
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: provider.clientId,
      scopes: provider.scopes,
      redirectUri,
    },
    provider.discovery
  );

  // Lanzar el popup automáticamente al entrar a la pantalla
  useEffect(() => {
    if (request) {
      promptAsync();
    }
  }, [request]);

  // Manejar respuesta OAuth
  useEffect(() => {
    async function handleResponse() {
      if (!response) return;

      if (response.type === 'cancel' || response.type === 'dismiss') {
        navigation.goBack();
        return;
      }

      if (response.type === 'error') {
        Alert.alert('Error', 'No se pudo autenticar con ' + provider.label);
        navigation.goBack();
        return;
      }

      if (response.type === 'success') {
        setStatus('Verificando con el servidor...');
        try {
          // Para Google podemos obtener el id_token directamente
          // Para otros proveedores necesitaríamos un backend proxy
          // Esta implementación envía lo básico al backend
          const { params } = response;

          // Llamada al backend con los datos del OAuth
          await oauthLogin(
            providerKey,
            params.code || params.id_token || 'oauth_code',
            '', // el backend resuelve el email desde el oauthId
            '',
            ''
          );
        } catch (err) {
          const msg = err.response?.data?.message || 'Error al iniciar sesión';
          Alert.alert('Error', msg);
          navigation.goBack();
        }
      }
    }

    handleResponse();
  }, [response]);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{provider.icon}</Text>
      <Text style={styles.title}>Conectando con {provider.label}</Text>
      <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
      <Text style={styles.status}>{status}</Text>
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
  icon:    { fontSize: 56, marginBottom: 16 },
  title:   { fontSize: 20, fontWeight: '700', color: Colors.text.primary, marginBottom: 24 },
  spinner: { marginBottom: 16 },
  status:  { fontSize: 14, color: Colors.text.secondary, textAlign: 'center' },
});
