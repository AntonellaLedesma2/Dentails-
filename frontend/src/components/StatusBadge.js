import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';

const STATUS_THEME = {
  activo:       { bg: Colors.successLight, text: Colors.success,  dot: Colors.success  },
  inactivo:     { bg: Colors.gray[100],    text: Colors.gray[500], dot: Colors.gray[400] },
  pendiente:    { bg: Colors.warningLight, text: Colors.warning,  dot: Colors.warning  },
  confirmado:   { bg: Colors.successLight, text: Colors.success,  dot: Colors.success  },
  cancelado:    { bg: Colors.errorLight,   text: Colors.error,    dot: Colors.error    },
  realizado:    { bg: Colors.infoLight,    text: Colors.primary,  dot: Colors.primary  },
  reprogramado: { bg: Colors.warningLight, text: Colors.warning,  dot: Colors.warning  },
};

const LABELS = {
  activo: 'Activo', inactivo: 'Inactivo',
  pendiente: 'Pendiente', confirmado: 'Confirmado',
  cancelado: 'Cancelado', realizado: 'Realizado',
  reprogramado: 'Reprogramado',
};

export default function StatusBadge({ status }) {
  const theme = STATUS_THEME[status] || { bg: Colors.gray[100], text: Colors.gray[500], dot: Colors.gray[400] };

  return (
    <View style={[styles.badge, { backgroundColor: theme.bg }]}>
      <View style={[styles.dot, { backgroundColor: theme.dot }]} />
      <Text style={[styles.text, { color: theme.text }]}>
        {LABELS[status] || status}
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
  dot:  { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: '600' },
});
