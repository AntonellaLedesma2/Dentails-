import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';
import { ROLE_LABELS } from '../constants/roles';

export default function RoleBadge({ rol, size = 'md' }) {
  const theme = Colors.roles[rol] || { bg: Colors.gray[100], text: Colors.text.secondary, dot: Colors.gray[400] };

  return (
    <View style={[styles.badge, { backgroundColor: theme.bg }, size === 'sm' && styles.sm]}>
      <View style={[styles.dot, { backgroundColor: theme.dot }]} />
      <Text style={[styles.text, { color: theme.text }, size === 'sm' && styles.smText]}>
        {ROLE_LABELS[rol] || rol}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  sm:   { paddingHorizontal: 8, paddingVertical: 3 },
  dot:  { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: '600' },
  smText: { fontSize: 11 },
});
