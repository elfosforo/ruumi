import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Payment {
  id: string;
  from: string;
  amount: number;
  date: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  paidBy: string; 
  isPaidToProvider: boolean; 
  payments: Payment[]; 
  splitMode: 'equal' | 'custom';
  customSplit?: { [roomieId: string]: number }; // Percentage (0-100) for each roomie ID
  category: string;
  color: string;
}

export const CATEGORIES = [
  { id: 'services', icon: 'flash', label: 'Servicios', defaultColor: '#FFD600' },
  { id: 'shopping', icon: 'cart', label: 'Super', defaultColor: '#00E5FF' },
  { id: 'home', icon: 'home', label: 'Hogar', defaultColor: '#FF007A' },
  { id: 'web', icon: 'wifi', label: 'Web', defaultColor: '#A0FF00' },
  { id: 'food', icon: 'restaurant', label: 'Comida', defaultColor: '#FF8000' },
  { id: 'other', icon: 'star', label: 'Otros', defaultColor: '#9C27B0' },
];

const CATEGORY_STYLES_KEY = '@ruumi_category_styles';

export interface Roomie {
  id: string;
  name: string;
  color: string;
  balance: number;      // Contributed - Responsibility (Positive = Acreedor, Negative = Deudor)
  creditLimit: number;
  currentCredit: number;
  totalContributed: number; // Real money that came out of this roomie's pocket
  totalResponsibilities: number; // Total shares this roomie is responsible for
}

const EXPENSES_KEY = '@ruumi_expenses';
const ROOMIES_KEY = '@ruumi_roomies';

export const getExpenses = async (): Promise<Expense[]> => {
  try {
    const data = await AsyncStorage.getItem(EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const saveExpense = async (expense: Expense) => {
  try {
    const expenses = await getExpenses();
    const index = expenses.findIndex(e => e.id === expense.id);
    let updated = index !== -1 ? (expenses[index] = expense, [...expenses]) : [expense, ...expenses];
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(updated));
    await updateRoomieBalances(updated);
  } catch (e) {}
};

export const deleteExpense = async (id: string) => {
  try {
    const expenses = await getExpenses();
    const updated = expenses.filter(e => e.id !== id);
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(updated));
    // Pass the updated list directly to avoid race conditions
    await updateRoomieBalances(updated);
  } catch (e) {
    console.error('Error deleting expense:', e);
  }
};

export const addPaymentToExpense = async (expenseId: string, payment: Payment) => {
  try {
    const expenses = await getExpenses();
    const updated = expenses.map(exp => exp.id === expenseId ? { ...exp, payments: [...exp.payments, payment] } : exp);
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(updated));
    await updateRoomieBalances(updated);
  } catch (e) {}
};

export const getRoomies = async (): Promise<Roomie[]> => {
  try {
    const data = await AsyncStorage.getItem(ROOMIES_KEY);
    if (!data) {
      const defaultRoomies: Roomie[] = [{ id: '1', name: 'Yo', color: '#00E5FF', balance: 0, creditLimit: 200000, currentCredit: 200000, totalContributed: 0 }];
      await AsyncStorage.setItem(ROOMIES_KEY, JSON.stringify(defaultRoomies));
      return defaultRoomies;
    }
    return JSON.parse(data);
  } catch (e) { return []; }
};

export const saveRoomies = async (roomies: Roomie[]) => {
  try { await AsyncStorage.setItem(ROOMIES_KEY, JSON.stringify(roomies)); } catch (e) {}
};

