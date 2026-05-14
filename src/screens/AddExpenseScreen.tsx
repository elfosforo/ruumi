import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, SafeAreaView, TouchableOpacity, Alert, Switch } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../styles/ThemeContext';
import { getRoomies, saveExpense, Roomie, Expense, Payment, CATEGORIES, getCategoryStyle, saveCategoryStyle } from '../services/storageService';
import { BrutalButton } from '../components/BrutalButton';
import { Ionicons } from '@expo/vector-icons';

export const AddExpenseScreen = ({ navigation, route }: any) => {
  const editExpense = route.params?.editExpense as Expense | undefined;
  
  const { colors, spacing, theme } = useTheme();
  const [title, setTitle] = useState(editExpense?.title || '');
  const [amount, setAmount] = useState(editExpense?.amount.toString() || '');
  const [roomies, setRoomies] = useState<Roomie[]>([]);
  const [paidBy, setPaidBy] = useState(editExpense?.paidBy || '');
  const [isPaidToProvider, setIsPaidToProvider] = useState(editExpense?.isPaidToProvider || false);
  const splitMode = 'equal'; // Defaulted to equal split
  
  // New state for upfront payments
  const [paidAmounts, setPaidAmounts] = useState<{ [id: string]: string }>({});
  const [selectedCategory, setSelectedCategory] = useState(editExpense?.category || 'other');
  const [selectedColor, setSelectedColor] = useState(editExpense?.color || '#9C27B0');

  const BRUTAL_COLORS = ['#FFD600', '#00E5FF', '#FF007A', '#A0FF00', '#FF8000', '#9C27B0', '#FFFFFF'];
  
  // Sync state with params when they change (crucial for tabs)
  useEffect(() => {
    if (editExpense) {
      setTitle(editExpense.title);
      setAmount(editExpense.amount.toString());
      setPaidBy(editExpense.paidBy);
      setIsPaidToProvider(editExpense.isPaidToProvider);
      setSelectedCategory(editExpense.category);
      setSelectedColor(editExpense.color);
    } else {
      // Reset if no edit params
      setTitle('');
      setAmount('');
      setIsPaidToProvider(false);
      setSelectedCategory('other');
      setSelectedColor('#9C27B0');
    }
  }, [editExpense]);

  // Load persisted color when category changes
  useEffect(() => {
    if (!editExpense) {
      const loadStyle = async () => {
        const color = await getCategoryStyle(selectedCategory);
        setSelectedColor(color);
      };
      loadStyle();
    }
  }, [selectedCategory, editExpense]);

  useFocusEffect(
    useCallback(() => {
      const loadRoomies = async () => {
        const data = await getRoomies();
        setRoomies(data);
        if (data.length > 0 && !paidBy) setPaidBy(data[0].id);
      };
      loadRoomies();
    }, [paidBy])
  );


  const handleSave = async () => {
    if (!title || !amount || !paidBy) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }


    const amountNum = parseFloat(amount);
    
    // Convert paidAmounts string state to Payment objects
    const initialPayments: Payment[] = Object.entries(paidAmounts)
      .filter(([_, val]) => parseFloat(val) > 0)
      .map(([roomieId, val]) => ({
        id: `init-${Date.now()}-${roomieId}`,
        from: roomieId,
        amount: parseFloat(val),
        date: new Date().toLocaleDateString('es-CL'),
      }));

    const newExpense: Expense = {
      id: editExpense?.id || Date.now().toString(),
      title,
      amount: amountNum,
      date: editExpense?.date || new Date().toLocaleDateString('es-CL'),
      paidBy: paidBy || (roomies.length > 0 ? roomies[0].id : ''), // Fallback
      isPaidToProvider,
      payments: editExpense ? editExpense.payments : initialPayments,
      splitMode,
      category: selectedCategory,
      color: selectedColor,
    };

    if (!editExpense) {
      await saveCategoryStyle(selectedCategory, selectedColor);
    }

    await saveExpense(newExpense);
    navigation.setParams({ editExpense: undefined });
    
    if (editExpense) {
      navigation.goBack();
    } else {
      navigation.navigate('HOME');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={[styles.content, { padding: spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme === 'day' ? '#000' : colors.primary }]}>
          {editExpense ? 'EDITAR GASTO' : 'NUEVO GASTO'}
        </Text>

        {/* TOP SECTION: BIG AMOUNT */}
        <View style={[styles.mainAmountCard, { backgroundColor: colors.accent, borderColor: '#000' }]}>
          <Text style={styles.mainAmountLabel}>VALOR DE LA BOLETA ($)</Text>
          <TextInput
            style={styles.mainAmountInput}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor="rgba(0,0,0,0.3)"
          />
        </View>

        {/* CATEGORY SELECTOR */}
        <View style={styles.categorySection}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CATEGORÍA</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity 
                key={cat.id} 
                onPress={() => setSelectedCategory(cat.id)}
                style={[
                  styles.categoryChip, 
                  { backgroundColor: colors.card, borderColor: selectedCategory === cat.id ? colors.accent : colors.border }
                ]}
              >
                <Ionicons 
                  name={cat.icon as any} 
                  size={20} 
                  color={selectedCategory === cat.id ? colors.accent : colors.textSecondary} 
                />
                <Text style={[styles.categoryLabel, { color: selectedCategory === cat.id ? colors.accent : colors.textSecondary }]}>
                  {cat.label.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 15 }]}>ESTILO / COLOR</Text>
          <View style={styles.colorRow}>
            {BRUTAL_COLORS.map(c => (
              <TouchableOpacity 
                key={c} 
                onPress={() => setSelectedColor(c)}
                style={[
                  styles.colorCircle, 
                  { backgroundColor: c, borderColor: selectedColor === c ? colors.text : 'rgba(0,0,0,0.1)' }
                ]}
              >
                {selectedColor === c && <Ionicons name="checkmark" size={16} color={c === '#FFFFFF' ? '#000' : '#FFF'} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 10 }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>¿QUÉ SE PAGÓ? (TÍTULO)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="Luz, Agua, Supermercado..."
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 25 }]}>¿QUIÉN PAGÓ Y CUÁNTO?</Text>
        <View style={styles.roomiePaymentsList}>
          {roomies.map((roomie) => {
            const isPaying = paidAmounts[roomie.id] !== undefined;
            const amountNum = parseFloat(amount) || 0;
            const share = roomies.length > 0 ? amountNum / roomies.length : 0;
            const willExceed = roomie.currentCredit < share;

            return (
              <View key={roomie.id} style={[styles.roomiePaymentCard, { 
                borderColor: willExceed ? colors.secondary : colors.border, 
                backgroundColor: colors.card,
                borderWidth: willExceed ? 3 : 2
              }]}>
                <View style={styles.roomiePaymentHeader}>
                  <View style={[styles.avatar, { backgroundColor: roomie.color }]}>
                    <Text style={styles.avatarText}>{roomie.name.substring(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roomieName, { color: colors.text }]}>{roomie.name.toUpperCase()}</Text>
                    <Text style={{ fontSize: 8, fontWeight: '800', color: willExceed ? colors.secondary : colors.textSecondary }}>
                      {willExceed ? '⚠️ CRÉDITO INSUFICIENTE' : `Cupo: $${roomie.currentCredit.toLocaleString('es-CL')}`}
                    </Text>
                  </View>
                  <Switch 
                    value={isPaying} 
                    onValueChange={(val) => {
                      if (val) {
                        setPaidAmounts({ ...paidAmounts, [roomie.id]: '' });
                      } else {
                        const newPaid = { ...paidAmounts };
                        delete newPaid[roomie.id];
                        setPaidAmounts(newPaid);
                      }
                    }}
                    trackColor={{ false: '#333', true: colors.accent }}
                  />
                </View>
                
                {isPaying && (
                  <View style={styles.paymentInputRow}>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputPrefix}>$</Text>
                      <TextInput
                        style={[styles.paymentInput, { color: colors.text }]}
                        keyboardType="numeric"
                        placeholder="Monto"
                        placeholderTextColor="#666"
                        value={paidAmounts[roomie.id]}
                        onChangeText={(val) => setPaidAmounts({ ...paidAmounts, [roomie.id]: val })}
                      />
                    </View>
                    <View style={styles.debtInfo}>
                      <Text style={[styles.debtLabel, { color: colors.textSecondary }]}>DEBE:</Text>
                      <Text style={[styles.debtValue, { color: debt > 0 ? colors.secondary : '#4CAF50' }]}>
                        ${Math.abs(debt).toLocaleString('es-CL')}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {parseFloat(amount) > 0 && (
          <View style={[styles.summaryCard, { borderColor: '#000', backgroundColor: colors.primary }]}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>PROGRESO DE PAGO</Text>
                <Text style={styles.summaryMainValue}>
                  {((Object.values(paidAmounts).reduce((a, b) => a + parseFloat(b || '0'), 0) / parseFloat(amount)) * 100).toFixed(1)}% PAGADO
                </Text>
              </View>
              <Ionicons name="pie-chart" size={32} color="#000" />
            </View>

            <View style={styles.summaryBreakdown}>
              {roomies.map(r => {
                const amountNum = parseFloat(amount) || 0;
                const share = roomies.length > 0 ? amountNum / roomies.length : 0;
                const paid = parseFloat(paidAmounts[r.id] || '0');
                const remaining = share - paid;
                return (
                  <View key={r.id} style={styles.breakdownRow}>
                    <View style={styles.breakdownNameGroup}>
                      <View style={[styles.dot, { backgroundColor: r.color }]} />
                      <Text style={styles.breakdownName}>{r.name.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.breakdownValue}>
                      ${paid.toLocaleString('es-CL')} <Text style={{ opacity: 0.5 }}>•</Text> {remaining > 0 ? `DEBE $${remaining.toLocaleString('es-CL')}` : 'PAGADO'}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.summaryFooter}>
              <Text style={styles.summaryDetail}>
                RESTA TOTAL: ${ (parseFloat(amount) - Object.values(paidAmounts).reduce((a, b) => a + parseFloat(b || '0'), 0)).toLocaleString('es-CL') }
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.toggleCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 20 }]}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>¿SALDADO CON EL PROVEEDOR?</Text>
              <Text style={[styles.toggleDesc, { color: isPaidToProvider ? colors.accent : colors.textSecondary }]}>
                {isPaidToProvider ? 'PAGADO: Los roomies ahora te deben a ti' : 'PENDIENTE: Deuda total de la casa al proveedor'}
              </Text>
            </View>
            <Switch value={isPaidToProvider} onValueChange={setIsPaidToProvider} trackColor={{ false: '#333', true: colors.accent }} />
          </View>
        </View>


        <BrutalButton 
          title={editExpense ? "GUARDAR CAMBIOS" : "CREAR GASTO"} 
          onPress={handleSave} 
          color={colors.accent} 
        />
        <TouchableOpacity style={styles.cancelBtn} onPress={() => { navigation.setParams({ editExpense: undefined }); navigation.goBack(); }}><Text style={[styles.cancelText, { color: colors.textSecondary }]}>CANCELAR</Text></TouchableOpacity>
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 40 },
  title: { fontSize: 32, fontWeight: '900', marginBottom: 30 },
  form: { padding: 20, borderWidth: 3, marginBottom: 20 },
  label: { fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  input: { padding: 15, fontSize: 18, fontWeight: '700', borderWidth: 2 },
  toggleCard: { padding: 20, borderWidth: 3, marginBottom: 20 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleTitle: { fontSize: 12, fontWeight: '900' },
  toggleDesc: { fontSize: 10, fontWeight: '700', marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '900', marginBottom: 15 },
  avatar: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: '900', fontSize: 12 },
  cancelBtn: { marginTop: 20, alignItems: 'center' },
  cancelText: { fontWeight: '800' },
  mainAmountCard: { padding: 25, borderWidth: 4, marginBottom: 15, elevation: 5 },
  mainAmountLabel: { fontSize: 10, fontWeight: '900', color: '#000', marginBottom: 5 },
  mainAmountInput: { fontSize: 48, fontWeight: '900', color: '#000', letterSpacing: -2 },
  roomiePaymentsList: { gap: 12, marginBottom: 20 },
  roomiePaymentCard: { padding: 15, borderWidth: 3 },
  roomiePaymentHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roomieName: { flex: 1, fontWeight: '900', fontSize: 14 },
  paymentInputRow: { flexDirection: 'row', marginTop: 15, gap: 15, alignItems: 'center' },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderColor: '#000', paddingHorizontal: 5 },
  inputPrefix: { fontSize: 18, fontWeight: '900', marginRight: 5 },
  paymentInput: { flex: 1, fontSize: 18, fontWeight: '900', paddingVertical: 5 },
  debtInfo: { alignItems: 'flex-end' },
  debtLabel: { fontSize: 8, fontWeight: '900' },
  debtValue: { fontSize: 14, fontWeight: '900' },
  summaryCard: { padding: 20, borderWidth: 4, marginVertical: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 10, fontWeight: '900', color: '#000' },
  summaryMainValue: { fontSize: 24, fontWeight: '900', color: '#000' },
  summaryFooter: { marginTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)', paddingTop: 10 },
  summaryDetail: { fontSize: 14, fontWeight: '900', color: '#000' },
  summaryBreakdown: { marginTop: 15, paddingVertical: 10, gap: 8 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownNameGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: '#000' },
  breakdownName: { fontSize: 10, fontWeight: '900', color: '#000' },
  breakdownValue: { fontSize: 10, fontWeight: '700', color: '#000' },
  splitCard: { padding: 20, borderWidth: 3, marginBottom: 30 },
  splitTitle: { color: '#000', fontWeight: '900', fontSize: 14, marginBottom: 15 },
  splitOptions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  splitBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.3)', padding: 12, borderWidth: 2, borderColor: 'transparent', gap: 10 },
  splitBtnActive: { backgroundColor: '#FFF', borderColor: '#000' },
  splitBtnText: { fontWeight: '900', fontSize: 11, color: '#000' },
  customSplitPanel: { backgroundColor: 'rgba(0,0,0,0.05)', padding: 15, borderWidth: 2, borderColor: '#000' },
  customSplitHint: { fontSize: 8, fontWeight: '900', color: '#000', marginBottom: 10, opacity: 0.6 },
  percentageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  percName: { fontWeight: '900', fontSize: 12, color: '#000' },
  percInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 2, paddingHorizontal: 10 },
  percInput: { width: 50, padding: 8, fontWeight: '900', fontSize: 16, textAlign: 'right' },
  percSymbol: { fontWeight: '900', fontSize: 16, marginLeft: 5 },
  percFooter: { marginTop: 10, borderTopWidth: 1, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalPercText: { fontWeight: '900', fontSize: 12 },
  balanceBtn: { backgroundColor: '#000', paddingHorizontal: 10, paddingVertical: 5 },
  balanceBtnText: { color: '#FFF', fontSize: 8, fontWeight: '900' },
  categorySection: { marginBottom: 10 },
  sectionLabel: { fontSize: 8, fontWeight: '900', marginBottom: 10, letterSpacing: 1 },
  categoryList: { gap: 10, paddingVertical: 5 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 15, paddingVertical: 10, borderWidth: 2, borderRadius: 12 },
  categoryLabel: { fontSize: 10, fontWeight: '900' },
  colorRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 5 },
  colorCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 3, justifyContent: 'center', alignItems: 'center' }
});
