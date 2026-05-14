import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import { useTheme } from '../styles/ThemeContext';
import { getExpenses, getRoomies, addPaymentToExpense, deleteExpense, Expense, Roomie, Payment } from '../services/storageService';
import { Ionicons } from '@expo/vector-icons';
import { BrutalButton } from '../components/BrutalButton';
import { BrutalPressable } from '../components/BrutalPressable';

export const ExpenseDetailScreen = ({ route, navigation }: any) => {
  const { expenseId } = route.params;
  const { colors, spacing, theme } = useTheme();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [roomies, setRoomies] = useState<Roomie[]>([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [selectedPayer, setSelectedPayer] = useState('');

  const loadData = async () => {
    const [expenses, storedRoomies] = await Promise.all([getExpenses(), getRoomies()]);
    const found = expenses.find(e => e.id === expenseId);
    if (found) {
      setExpense(found);
      setRoomies(storedRoomies);
      if (storedRoomies.length > 0) setSelectedPayer(storedRoomies[0].id);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const handleAddPayment = async () => {
    if (!payAmount || !selectedPayer) return;
    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Monto no válido');
      return;
    }
    // The storageService.ts signature is (expenseId, payment)
    await addPaymentToExpense(expenseId, {
      id: Date.now().toString(),
      from: selectedPayer,
      amount: amountNum,
      date: new Date().toLocaleDateString('es-CL'),
    });
    setPayAmount('');
    setShowPayModal(false);
    loadData();
  };

  const handleDelete = async () => {
    await deleteExpense(expenseId);
    setShowDeleteModal(false);
    navigation.navigate('MainTabs', { screen: 'HOME' });
  };

  if (!expense) return null;

  const totalPaid = expense.payments.reduce((acc, p) => acc + p.amount, 0);
  const remaining = expense.amount - totalPaid;
  const payerName = roomies.find(r => r.id === expense.paidBy)?.name || 'Alguien';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={[styles.content, { padding: spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={32} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>DETALLE DE GASTO</Text>
        </View>

        <View style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.category, { color: colors.accent }]}>BOLETA OFICIAL</Text>
          <Text style={[styles.title, { color: colors.text }]}>{expense.title.toUpperCase()}</Text>
          
          <View style={styles.amountSection}>
            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>TOTAL DE LA CUENTA</Text>
            <Text style={[styles.amountValue, { color: colors.text }]}>${expense.amount.toLocaleString('es-CL')}</Text>
          </View>

          <View style={[styles.statusBox, { backgroundColor: expense.isPaidToProvider ? colors.accent + '22' : colors.secondary + '22' }]}>
            <Ionicons name={expense.isPaidToProvider ? "checkmark-circle" : "warning"} size={20} color={expense.isPaidToProvider ? colors.accent : colors.secondary} />
            <Text style={[styles.statusText, { color: expense.isPaidToProvider ? colors.accent : colors.secondary }]}>
              {expense.isPaidToProvider ? `PAGADO POR: ${payerName.toUpperCase()}` : 'DEUDA PENDIENTE AL PROVEEDOR'}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ABONADO</Text>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>${totalPaid.toLocaleString('es-CL')}</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>FALTANTE</Text>
            <Text style={[styles.statValue, { color: colors.secondary }]}>${remaining.toLocaleString('es-CL')}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>HISTORIAL DE ABONOS</Text>
        <View style={styles.paymentsList}>
          {expense.payments.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aún no hay abonos registrados.</Text>
          ) : (
            expense.payments.map((p) => (
              <View key={p.id} style={[styles.paymentItem, { borderBottomColor: colors.border }]}>
                <View style={styles.paymentInfo}>
                  <Text style={[styles.paymentUser, { color: colors.text }]}>{roomies.find(r => r.id === p.from)?.name || '...'}</Text>
                  <Text style={[styles.paymentDate, { color: colors.textSecondary }]}>{p.date}</Text>
                </View>
                <Text style={[styles.paymentAmount, { color: colors.text }]}>+ ${p.amount.toLocaleString('es-CL')}</Text>
              </View>
            ))
          )}
        </View>

        {remaining > 0 && (
          <BrutalButton title="REGISTRAR NUEVO ABONO" onPress={() => setShowPayModal(true)} color={colors.primary} />
        )}

        <View style={[styles.dangerZone, { borderTopColor: colors.border }]}>
          <Text style={[styles.dangerTitle, { color: colors.textSecondary }]}>ZONA DE GESTIÓN</Text>
          <View style={styles.dangerRow}>
            <BrutalPressable 
              onPress={() => navigation.navigate('MainTabs', { 
                screen: 'GASTOS', 
                params: { editExpense: expense } 
              })}
              contentStyle={[styles.editBtnContent, { backgroundColor: colors.card }]}
            >
              <Ionicons name="create-outline" size={20} color={colors.text} />
              <Text style={[styles.editBtnText, { color: colors.text }]}>EDITAR</Text>
            </BrutalPressable>
            
            <BrutalPressable 
              onPress={() => setShowDeleteModal(true)}
              style={{ flex: 1 }}
              contentStyle={[styles.deleteBtnContent, { backgroundColor: colors.secondary }]}
            >
              <Ionicons name="trash-outline" size={20} color={theme === 'day' ? '#FFF' : '#000'} />
              <Text style={[styles.deleteBtnText, { color: theme === 'day' ? '#FFF' : '#000' }]}>ELIMINAR</Text>
            </BrutalPressable>
          </View>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Pay Modal */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>REGISTRAR ABONO</Text>
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>¿QUIÉN PAGA?</Text>
            <ScrollView horizontal style={styles.payerSelector}>
              {roomies.map(r => (
                <TouchableOpacity key={r.id} onPress={() => setSelectedPayer(r.id)} style={[styles.payerChip, { borderColor: colors.border }, selectedPayer === r.id && { backgroundColor: r.color }]}>
                  <Text style={[styles.payerText, { color: selectedPayer === r.id ? '#000' : colors.text }]}>{r.name.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[styles.modalLabel, { color: colors.textSecondary, marginTop: 20 }]}>MONTO ($)</Text>
            <TextInput style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} keyboardType="numeric" value={payAmount} onChangeText={setPayAmount} />
            <BrutalButton title="CONFIRMAR" onPress={handleAddPayment} color={colors.accent} />
            <TouchableOpacity onPress={() => setShowPayModal(false)} style={styles.modalCancel}><Text style={{ color: colors.textSecondary, fontWeight: '800' }}>CANCELAR</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.secondary }]}>
            <Ionicons name="warning-outline" size={50} color={colors.secondary} style={{ alignSelf: 'center', marginBottom: 20 }} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>¿ELIMINAR BOLETA?</Text>
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 30, fontWeight: '600' }}>
              Esta acción borrará el gasto permanentemente y restaurará los balances.
            </Text>
            
            <View style={{ gap: 10 }}>
              <BrutalButton title="SÍ, ELIMINAR" onPress={handleDelete} color={colors.secondary} />
              <TouchableOpacity onPress={() => setShowDeleteModal(false)} style={styles.modalCancel}>
                <Text style={{ color: colors.textSecondary, fontWeight: '800' }}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 30 },
  headerTitle: { fontSize: 14, fontWeight: '900' },
  mainCard: { padding: 25, borderWidth: 3, marginBottom: 20 },
  category: { fontSize: 10, fontWeight: '900', marginBottom: 5 },
  title: { fontSize: 32, fontWeight: '900', marginBottom: 15 },
  amountSection: { marginBottom: 25 },
  amountLabel: { fontSize: 10, fontWeight: '900', marginBottom: 5 },
  amountValue: { fontSize: 42, fontWeight: '900', letterSpacing: -1 },
  statusBox: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  statusText: { fontSize: 10, fontWeight: '900' },
  statsRow: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  statItem: { flex: 1, padding: 15, borderWidth: 3 },
  statLabel: { fontSize: 10, fontWeight: '900', marginBottom: 5 },
  statValue: { fontSize: 20, fontWeight: '900' },
  sectionTitle: { fontSize: 14, fontWeight: '900', marginBottom: 15 },
  paymentsList: { marginBottom: 30 },
  emptyText: { fontStyle: 'italic', fontSize: 14 },
  paymentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
  paymentInfo: { gap: 2 },
  paymentUser: { fontWeight: '900', fontSize: 14 },
  paymentDate: { fontSize: 10, fontWeight: '600' },
  paymentAmount: { fontWeight: '900', fontSize: 16 },
  dangerZone: { marginTop: 40, borderTopWidth: 2, paddingTop: 30 },
  dangerTitle: { fontSize: 12, fontWeight: '900', marginBottom: 15 },
  dangerRow: { flexDirection: 'row', gap: 10 },
  editBtnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, gap: 8 },
  editBtnText: { fontWeight: '900', fontSize: 14 },
  deleteBtnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, gap: 8 },
  deleteBtnText: { fontWeight: '900', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 30, borderWidth: 4 },
  modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 25, textAlign: 'center' },
  modalLabel: { fontSize: 10, fontWeight: '900', marginBottom: 10 },
  payerSelector: { flexDirection: 'row', marginBottom: 10 },
  payerChip: { paddingHorizontal: 15, paddingVertical: 8, borderWidth: 2, marginRight: 8 },
  payerText: { fontSize: 12, fontWeight: '900' },
  modalInput: { padding: 15, fontSize: 24, fontWeight: '900', borderWidth: 2, marginBottom: 30 },
  modalCancel: { alignItems: 'center', marginTop: 15 }
});
