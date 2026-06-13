import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../styles/ThemeContext';

const logo6 = require('../../assets/Logo/1x/Recurso 6.png');

export const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const { colors, theme } = useTheme();

  return (
    <SafeAreaView style={{ backgroundColor: colors.card }}>
      <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const getIcon = (name: string) => {
            switch (name) {
              case 'HOME': return isFocused ? 'home' : 'home-outline';
              case 'GASTOS': return isFocused ? 'cash' : 'cash-outline';
              case 'RESUMEN': return isFocused ? 'analytics' : 'analytics-outline';
              case 'ROOMIES': return isFocused ? 'people' : 'people-outline';
              case 'PERFIL': return isFocused ? 'person' : 'person-outline';
              default: return 'square';
            }
          };

          // Logic for active tab color in Day Mode (avoid black on black)
          const activeBg = theme === 'day' ? colors.secondary : colors.primary;
          const activeIconColor = '#000'; // Always black icon on vibrant background for brutalist look

          return (
            <TouchableOpacity
              key={index}
              onPress={onPress}
              style={[
                styles.tabItem,
                isFocused && { backgroundColor: activeBg }
              ]}
            >
              {route.name === 'HOME' ? (
                <Image 
                  source={logo6} 
                  style={{ width: 22, height: 22, tintColor: isFocused ? activeIconColor : colors.textSecondary }} 
                  resizeMode="contain"
                />
              ) : (
                <Ionicons 
                  name={getIcon(route.name) as any} 
                  size={22} 
                  color={isFocused ? activeIconColor : colors.textSecondary} 
                />
              )}
              <Text style={[
                styles.tabLabel, 
                { color: isFocused ? activeIconColor : colors.textSecondary }
              ]}>
                {route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 70,
    borderTopWidth: 2,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '900',
  },
});
