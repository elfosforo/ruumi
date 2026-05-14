import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView } from 'react-native';
import { useTheme } from '../styles/ThemeContext';
import { getExpenses, getRoomies, Expense, Roomie } from '../services/storageService';
import { Ionicons } from '@expo/vector-icons';
import { BrutalPressable } from '../components/BrutalPressable';

export const SummaryScreen = () => {
  const { colors, spacing, theme } = useTheme();
  const [roomieSummaries, setRoomieSummaries] = useState<any[]>([]);

  const calculateBalances = async () => {
    const roomies = await getRoomies();
    
    const summaries = roomies.map(roomie => {
      const contributed = roomie.totalContributed || 0;
      const responsibility = roomie.totalResponsibilities || 0;
      const netStatus = Math.round(contributed - responsibility);

      return {
        roomie,
        contributed: Math.round(contributed),
        responsibility: Math.round(responsibility),
        netStatus
      };
    });

    setRoomieSummaries(summaries);
  };

  useEffect(() => {
    calculateBalances();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { padding: spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme === 'day' ? '#000' : colors.primary }]}>RESUMEN</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>BALANCE GENERAL POR ROOMIE</Text>

        <View style={styles.list}>
          {roomieSummaries.map(({ roomie, contributed, responsibility, netStatus }) => {
            const isSettled = Math.abs(netStatus) < 10; // Threshold for rounding issues
            const isPositive = netStatus > 10;
            const isNegative = netStatus < -10;

            return (
              <View 
                key={roomie.id} 
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: roomie.color }]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.name, { color: colors.text }]}>{roomie.name.toUpperCase()}</Text>
                  <View style={[styles.statusBadge, { 
                    backgroundColor: isSettled ? 'rgba(76, 175, 80, 0.1)' : (isPositive ? 'rgba(0, 212, 255, 0.1)' : 'rgba(255, 0, 102, 0.1)') 
                  }]}>
                    <Text style={[styles.statusText, { color: isSettled ? '#4CAF50' : (isPositive ? colors.accent : colors.secondary) }]}>
                      {isSettled ? 'AL DÍA' : (isPositive ? 'CRÉDITO' : 'DEUDA')}
                    </Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>HAS APORTADO</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>${contributed.toLocaleString('es-CL')}</Text>
                  </View>
                  <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.stat}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TU CUOTA TOTAL</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>${responsibility.toLocaleString('es-CL')}</Text>
                  </View>
                </View>

                <View style={[styles.netContainer, { backgroundColor: isSettled ? 'transparent' : 'rgba(0,0,0,0.05)' }]}>
                  <Text style={[styles.netLabel, { color: colors.textSecondary }]}>ESTADO FINAL:</Text>
                  <Text style={[styles.netAmount, { color: isSettled ? '#4CAF50' : (isPositive ? colors.accent : colors.secondary) }]}>
                    {isSettled ? '$0' : (isPositive ? `+$${netStatus.toLocaleString('es-CL')}` : `-$${Math.abs(netStatus).toLocaleString('es-CL')}`)}
                  </Text>
                </View>

                {isSettled && (
                  <View style={styles.settledCheck}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.settledText}>No tienes cuentas pendientes</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 40 },
  title: { fontSize: 36, fontWeight: '900' },
  subtitle: { fontSize: 12, fontWeight: '800', marginBottom: 30 },
  list: { gap: 20 },
  card: { borderRadius: 24, padding: 20, borderWidth: 3, borderLeftWidth: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  name: { fontSize: 22, fontWeight: '900' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '900' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 5 },
  stat: { flex: 1 },
  statLabel: { fontSize: 8, fontWeight: '900', marginBottom: 5 },
  statValue: { fontSize: 16, fontWeight: '900' },
  verticalDivider: { width: 2, height: '80%', alignSelf: 'center', marginHorizontal: 15, opacity: 0.3 },
  netContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12 },
  netLabel: { fontSize: 12, fontWeight: '900' },
  netAmount: { fontSize: 28, fontWeight: '900' },
  settledCheck: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, justifyContent: 'center' },
  settledText: { fontSize: 10, fontWeight: '700', color: '#4CAF50' }
});