export const updateRoomieBalances = async (providedExpenses?: Expense[]) => {
  const expenses = providedExpenses || await getExpenses();
  const roomies = await getRoomies();
  
  // Initialize roomies with 0 totals
  const updatedRoomies = roomies.map(r => ({ 
    ...r, 
    balance: 0, 
    currentCredit: r.creditLimit,
    totalContributed: 0,
    totalResponsibilities: 0
  }));

  const calculateShares = (exp: Expense, allRoomies: Roomie[]) => {
    const shares: { [id: string]: number } = {};
    if (exp.splitMode === 'custom' && exp.customSplit) {
      allRoomies.forEach(r => {
        const percentage = exp.customSplit?.[r.id] || 0;
        shares[r.id] = (exp.amount * percentage) / 100;
      });
    } else {
      const equalShare = exp.amount / allRoomies.length;
      allRoomies.forEach(r => shares[r.id] = equalShare);
    }
    return shares;
  };

  expenses.forEach(exp => {
    const shares = calculateShares(exp, roomies);
    
    // ACCRUAL LOGIC: Responsibilities are recognized immediately to reflect house debt
    Object.entries(shares).forEach(([id, share]) => {
      const roomie = updatedRoomies.find(r => r.id === id);
      if (roomie) roomie.totalResponsibilities += share;
    });

    // SETTLEMENT LOGIC: Contributions are only recognized if paid to provider
    if (exp.isPaidToProvider) {
      const payer = updatedRoomies.find(r => r.id === exp.paidBy);
      if (payer) payer.totalContributed += exp.amount;
    }

    // Internal and External payments logic (Abonos)
    exp.payments.forEach(p => {
      const sender = updatedRoomies.find(r => r.id === p.from);
      
      if (exp.isPaidToProvider) {
        // CASE A: Paid to provider already. Payment is internal (to the payer).
        const receiver = updatedRoomies.find(r => r.id === exp.paidBy); 
        if (sender) sender.totalContributed += p.amount;
        if (receiver) receiver.totalContributed -= p.amount;
      } else {
        // CASE B: Not paid to provider. Payment is external (towards the bill).
        // The sender gets credit for this contribution immediately.
        if (sender) sender.totalContributed += p.amount;
      }
    });
  });

  // 3. Final Balance Calculation
  updatedRoomies.forEach(r => {
    r.balance = r.totalContributed - r.totalResponsibilities;
    
    if (r.balance < 0) {
      r.currentCredit = Math.max(0, r.creditLimit + r.balance);
    } else {
      r.currentCredit = r.creditLimit;
    r.currentCredit = r.balance < 0 ? Math.max(0, r.creditLimit + r.balance) : r.creditLimit;
  });

  await saveRoomies(updatedRoomies);
};

export const updateCreditLimit = async (roomieId: string, newLimit: number): Promise<void> => {
  const roomies = await getRoomies();
  const updatedRoomies = roomies.map(r => {
    if (r.id === roomieId) {
      const balance = r.balance || 0;
      return {
        ...r,
        creditLimit: newLimit,
        currentCredit: balance < 0 ? Math.max(0, newLimit + balance) : newLimit
      };
    }
    return r;
  });
  await saveRoomies(updatedRoomies);
};

export const getCategoryStyle = async (categoryId: string): Promise<string> => {
  try {
    const data = await AsyncStorage.getItem(CATEGORY_STYLES_KEY);
    const styles = data ? JSON.parse(data) : {};
    return styles[categoryId] || CATEGORIES.find(c => c.id === categoryId)?.defaultColor || '#333';
  } catch (e) { return '#333'; }
};

export const saveCategoryStyle = async (categoryId: string, color: string) => {
  try {
    const data = await AsyncStorage.getItem(CATEGORY_STYLES_KEY);
    const styles = data ? JSON.parse(data) : {};
    styles[categoryId] = color;
    await AsyncStorage.setItem(CATEGORY_STYLES_KEY, JSON.stringify(styles));
  } catch (e) {}
};

export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
    const defaultRoomies: Roomie[] = [{ 
      id: '1', 
      name: 'Yo', 
      color: '#00E5FF', 
      balance: 0, 
      creditLimit: 200000, 
      currentCredit: 200000, 
      totalContributed: 0, 
      totalResponsibilities: 0 
    }];
    await AsyncStorage.setItem(ROOMIES_KEY, JSON.stringify(defaultRoomies));
  } catch (e) {}
};
