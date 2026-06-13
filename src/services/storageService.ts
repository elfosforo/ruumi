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
  createdAt?: string; // Date when expense was registered
  dueDate?: string;   // Optional deadline to pay provider
}

export interface House {
  id: string;
  name: string;
}

export const CATEGORIES = [
  { id: 'services', icon: 'flash', label: 'Servicios', defaultColor: '#FFD600' },
  { id: 'shopping', icon: 'cart', label: 'Super', defaultColor: '#00E5FF' },
  { id: 'home', icon: 'home', label: 'Hogar', defaultColor: '#FF007A' },
  { id: 'web', icon: 'wifi', label: 'Web', defaultColor: '#A0FF00' },
  { id: 'food', icon: 'restaurant', label: 'Comida', defaultColor: '#FF8000' },
  { id: 'other', icon: 'star', label: 'Otros', defaultColor: '#9C27B0' },
];

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

const HOUSES_KEY = '@ruumi_houses';
const CURRENT_HOUSE_ID_KEY = '@ruumi_current_house_id';

export const getHouses = async (): Promise<House[]> => {
  try {
    const data = await AsyncStorage.getItem(HOUSES_KEY);
    if (!data) {
      const defaultHouses = [{ id: 'default_house', name: 'Depto 402 - Santiago' }];
      await saveHouses(defaultHouses);
      return defaultHouses;
    }
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

export const saveHouses = async (houses: House[]) => {
  try {
    await AsyncStorage.setItem(HOUSES_KEY, JSON.stringify(houses));
  } catch (e) {}
};

export const getCurrentHouseId = async (): Promise<string> => {
  try {
    let currentId = await AsyncStorage.getItem(CURRENT_HOUSE_ID_KEY);
    if (!currentId) {
      const houses = await getHouses();
      currentId = houses.length > 0 ? houses[0].id : 'default_house';
      await AsyncStorage.setItem(CURRENT_HOUSE_ID_KEY, currentId);
    }
    return currentId;
  } catch (e) {
    return 'default_house';
  }
};

export const setCurrentHouseId = async (houseId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(CURRENT_HOUSE_ID_KEY, houseId);
  } catch (e) {}
};

export const addHouse = async (name: string): Promise<House> => {
  const newHouse: House = { id: 'house_' + Date.now(), name };
  const houses = await getHouses();
  houses.push(newHouse);
  await saveHouses(houses);
  
  // Initialize default roomie for the new house
  const defaultRoomiesKey = `@ruumi_roomies_${newHouse.id}`;
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
  await AsyncStorage.setItem(defaultRoomiesKey, JSON.stringify(defaultRoomies));
  return newHouse;
};

export const getExpenses = async (): Promise<Expense[]> => {
  try {
    const houseId = await getCurrentHouseId();
    const key = `@ruumi_expenses_${houseId}`;
    let data = await AsyncStorage.getItem(key);
    
    // Backwards compatibility migration
    if (!data && houseId === 'default_house') {
      const oldData = await AsyncStorage.getItem('@ruumi_expenses');
      if (oldData) {
        await AsyncStorage.setItem(key, oldData);
        data = oldData;
      }
    }
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const saveExpense = async (expense: Expense) => {
  try {
    const houseId = await getCurrentHouseId();
    const key = `@ruumi_expenses_${houseId}`;
    const expenses = await getExpenses();
    const index = expenses.findIndex(e => e.id === expense.id);
    let updated = index !== -1 ? (expenses[index] = expense, [...expenses]) : [expense, ...expenses];
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    await updateRoomieBalances(updated);
  } catch (e) {}
};

export const deleteExpense = async (id: string) => {
  try {
    const houseId = await getCurrentHouseId();
    const key = `@ruumi_expenses_${houseId}`;
    const expenses = await getExpenses();
    const updated = expenses.filter(e => e.id !== id);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    await updateRoomieBalances(updated);
  } catch (e) {
    console.error('Error deleting expense:', e);
  }
};

export const addPaymentToExpense = async (expenseId: string, payment: Payment) => {
  try {
    const houseId = await getCurrentHouseId();
    const key = `@ruumi_expenses_${houseId}`;
    const expenses = await getExpenses();
    const updated = expenses.map(exp => exp.id === expenseId ? { ...exp, payments: [...exp.payments, payment] } : exp);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    await updateRoomieBalances(updated);
  } catch (e) {}
};

export const getRoomies = async (): Promise<Roomie[]> => {
  try {
    const houseId = await getCurrentHouseId();
    const key = `@ruumi_roomies_${houseId}`;
    let data = await AsyncStorage.getItem(key);
    
    // Backwards compatibility migration
    if (!data && houseId === 'default_house') {
      const oldData = await AsyncStorage.getItem('@ruumi_roomies');
      if (oldData) {
        await AsyncStorage.setItem(key, oldData);
        data = oldData;
      }
    }
    if (!data) {
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
      await AsyncStorage.setItem(key, JSON.stringify(defaultRoomies));
      return defaultRoomies;
    }
    return JSON.parse(data);
  } catch (e) { return []; }
};

export const saveRoomies = async (roomies: Roomie[]) => {
  try {
    const houseId = await getCurrentHouseId();
    const key = `@ruumi_roomies_${houseId}`;
    await AsyncStorage.setItem(key, JSON.stringify(roomies));
  } catch (e) {}
};

export const updateRoomieBalances = async (providedExpenses?: Expense[]) => {
  const expenses = providedExpenses || await getExpenses();
  const roomies = await getRoomies();
  
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
    
    Object.entries(shares).forEach(([id, share]) => {
      const roomie = updatedRoomies.find(r => r.id === id);
      if (roomie) roomie.totalResponsibilities += share;
    });

    if (exp.isPaidToProvider) {
      const payer = updatedRoomies.find(r => r.id === exp.paidBy);
      if (payer) payer.totalContributed += exp.amount;
    }

    exp.payments.forEach(p => {
      const sender = updatedRoomies.find(r => r.id === p.from);
      
      if (exp.isPaidToProvider) {
        const receiver = updatedRoomies.find(r => r.id === exp.paidBy); 
        if (sender) sender.totalContributed += p.amount;
        if (receiver) receiver.totalContributed -= p.amount;
      } else {
        if (sender) sender.totalContributed += p.amount;
      }
    });
  });

  updatedRoomies.forEach(r => {
    r.balance = r.totalContributed - r.totalResponsibilities;
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
    const houseId = await getCurrentHouseId();
    const key = `@ruumi_category_styles_${houseId}`;
    let data = await AsyncStorage.getItem(key);
    
    if (!data && houseId === 'default_house') {
      const oldData = await AsyncStorage.getItem('@ruumi_category_styles');
      if (oldData) {
        await AsyncStorage.setItem(key, oldData);
        data = oldData;
      }
    }
    const styles = data ? JSON.parse(data) : {};
    return styles[categoryId] || CATEGORIES.find(c => c.id === categoryId)?.defaultColor || '#333';
  } catch (e) { return '#333'; }
};

export const saveCategoryStyle = async (categoryId: string, color: string) => {
  try {
    const houseId = await getCurrentHouseId();
    const key = `@ruumi_category_styles_${houseId}`;
    const data = await AsyncStorage.getItem(key);
    const styles = data ? JSON.parse(data) : {};
    styles[categoryId] = color;
    await AsyncStorage.setItem(key, JSON.stringify(styles));
  } catch (e) {}
};

export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
    const defaultHouses = [{ id: 'default_house', name: 'Depto 402 - Santiago' }];
    await saveHouses(defaultHouses);
    await setCurrentHouseId('default_house');
    
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
    await AsyncStorage.setItem('@ruumi_roomies_default_house', JSON.stringify(defaultRoomies));
  } catch (e) {}
};

