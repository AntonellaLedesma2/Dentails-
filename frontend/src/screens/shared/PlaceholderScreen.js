import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../constants/colors';

/**
 * Pantalla genérica para secciones aún no implementadas.
 * Recibe el título via route.params.title o lo toma del nombre de la ruta.
 */
export default function PlaceholderScreen({ route }) {
  const title = route?.params?.title || route?.name || 'Próximamente';

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🚧</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Esta sección está en desarrollo.</Text>
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
  icon:     { fontSize: 48, marginBottom: 16 },
  title:    { fontSize: 20, fontWeight: '700', color: Colors.text.primary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center' },
});
