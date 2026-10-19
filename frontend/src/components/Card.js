import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '../constants/colors';

/**
 * Card genérica con título opcional, acción opcional y contenido.
 */
export default function Card({ title, action, onAction, children, style }) {
  return (
    <View style={[styles.card, style]}>
      {(title || action) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {action && (
            <TouchableOpacity onPress={onAction}>
              <Text style={styles.action}>{action}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {children}
    </View>
  );
}

/**
 * Stat card: ícono + label + valor grande
 */
export function StatCard({ icon, label, value, color = Colors.primary, bg, style }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg || Colors.primaryLight }, style]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: 0.2,
  },
  action: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  // StatCard
  statCard: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
    flex: 1,
  },
  statIcon:  { fontSize: 22, marginBottom: 8 },
  statLabel: { fontSize: 12, color: Colors.text.secondary, fontWeight: '500', marginBottom: 4 },
  statValue: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
});
