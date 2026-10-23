import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import paymentService from '../../services/paymentService';
import Colors from '../../constants/colors';

const money = (value) => `Gs. ${Number(value || 0).toLocaleString('es-PY')}`;
const STATUS = {
  pendiente: ['Pendientes', '#F1A92D', '#FFF5DF'], confirmado: ['Confirmados', '#3973D8', '#EAF1FF'],
  realizado: ['Realizados', '#28A478', '#E7F7F0'], cancelado: ['Cancelados', '#D06E76', '#FFF0F0'],
  reprogramado: ['Reprogramados', '#8A70CE', '#F1EDFF'],
};

function MiniBars({ rows, valueKey, dark = false }) {
  if (!rows?.length) return <Text style={[s.muted, dark && s.darkMuted]}>Todavía no hay datos para el período.</Text>;
  const max = Math.max(...rows.map((row) => Number(row[valueKey] || 0)), 1);
  return <View style={s.chart}>{rows.map((row) => {
    const value = Number(row[valueKey] || 0);
    return <View key={row.mes} style={s.barColumn}><Text style={[s.barValue, dark && s.darkMuted]}>{value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)}</Text><View style={[s.barTrack, dark && s.darkTrack]}><View style={[s.bar, { height: `${Math.max((value / max) * 100, 3)}%` }, dark && s.barDark]} /></View><Text style={[s.barLabel, dark && s.darkMuted]}>{String(row.mes).slice(5)}</Text></View>;
  })}</View>;
}

function Panel({ title, subtitle, children, style }) {
  return <View style={[s.panel, style]}><View style={s.panelHead}><Text style={s.panelTitle}>{title}</Text>{subtitle ? <Text style={s.panelSub}>{subtitle}</Text> : null}</View>{children}</View>;
}

