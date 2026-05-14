import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, RefreshControl, Animated, PanResponder, Alert, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../styles/ThemeContext';
import { getExpenses, getRoomies, deleteExpense, Expense, Roomie, CATEGORIES } from '../services/storageService';
import { generateReport } from '../services/pdfService';
import { BrutalPressable } from '../components/BrutalPressable';
import { BrutalButton } from '../components/BrutalButton';

export const DashboardScreen = ({ navigation }: any) => {
  const { colors, spacing, theme } = useTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [roomies, setRoomies] = useState<Roomie[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

  const loadData = async () => {
    setRefreshing(true);
    const [storedExpenses, storedRoomies] = await Promise.all([
      getExpenses(),
      getRoomies()
    ]);
    setExpenses(storedExpenses);
    setRoomies(storedRoomies);
    setRefreshing(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  // Filter expenses by selected month
  const filteredExpenses = expenses.filter(exp => {
    if (!exp.date) return false;
    // Support both / and - as separators
    const parts = exp.date.split(/[/-]/).map(Number);
    if (parts.length < 3) return false;
    
    const [day, month, year] = parts;
    return (month - 1) === currentDate.getMonth() && year === currentDate.getFullYear();
  });

  // SMART CALCULATION: Total house debt (Total Amount - Abonos already made)
  const totalExternalDebt = filteredExpenses.reduce((acc, exp) => {
    if (exp.isPaidToProvider) return acc;
    const paidSoFar = exp.payments.reduce((sum, p) => sum + p.amount, 0);
    return acc + (exp.amount - paidSoFar);
  }, 0);

  const totalInternalDebt = roomies.reduce((acc, r) => {
    const balance = (r.totalContributed || 0) - (r.totalResponsibilities || 0);
    return balance < 0 ? acc + Math.abs(balance) : acc;
  }, 0);

  // PERIOD SETTLEMENT LOGIC
  const calculatePeriodStatus = () => {
    const status: { [id: string]: { aportado: number, responsabilidad: number, balance: number } } = {};
    roomies.forEach(r => status[r.id] = { aportado: 0, responsabilidad: 0, balance: 0 });

    filteredExpenses.forEach(exp => {
      // 1. Calculate Responsibilities for this month (ALWAYS)
      if (exp.splitMode === 'custom' && exp.customSplit) {
        roomies.forEach(r => {
          const percentage = exp.customSplit?.[r.id] || 0;
          status[r.id].responsabilidad += (exp.amount * percentage) / 100;
        });
      } else {
        const equalShare = exp.amount / roomies.length;
        roomies.forEach(r => status[r.id].responsabilidad += equalShare);
      }

      // 2. Calculate Aportes (Only IF paid to provider)
      if (exp.isPaidToProvider) {
        if (status[exp.paidBy]) status[exp.paidBy].aportado += exp.amount;
      }
    });

    // 3. Final Monthly Balance
    roomies.forEach(r => {
      status[r.id].balance = status[r.id].aportado - status[r.id].responsabilidad;
    });

    return status;
  };

  const getRoomieName = (id: string) => {
    return roomies.find(r => r.id === id)?.name || 'Alguien';
  };

  const getRoomieColor = (id: string) => {
    return roomies.find(r => r.id === id)?.color || colors.accent;
  };

  const cardBg = theme === 'day' ? colors.accent : colors.primary;
  const cardText = '#000';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { padding: spacing.md }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme === 'day' ? '#000' : colors.primary }]}>RUUMI</Text>
          <BrutalPressable 
            onPress={() => navigation.navigate('PERFIL')}
            style={styles.avatarWrapper}
            contentStyle={[styles.avatar, { backgroundColor: colors.accent, borderColor: colors.border }]}
          >
            <Text style={styles.avatarText}>JD</Text>
          </BrutalPressable>
        </View>

        <View style={[styles.mainCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
          <View style={styles.monthSelectorContainer}>
            <View style={styles.monthSelector}>
              <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
                <Ionicons name="chevron-back" size={24} color={cardText} />
              </TouchableOpacity>
              <View style={styles.monthLabelContainer}>
                <Text style={[styles.monthLabel, { color: cardText }]}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</Text>
                {currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear() && (
                  <View style={[styles.todayBadge, { backgroundColor: cardText }]}>
                    <Text style={[styles.todayBadgeText, { color: cardBg }]}>HOY</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
                <Ionicons name="chevron-forward" size={24} color={cardText} />
              </TouchableOpacity>
            </View>

            {(currentDate.getMonth() !== new Date().getMonth() || currentDate.getFullYear() !== new Date().getFullYear()) && (
              <TouchableOpacity 
                style={[styles.backToToday, { borderColor: cardText }]}
                onPress={() => setCurrentDate(new Date())}
              >
                <Ionicons name="return-down-back" size={12} color={cardText} />
                <Text style={[styles.backToTodayText, { color: cardText }]}>VOLVER AL MES ACTUAL</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryCol}>
              <Text style={[styles.cardSmallTitle, { color: cardText }]}>POR PAGAR (MES)</Text>
              <Text style={[styles.cardAmount, { color: cardText, fontSize: 22 }]}>${totalExternalDebt.toLocaleString('es-CL')}</Text>
              <Text style={[styles.cardSubLabel, { color: cardText, opacity: 0.7 }]}>A PROVEEDORES</Text>
            </View>
            <View style={[styles.verticalDivider, { backgroundColor: cardText, height: '60%', alignSelf: 'center', opacity: 0.2 }]} />
            <View style={styles.summaryCol}>
              <Text style={[styles.cardSmallTitle, { color: cardText }]}>DEUDA TOTAL</Text>
              <Text style={[styles.cardAmount, { color: cardText, fontSize: 22 }]}>${totalInternalDebt.toLocaleString('es-CL')}</Text>
              <Text style={[styles.cardSubLabel, { color: cardText, opacity: 0.7 }]}>ESTADO ROOMIES</Text>
            </View>
          </View>
          
          <View style={[styles.mainCardDivider, { backgroundColor: 'rgba(0,0,0,0.1)' }]} />
          
          <View style={styles.mainCardFooter}>
            <TouchableOpacity 
              style={[styles.pdfButton, { borderColor: cardText }]}
              onPress={() => {
                const periodStatus = calculatePeriodStatus();
                // Map the results back to an array for the PDF service
                const periodRoomies = roomies.map(r => ({
                  ...r,
                  balance: periodStatus[r.id]?.balance || 0, // Using the MONTHLY balance for the settlement algorithm
                  totalContributed: periodStatus[r.id]?.aportado || 0,
                  totalResponsibilities: periodStatus[r.id]?.responsabilidad || 0,
                  historicalBalance: r.balance // Pass historical for reference
                }));
                generateReport(filteredExpenses, periodRoomies, `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`);
              }}
            >
              <Ionicons name="document-text" size={18} color={cardText} />
              <Text style={[styles.pdfButtonText, { color: cardText }]}>EXPORTAR PDF</Text>
            </TouchableOpacity>

            <BrutalPressable 
              onPress={() => navigation.navigate('GASTOS', { editExpense: undefined })}
              contentStyle={[styles.mainActionBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            >
              <Text style={styles.mainActionText}>NUEVO GASTO</Text>
            </BrutalPressable>
          </View>
        </View>

        <View style={styles.liquidityHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>MONITOR DE LIQUIDEZ</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>HISTÓRICO ACUMULADO</Text>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.carousel}
          contentContainerStyle={styles.carouselContent}
        >
          {roomies.map(r => {
            const usedCredit = r.creditLimit - r.currentCredit;
            const creditUsagePerc = (usedCredit / r.creditLimit) * 100;
            const isNegative = r.balance < 0;

            return (
              <View key={r.id} style={[styles.roomieCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.roomieCardHeader}>
                  <View style={[styles.miniAvatar, { backgroundColor: r.color }]}>
                    <Text style={styles.miniAvatarText}>{r.name.substring(0, 2).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={[styles.roomieCardName, { color: colors.text }]}>{r.name.toUpperCase()}</Text>
                    <Text style={[styles.roomieCardStatus, { color: isNegative ? colors.secondary : '#4CAF50' }]}>
                      {isNegative ? 'EN DEUDA' : r.balance > 0 ? 'ACREEDOR' : 'AL DÍA'}
                    </Text>
                  </View>
                </View>

                <View style={styles.creditInfo}>
                  <View style={styles.creditLabels}>
                    <Text style={[styles.creditLabel, { color: colors.textSecondary }]}>APORTADO (EFECTIVO)</Text>
                    <Text style={[styles.creditValue, { color: colors.text }]}>${(r.totalContributed || 0).toLocaleString('es-CL')}</Text>
                  </View>
                  <View style={[styles.progressBarBg, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
                    <View style={[styles.progressBarFill, { width: `${Math.min(creditUsagePerc || 0, 100)}%`, backgroundColor: r.color }]} />
                  </View>
                </View>

                <View style={styles.balanceInfo}>
                  <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>SALDO NETO</Text>
                  <Text style={[styles.balanceValue, { color: isNegative ? colors.secondary : '#4CAF50' }]}>
                    {isNegative ? '-' : '+'}${(Math.abs(r.balance || 0)).toLocaleString('es-CL')}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <Text style={[styles.sectionTitlePink, { color: colors.secondary }]}>ACTIVIDAD RECIENTE</Text>
        
        <View style={styles.listContainer}>
          {filteredExpenses.map((expense) => (
            <SwipeableExpenseItem 
              key={expense.id}
              expense={expense}
              roomies={roomies}
              onDelete={loadData}
              onConfirmDelete={(id: string) => {
                setDeletingExpenseId(id);
                setShowDeleteModal(true);
              }}
              onEdit={() => navigation.navigate('MainTabs', { 
                screen: 'GASTOS', 
                params: { editExpense: expense } 
              })}
              onDetail={() => navigation.navigate('ExpenseDetail', { expenseId: expense.id })}
            />
          ))}
        </View>
      </ScrollView>

      {/* Global Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.secondary }]}>
            <Ionicons name="warning-outline" size={50} color={colors.secondary} style={{ alignSelf: 'center', marginBottom: 20 }} />
            <Text style={[styles.modalTitle, { color: colors.text, textAlign: 'center' }]}>¿ELIMINAR GASTO?</Text>
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 30, fontWeight: '600' }}>
              Esta acción no se puede deshacer y ajustará los saldos de todos los roomies.
            </Text>
            
            <View style={{ gap: 10 }}>
              <BrutalButton 
                title="SÍ, ELIMINAR" 
                onPress={async () => {
                  if (deletingExpenseId) {
                    await deleteExpense(deletingExpenseId);
                    setShowDeleteModal(false);
                    setDeletingExpenseId(null);
                    loadData();
                  }
                }} 
                color={colors.secondary} 
              />
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
  scrollContent: { paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 36, fontWeight: '900' },
  avatarWrapper: { width: 44, height: 44 },
  avatar: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  avatarText: { color: '#000', fontWeight: '900', fontSize: 16 },
  mainCard: { borderWidth: 3, padding: 20, marginBottom: 30 },
  cardSmallTitle: { fontWeight: '800', fontSize: 14 },
  cardAmount: { fontSize: 42, fontWeight: '900', marginVertical: 5 },
  mainCardDivider: { height: 2, marginVertical: 12 },
  mainCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerRow: { flexDirection: 'row', alignItems: 'center' },
  footerLabel: { fontWeight: '800', fontSize: 10, lineHeight: 12 },
  verticalDivider: { width: 2, height: 24, marginHorizontal: 10 },
  footerValue: { fontWeight: '900', fontSize: 20 },
  mainActionBtn: { height: 40, paddingHorizontal: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  mainActionText: { color: '#000', fontWeight: '900', fontSize: 12 },
  sectionTitlePink: { fontSize: 18, fontWeight: '900', marginBottom: 15 },
  listContainer: { marginBottom: 20 },
  expensePressable: { marginBottom: 15 },
  listItem: { flexDirection: 'row', overflow: 'hidden', borderWidth: 2 },
  iconSquare: { width: 80, justifyContent: 'center', alignItems: 'center', borderRightWidth: 2 },
  listContent: { flex: 1, padding: 12 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listTitle: { fontWeight: '900', fontSize: 13, flex: 1 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { fontSize: 8, fontWeight: '900', color: '#000' },
  listAmount: { fontWeight: '900', fontSize: 24, marginVertical: 2 },
  listTotalOriginal: { fontSize: 14, color: '#888', fontWeight: '700' },
  listPayer: { fontWeight: '700', fontSize: 10 },
  listDetailLink: { fontWeight: '900', fontSize: 10, textDecorationLine: 'underline' },
  liquidityHeader: { marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  sectionSubtitle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  carousel: { marginHorizontal: -20, marginBottom: 30 },
  carouselContent: { paddingHorizontal: 20, gap: 15 },
  roomieCard: { width: 180, padding: 15, borderWidth: 3, gap: 12 },
  roomieCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#000' },
  miniAvatarText: { fontSize: 10, fontWeight: '900', color: '#000' },
  roomieCardName: { fontSize: 12, fontWeight: '900' },
  roomieCardStatus: { fontSize: 8, fontWeight: '800' },
  creditInfo: { gap: 6 },
  creditLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  creditLabel: { fontSize: 8, fontWeight: '900' },
  creditValue: { fontSize: 10, fontWeight: '900' },
  progressBarBg: { height: 6, borderWidth: 1, borderColor: '#000' },
  progressBarFill: { height: '100%' },
  balanceInfo: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)', paddingTop: 8 },
  balanceLabel: { fontSize: 8, fontWeight: '900' },
  balanceValue: { fontSize: 14, fontWeight: '900' },
  swipeContainer: { marginBottom: 15, position: 'relative' },
  actionsContainer: { position: 'absolute', right: 0, top: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', paddingRight: 5, gap: 8 },
  actionBtn: { width: 70, height: '90%', justifyContent: 'center', alignItems: 'center', borderWidth: 2, shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 },
  actionBtnText: { fontSize: 8, fontWeight: '900', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 30, borderWidth: 4 },
  modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 25 },
  modalCancel: { alignItems: 'center', marginTop: 15 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  summaryCol: { flex: 1, alignItems: 'center' },
  cardSubLabel: { fontSize: 8, fontWeight: '900', marginTop: 2 },
  monthSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)', padding: 10, borderRadius: 12 },
  monthLabel: { fontSize: 18, fontWeight: '900' },
  monthSelectorContainer: { marginBottom: 20 },
  monthLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  todayBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  todayBadgeText: { fontSize: 8, fontWeight: '900' },
  backToToday: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 8, paddingVertical: 4, borderBottomWidth: 1, alignSelf: 'center' },
  backToTodayText: { fontSize: 9, fontWeight: '800' },
  pdfButton: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 2, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  pdfButtonText: { fontSize: 10, fontWeight: '900' }
});

const SwipeableExpenseItem = ({ expense, roomies, onDelete, onEdit, onDetail, onConfirmDelete }: any) => {
  const { colors } = useTheme();
  const translateX = React.useRef(new Animated.Value(0)).current;
  const SWIPE_THRESHOLD = -150;

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD / 2) {
          Animated.spring(translateX, { toValue: SWIPE_THRESHOLD, useNativeDriver: true }).start();
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const internalPaid = expense.payments.reduce((a: any, c: any) => a + c.amount, 0);
  const isPaidFull = internalPaid >= expense.amount;
  const payer = roomies.find((r: any) => r.id === expense.paidBy);
  const category = CATEGORIES.find(c => c.id === expense.category) || CATEGORIES[CATEGORIES.length - 1];

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
            onEdit();
          }}
        >
          <Ionicons name="create-outline" size={20} color={colors.text} />
          <Text style={[styles.actionBtnText, { color: colors.text }]}>EDITAR</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          onPress={() => {
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
            onConfirmDelete(expense.id);
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#000" />
          <Text style={[styles.actionBtnText, { color: '#000' }]}>ELIMINAR</Text>
        </TouchableOpacity>
      </View>

      <Animated.View 
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <BrutalPressable 
          onPress={onDetail}
          contentStyle={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }, isPaidFull && { opacity: 0.5 }]}
        >
          <View style={[styles.iconSquare, { backgroundColor: expense.color || colors.accent, borderColor: colors.border }]}>
            <Ionicons name={category.icon as any} size={32} color="#000" />
          </View>
          <View style={styles.listContent}>
            <View style={styles.listRow}>
              <Text style={[styles.listTitle, { color: colors.text }]}>{expense.title.toUpperCase()}</Text>
              {isPaidFull ? (
                <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}><Text style={styles.statusText}>PAGADO</Text></View>
              ) : (
                expense.isPaidToProvider && <View style={[styles.statusBadge, { backgroundColor: colors.accent }]}><Text style={styles.statusText}>AL ROOMIE</Text></View>
              )}
            </View>
            <Text style={[styles.listAmount, { color: colors.text }]}>
              ${(expense.amount - internalPaid).toLocaleString('es-CL')}
              <Text style={styles.listTotalOriginal}> / ${expense.amount.toLocaleString('es-CL')}</Text>
            </Text>
            <View style={styles.listRow}>
              <Text style={[styles.listPayer, { color: colors.textSecondary }]}>
                {expense.isPaidToProvider ? `A favor de: ${payer?.name || '...'}` : 'Pendiente Proveedor'}
              </Text>
              <Text style={[styles.listDetailLink, { color: colors.text }]}>DETALLE</Text>
            </View>
          </View>
        </BrutalPressable>
      </Animated.View>
    </View>
  );
};