// --- BACKUP & RESTORE UTILITIES ---

export const exportBackup = async (): Promise<string> => {
  const houses = await getHouses();
  const currentHouseId = await getCurrentHouseId();
  
  const backupData: {
    houses: House[];
    currentHouseId: string;
    houseData: {
      [houseId: string]: {
        expenses: Expense[];
        roomies: Roomie[];
        categoryStyles: any;
      }
    }
  } = {
    houses,
    currentHouseId,
    houseData: {}
  };

  for (const house of houses) {
    const expensesKey = `@ruumi_expenses_${house.id}`;
    const roomiesKey = `@ruumi_roomies_${house.id}`;
    const stylesKey = `@ruumi_category_styles_${house.id}`;

    let expData = await AsyncStorage.getItem(expensesKey);
    let romData = await AsyncStorage.getItem(roomiesKey);
    let styData = await AsyncStorage.getItem(stylesKey);

    // Fallbacks for default_house migration during backup
    if (house.id === 'default_house') {
      if (!expData) expData = await AsyncStorage.getItem('@ruumi_expenses');
      if (!romData) romData = await AsyncStorage.getItem('@ruumi_roomies');
      if (!styData) styData = await AsyncStorage.getItem('@ruumi_category_styles');
    }

    backupData.houseData[house.id] = {
      expenses: expData ? JSON.parse(expData) : [],
      roomies: romData ? JSON.parse(romData) : [],
      categoryStyles: styData ? JSON.parse(styData) : {}
    };
  }

  return JSON.stringify(backupData, null, 2);
};

export const importBackup = async (backupJson: string): Promise<boolean> => {
  try {
    const data = JSON.parse(backupJson);
    if (!data.houses || !Array.isArray(data.houses) || !data.currentHouseId || !data.houseData) {
      return false;
    }

    // Overwrite metadata keys
    await AsyncStorage.setItem(HOUSES_KEY, JSON.stringify(data.houses));
    await AsyncStorage.setItem(CURRENT_HOUSE_ID_KEY, data.currentHouseId);

    // Overwrite data for each house
    for (const [houseId, hData] of Object.entries(data.houseData)) {
      const hd = hData as any;
      await AsyncStorage.setItem(`@ruumi_expenses_${houseId}`, JSON.stringify(hd.expenses || []));
      await AsyncStorage.setItem(`@ruumi_roomies_${houseId}`, JSON.stringify(hd.roomies || []));
      await AsyncStorage.setItem(`@ruumi_category_styles_${houseId}`, JSON.stringify(hd.categoryStyles || {}));
    }
    return true;
  } catch (e) {
    return false;
  }
};