export default function ReportsScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const desktop = width >= 980;
  const [summary, setSummary] = useState(null);
  const [odontologos, setOdontologos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadData = useCallback(async () => {
    try {
      const [report, doctors] = await Promise.all([paymentService.getAdminSummary(), paymentService.getSummaryByOdontologo()]);
      setSummary(report); setOdontologos(doctors);
    } catch { /* El panel muestra estados vacíos hasta que la API responda. */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { loadData(); }, [loadData]);
  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const metrics = summary?.metricas || {};
  const states = summary?.estadosTurno || [];
  const stateTotal = states.reduce((total, item) => total + Number(item.total || 0), 0);
  const today = new Date().toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}>
      <View style={s.header}><View style={{ flex: 1 }}><Text style={s.eyebrow}>DENTALIS · VISIÓN DE CLÍNICA</Text><Text style={s.title}>Dashboard general</Text><Text style={s.subtitle}>{today.charAt(0).toUpperCase() + today.slice(1)} · indicadores actualizados desde la base de datos</Text></View><TouchableOpacity style={s.headerAction} onPress={() => navigation.navigate('Agenda')}><Text style={s.headerActionText}>▣  Ver agenda</Text></TouchableOpacity></View>

      <View style={[s.kpis, desktop && s.kpisWide]}>
        {[
          ['Pacientes activos', metrics.pacientes ?? '—', '◉', '#EAF1FF', '#3569D3'],
          ['Turnos de hoy', metrics.turnos_hoy ?? '—', '▣', '#E7F7F0', '#208260'],
          ['Odontólogos', metrics.odontologos ?? '—', '♙', '#F1EDFF', '#7658C9'],
          ['Cobrado este mes', money(summary?.totales?.total_mes), '$', '#FFF5DF', '#B77B18'],
        ].map(([label, value, icon, bg, color]) => <View key={label} style={s.kpi}><View style={[s.kpiIcon, { backgroundColor: bg }]}><Text style={[s.kpiGlyph, { color }]}>{icon}</Text></View><Text style={s.kpiLabel}>{label}</Text><Text style={s.kpiValue}>{value}</Text></View>)}
      </View>

      <View style={[s.rowPanels, desktop && s.rowDesktop]}>
        <Panel title="Flujo de caja" subtitle="Cobros de los últimos seis meses" style={[s.cashPanel, desktop && s.cashPanelWide]}>
          <View style={s.cashTotal}><Text style={s.cashLabel}>TOTAL COBRADO ESTE MES</Text><Text style={s.cashValue}>{money(summary?.totales?.total_mes)}</Text><Text style={s.cashCaption}>{summary?.totales?.cantidad_pagos || 0} movimientos registrados</Text></View>
          <MiniBars rows={(summary?.porMes || []).slice(-6)} valueKey="total" dark />
        </Panel>
        <View style={[s.stackPanels, desktop && s.stackPanelsWide]}>
          <Panel title="Estado de turnos" subtitle="Actividad del último mes">
            {Object.entries(STATUS).map(([key, [label, color, bg]]) => {
              const count = Number(states.find((item) => item.estado === key)?.total || 0);
              const percent = stateTotal ? Math.round((count / stateTotal) * 100) : 0;
              return <View key={key} style={s.statusRow}><View style={[s.statusIcon, { backgroundColor: bg }]}><View style={[s.statusDot, { backgroundColor: color }]} /></View><Text style={s.statusName}>{label}</Text><View style={s.progressTrack}><View style={[s.progress, { width: `${percent}%`, backgroundColor: color }]} /></View><Text style={s.statusCount}>{count}</Text></View>;
            })}
            <View style={s.summaryFoot}><Text style={s.footLabel}>Turnos del mes</Text><Text style={s.footValue}>{metrics.turnos_mes ?? 0}</Text></View>
          </Panel>
          <Panel title="Equipo odontológico" subtitle="Cobros acumulados por profesional">
            {odontologos.slice(0, 4).map((item) => <View key={item.odontologo_id} style={s.doctorRow}><View style={s.doctorAvatar}><Text style={s.doctorInitial}>{item.odontologo_nombre?.[0] || 'O'}</Text></View><View style={{ flex: 1 }}><Text style={s.doctorName}>Dr/a. {item.odontologo_nombre}</Text><Text style={s.doctorMeta}>{item.total_pacientes} pacientes asignados</Text></View><Text style={s.doctorTotal}>{money(item.total_cobrado)}</Text></View>)}
            {!odontologos.length && <Text style={s.muted}>Aún no hay odontólogos registrados.</Text>}
          </Panel>
        </View>
      </View>

      <View style={[s.rowPanels, desktop && s.rowDesktop]}>
        <Panel title="Citas por mes" subtitle="Volumen de atención de los últimos seis meses" style={[s.equalPanel, desktop && s.equalPanelWide]}><MiniBars rows={(summary?.turnosPorMes || []).slice(-6)} valueKey="total" /><View style={s.legend}><View style={[s.legendDot, { backgroundColor: '#3973D8' }]} /><Text style={s.legendText}>Turnos programados</Text><View style={[s.legendDot, { backgroundColor: '#28A478' }]} /><Text style={s.legendText}>Incluye los realizados</Text></View></Panel>
        <Panel title="Próximas reservaciones" subtitle={`${metrics.proximos_turnos ?? 0} pendientes o confirmadas`} style={[s.equalPanel, desktop && s.equalPanelWide]}>
          {(summary?.proximosTurnos || []).slice(0, 5).map((item) => <View key={item.id} style={s.appointmentRow}><View style={s.datePill}><Text style={s.dateDay}>{String(item.fecha).slice(8, 10)}</Text><Text style={s.dateMonth}>{String(item.fecha).slice(5, 7)}</Text></View><View style={{ flex: 1 }}><Text style={s.appointmentPatient}>{item.paciente_nombre}</Text><Text style={s.appointmentMeta}>{item.odontologo_nombre} · {String(item.hora).slice(0, 5)}</Text></View><Text style={[s.appointmentState, item.estado === 'confirmado' && { color: '#208260', backgroundColor: '#E7F7F0' }]}>{item.estado}</Text></View>)}
          {!summary?.proximosTurnos?.length && <Text style={s.muted}>No hay turnos próximos registrados.</Text>}
        </Panel>
      </View>

      <View style={[s.rowPanels, desktop && s.rowDesktop]}>
        <Panel title="Tratamientos más frecuentes" subtitle="Planes registrados por el equipo" style={[s.equalPanel, desktop && s.equalPanelWide]}>
          {(summary?.topTratamientos || []).map((item, index) => <View key={item.nombre} style={s.topTreatment}><View style={s.rank}><Text style={s.rankText}>{index + 1}</Text></View><View style={{ flex: 1 }}><Text style={s.topName}>{item.nombre}</Text><Text style={s.topMeta}>{item.cantidad} tratamientos</Text></View><Text style={s.topValue}>{money(item.valor)}</Text></View>)}
          {!summary?.topTratamientos?.length && <Text style={s.muted}>Sin tratamientos cargados todavía.</Text>}
        </Panel>
        <Panel title="Métodos de pago" subtitle="Cobros registrados este mes" style={[s.equalPanel, desktop && s.equalPanelWide]}>
          {(summary?.porMetodo || []).map((item) => <View key={item.metodo} style={s.methodRow}><Text style={s.methodName}>{({ efectivo: 'Efectivo', tarjeta_debito: 'Tarjeta débito', tarjeta_credito: 'Tarjeta crédito', transferencia: 'Transferencia', obra_social: 'Obra social' })[item.metodo] || item.metodo}</Text><Text style={s.methodCount}>{item.cantidad} pagos</Text><Text style={s.methodTotal}>{money(item.total)}</Text></View>)}
          {!summary?.porMetodo?.length && <Text style={s.muted}>No hay cobros registrados este mes.</Text>}
          <View style={s.summaryFoot}><Text style={s.footLabel}>Tratamientos activos</Text><Text style={s.footValue}>{metrics.tratamientos_activos ?? 0}</Text></View>
        </Panel>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' }, centered: { flex: 1, alignItems: 'center', justifyContent: 'center' }, content: { padding: 20, paddingBottom: 44, maxWidth: 1500, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }, eyebrow: { color: '#8090A7', fontSize: 9, fontWeight: '800', letterSpacing: 1.3 }, title: { color: '#233452', fontSize: 23, fontWeight: '800', marginTop: 4 }, subtitle: { color: '#8390A5', fontSize: 10, marginTop: 5 }, headerAction: { backgroundColor: '#2D60D6', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10 }, headerActionText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 13 }, kpisWide: { flexWrap: 'nowrap' }, kpi: { flex: 1, minWidth: 145, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E8EDF4', padding: 13 }, kpiIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 9 }, kpiGlyph: { fontSize: 15, fontWeight: '800' }, kpiLabel: { color: '#8794A8', fontSize: 9, fontWeight: '600' }, kpiValue: { color: '#263653', fontSize: 17, fontWeight: '800', marginTop: 4 },
  rowPanels: { gap: 12, marginBottom: 12 }, rowDesktop: { flexDirection: 'row', alignItems: 'stretch' }, panel: { backgroundColor: '#fff', borderColor: '#E8EDF4', borderWidth: 1, borderRadius: 13, padding: 15 }, panelHead: { marginBottom: 12 }, panelTitle: { color: '#2E3E59', fontSize: 12, fontWeight: '800' }, panelSub: { color: '#8D99AC', fontSize: 9, marginTop: 4 }, cashPanel: { backgroundColor: '#22365A', borderColor: '#22365A' }, cashPanelWide: { flex: 1.15 }, stackPanels: { gap: 12 }, stackPanelsWide: { flex: 1 }, equalPanel: { flex: 1 }, equalPanelWide: { minWidth: 0 }, cashTotal: { marginBottom: 9 }, cashLabel: { color: '#BBC9E0', fontSize: 8, letterSpacing: 1, fontWeight: '800' }, cashValue: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 4 }, cashCaption: { color: '#B3C2DA', fontSize: 9, marginTop: 3 },
  chart: { height: 117, flexDirection: 'row', alignItems: 'stretch', gap: 8, paddingTop: 4 }, barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 }, barValue: { color: '#8C99AD', fontSize: 8, minHeight: 10 }, barTrack: { height: 77, width: '70%', justifyContent: 'flex-end', backgroundColor: '#F0F3F8', borderRadius: 5, overflow: 'hidden' }, darkTrack: { backgroundColor: '#30466B' }, bar: { width: '100%', backgroundColor: '#3973D8', borderTopLeftRadius: 5, borderTopRightRadius: 5 }, barDark: { backgroundColor: '#7EA8FF' }, barLabel: { color: '#8C99AD', fontSize: 8 }, muted: { color: '#8C99AD', fontSize: 10, textAlign: 'center', paddingVertical: 15 }, darkMuted: { color: '#B9C7DC' },
  statusRow: { minHeight: 33, flexDirection: 'row', alignItems: 'center', gap: 7 }, statusIcon: { width: 18, height: 18, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }, statusDot: { width: 6, height: 6, borderRadius: 3 }, statusName: { color: '#53627A', fontSize: 9, width: 74 }, progressTrack: { flex: 1, height: 5, backgroundColor: '#EDF1F6', borderRadius: 4, overflow: 'hidden' }, progress: { height: '100%', borderRadius: 4 }, statusCount: { color: '#64738B', fontSize: 9, width: 20, textAlign: 'right', fontWeight: '700' }, summaryFoot: { borderTopWidth: 1, borderTopColor: '#EEF1F5', paddingTop: 9, marginTop: 9, flexDirection: 'row', justifyContent: 'space-between' }, footLabel: { color: '#8491A5', fontSize: 9 }, footValue: { color: '#354561', fontSize: 10, fontWeight: '800' },
  doctorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#F0F2F6' }, doctorAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#EAF1FF', justifyContent: 'center', alignItems: 'center' }, doctorInitial: { color: '#3968CD', fontSize: 10, fontWeight: '800' }, doctorName: { color: '#475772', fontSize: 9, fontWeight: '700' }, doctorMeta: { color: '#97A2B3', fontSize: 8, marginTop: 2 }, doctorTotal: { color: '#26835F', fontSize: 9, fontWeight: '800' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }, legendDot: { width: 7, height: 7, borderRadius: 4 }, legendText: { color: '#8794A8', fontSize: 8 }, appointmentRow: { minHeight: 43, flexDirection: 'row', alignItems: 'center', gap: 9, borderTopWidth: 1, borderTopColor: '#F0F2F6', paddingVertical: 5 }, datePill: { width: 31, height: 34, borderRadius: 8, backgroundColor: '#EEF3FE', alignItems: 'center', justifyContent: 'center' }, dateDay: { color: '#3569D3', fontSize: 11, fontWeight: '800' }, dateMonth: { color: '#6D86B5', fontSize: 7 }, appointmentPatient: { color: '#43516A', fontSize: 9, fontWeight: '700' }, appointmentMeta: { color: '#8C99AC', fontSize: 8, marginTop: 3 }, appointmentState: { color: '#A97620', backgroundColor: '#FFF5DF', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 4, fontSize: 7, overflow: 'hidden' },
  topTreatment: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: '#F0F2F6', paddingVertical: 8 }, rank: { width: 21, height: 21, borderRadius: 7, backgroundColor: '#F0F4FC', alignItems: 'center', justifyContent: 'center' }, rankText: { color: '#4772CA', fontSize: 9, fontWeight: '800' }, topName: { color: '#475772', fontSize: 9, fontWeight: '700' }, topMeta: { color: '#97A2B3', fontSize: 8, marginTop: 3 }, topValue: { color: '#30815F', fontSize: 8, fontWeight: '800' }, methodRow: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F0F2F6' }, methodName: { flex: 1, color: '#53627A', fontSize: 9 }, methodCount: { color: '#8D99AC', fontSize: 8 }, methodTotal: { color: '#2F815F', fontSize: 9, fontWeight: '800' },
});
