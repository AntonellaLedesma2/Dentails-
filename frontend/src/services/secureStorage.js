import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// expo-secure-store no tiene implementación web. El navegador usa localStorage;
// Android e iOS mantienen el almacenamiento seguro nativo.
const secureStorage = {
  async getItemAsync(key) {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },

  async setItemAsync(key, value) {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },

  async deleteItemAsync(key) {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export default secureStorage;
