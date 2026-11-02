import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../constants/colors';
import Button from '../../components/Button';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const PROVIDERS = {
  google: {
    label: 'Google',
    icon: '🌐',
    // The native Google SDK returns an ID token whose audience is the server (web) client.
    clientId: GOOGLE_WEB_CLIENT_ID,
    discovery: {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
    },
    scopes: ['openid', 'profile', 'email'],
  },
  github: {
    label: 'GitHub',
    icon: '🐙',
    clientId: Platform.OS === 'web'
      ? process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID
      : process.env.EXPO_PUBLIC_GITHUB_NATIVE_CLIENT_ID,
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

const isExpoGo = Platform.OS !== 'web' && (
  Constants.executionEnvironment === 'storeClient'
  || Constants.appOwnership === 'expo'
);

function getOAuthErrorMessage(error) {
  const serverMessage = error.response?.data?.message;
  if (serverMessage) return serverMessage;
  if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
    const apiUrl = error.config?.baseURL || 'la URL configurada en frontend/.env';
    return `No se pudo conectar con el servidor (${apiUrl}). Verificá que el backend esté iniciado, que el teléfono y la PC estén en la misma red Wi‑Fi y que EXPO_PUBLIC_API_URL_NATIVE tenga la IP actual de la PC.`;
  }
  return error.message || 'No se pudo completar el inicio de sesión. Revisá la configuración del proveedor.';
}

export default function OAuthLoginScreen({ route, navigation }) {
  const { provider: providerKey } = route.params;
  const { oauthLogin } = useAuth();
  const [status, setStatus] = useState('Tocá el botón para continuar con tu proveedor.');
  const [loading, setLoading] = useState(false);
  const processedCodeRef = useRef(null);
  const provider = PROVIDERS[providerKey];
  const redirectUri = Platform.OS === 'web'
    ? (process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI_WEB || AuthSession.makeRedirectUri())
    : AuthSession.makeRedirectUri({ native: 'com.dentalis.app://oauth' });

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
    async function handleWebOrGitHubResponse() {
      if (!response) return;
      const responseCode = response.params?.code;
      if (response.type === 'success' && responseCode && processedCodeRef.current === responseCode) return;
      if (response.type === 'success' && responseCode) processedCodeRef.current = responseCode;
      if (response.type === 'cancel' || response.type === 'dismiss') {
        setLoading(false);
        setStatus('Inicio de sesión cancelado.');
        navigation.goBack();
        return;
      }
      if (response.type !== 'success') {
        Alert.alert('Error', response.error?.message || `No se pudo autenticar con ${provider?.label || 'el proveedor'}.`);
        setLoading(false);
        navigation.goBack();
        return;
      }

      const code = responseCode;
      if (!code || !request?.codeVerifier) {
        Alert.alert('Error', 'El proveedor no devolvió un código válido. Intentá de nuevo.');
        setLoading(false);
        navigation.goBack();
        return;
      }

      setStatus('Verificando con el servidor...');
      try {
        const result = await oauthLogin(providerKey, {
          code,
          redirectUri,
          codeVerifier: request.codeVerifier,
          clientId: provider.clientId,
        });
        if (result?.twoFARequired) navigation.navigate('TwoFA', { userId: result.userId });
      } catch (err) {
        const message = getOAuthErrorMessage(err);
        Alert.alert('Error al iniciar sesión', message);
        setLoading(false);
        setStatus(message);
      }
    }
    handleWebOrGitHubResponse();
  }, [response, request, provider, providerKey, redirectUri, oauthLogin, navigation]);

  async function startNativeGoogle() {
    const { TurboModuleRegistry } = require('react-native');
    if (!TurboModuleRegistry.get('RNGoogleSignin')) {
      const error = new Error('Google nativo no está incluido en esta aplicación. Expo Go no admite este módulo; instalá el build de desarrollo de DENTALIS.');
      error.code = 'GOOGLE_NATIVE_MODULE_MISSING';
      throw error;
    }
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      scopes: ['email', 'profile'],
    });
    const googleAuthResult = await GoogleSignin.signIn();
    if (googleAuthResult.type === 'cancelled') {
      setLoading(false);
      return;
    }
    const idToken = googleAuthResult.data?.idToken;
    if (!idToken) throw new Error('Google no devolvió un ID token. Revisá los clientes OAuth de iOS/Android.');
    const result = await oauthLogin('google', { idToken, clientId: GOOGLE_WEB_CLIENT_ID });
    if (result?.twoFARequired) navigation.navigate('TwoFA', { userId: result.userId });
  }

  async function startNativeFacebook() {
    const { AccessToken, LoginManager } = require('react-native-fbsdk-next');
    const facebookAuthResult = await LoginManager.logInWithPermissions(['public_profile', 'email']);
    if (facebookAuthResult.isCancelled) {
      setLoading(false);
      return;
    }
    const token = await AccessToken.getCurrentAccessToken();
    if (!token?.accessToken) throw new Error('Facebook no devolvió un token de acceso.');
    const loginResult = await oauthLogin('facebook', {
      accessToken: token.accessToken.toString(),
      clientId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
    });
    if (loginResult?.twoFARequired) navigation.navigate('TwoFA', { userId: loginResult.userId });
  }

  async function startLogin() {
    if (loading) return;
    if (isExpoGo) {
      Alert.alert(
        'Se necesita la app de desarrollo',
        'Expo Go no admite estos retornos OAuth nativos. Para iniciar sesión social en iPhone o Android necesitás instalar una compilación de desarrollo de DENTALIS. La versión web sí funciona desde la computadora o el navegador del teléfono.'
      );
      return;
    }

    setLoading(true);
    setStatus(`Abriendo ${provider?.label || 'el proveedor'}...`);
    try {
      if (Platform.OS !== 'web' && providerKey === 'google') {
        await startNativeGoogle();
      } else if (Platform.OS !== 'web' && providerKey === 'facebook') {
        await startNativeFacebook();
      } else {
        if (!request) throw new Error('La solicitud de autenticación todavía se está preparando.');
        const result = await promptAsync();
        if (result.type !== 'success') setLoading(false);
      }
    } catch (error) {
      if (error.code === 'GOOGLE_NATIVE_MODULE_MISSING') {
        setLoading(false);
        setStatus(error.message);
        Alert.alert('Se necesita DENTALIS de desarrollo', error.message);
        return;
      }
      if (error.code === 'SIGN_IN_CANCELLED' || error.code === 'ERR_CANCELED') {
        setLoading(false);
        return;
      }
      setLoading(false);
      const message = getOAuthErrorMessage(error);
      setStatus(message);
      Alert.alert('Error al iniciar sesión', message);
    }
  }

  const nativeProviderSetupMissing = Platform.OS !== 'web' && providerKey === 'github'
    && !process.env.EXPO_PUBLIC_GITHUB_NATIVE_CLIENT_ID;
  const nativeGoogleSetupMissing = Platform.OS !== 'web' && providerKey === 'google'
    && (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
      || (Platform.OS === 'ios' && !process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID)
      || (Platform.OS === 'android' && !process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID));
  const nativeFacebookSetupMissing = Platform.OS !== 'web' && providerKey === 'facebook'
    && !process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN;
  const configured = Boolean(provider?.clientId)
    && !nativeProviderSetupMissing
    && !nativeGoogleSetupMissing
    && !nativeFacebookSetupMissing;

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{provider?.icon || '🔐'}</Text>
      <Text style={styles.title}>Iniciar sesión con {provider?.label || 'tu cuenta'}</Text>
      {loading && <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />}
      <Text style={styles.status}>
        {!configured
          ? nativeProviderSetupMissing
            ? 'Falta crear un OAuth App de GitHub para móvil y configurar su ID en frontend/.env.'
            : nativeFacebookSetupMissing
              ? 'Falta EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN. Obtenelo en Meta Developers → Configuración de la app → Avanzada.'
              : nativeGoogleSetupMissing
                ? 'Falta el cliente OAuth de Google para esta plataforma en frontend/.env.'
            : `Falta configurar las credenciales de ${provider?.label || 'este proveedor'} en frontend/.env.`
          : isExpoGo
            ? 'Para usar redes sociales en el teléfono, abrí DENTALIS en una compilación de desarrollo; Expo Go no admite el retorno OAuth nativo.'
            : status}
      </Text>
      <Text style={styles.redirect}>Retorno configurado: {redirectUri}</Text>
      <Button
        title={`Continuar con ${provider?.label || 'el proveedor'}`}
        onPress={startLogin}
        disabled={!configured || loading}
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
