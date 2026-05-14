import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { ThemeProvider, useTheme } from './src/styles/ThemeContext';

// Components
import { CustomTabBar } from './src/components/CustomTabBar';

// Screens
import { DashboardScreen } from './src/screens/DashboardScreen';
import { AddExpenseScreen } from './src/screens/AddExpenseScreen';
import { RoomiesScreen } from './src/screens/RoomiesScreen';
import { SummaryScreen } from './src/screens/SummaryScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { ExpenseDetailScreen } from './src/screens/ExpenseDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HOME" component={DashboardScreen} />
      <Tab.Screen name="GASTOS" component={AddExpenseScreen} />
      <Tab.Screen name="RESUMEN" component={SummaryScreen} />
      <Tab.Screen name="ROOMIES" component={RoomiesScreen} />
      <Tab.Screen name="PERFIL" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function MainNavigation() {
  const { theme } = useTheme();
  return (
    <NavigationContainer>
      <StatusBar style={theme === 'night' ? 'light' : 'dark'} />
      <Stack.Navigator 
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme === 'night' ? '#0F0F13' : '#F0F0F0' }
        }}
      >
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="Scanner" component={ScannerScreen} />
        <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <View style={styles.root}>
      <View style={styles.mobileContainer}>
        <ThemeProvider>
          <MainNavigation />
        </ThemeProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0F0F13',
    overflow: 'hidden',
  },
});
