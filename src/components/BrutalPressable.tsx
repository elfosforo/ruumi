import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';

interface BrutalPressableProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export const BrutalPressable: React.FC<BrutalPressableProps> = ({ 
  children, 
  onPress, 
  style,
  contentStyle
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(animatedValue, {
      toValue: 0,
      useNativeDriver: true,
      tension: 150,
      friction: 10,
    }).start();
  };

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });
  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });

  return (
    <Pressable 
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={20}
      style={({ pressed }) => [
        styles.container,
        style as any // Casting because of nested arrays in styles
      ]}
    >
      <View style={styles.shadow} />
      <Animated.View style={[
        styles.front, 
        contentStyle as any,
        (style as any)?.flex ? { flex: (style as any).flex } : null,
        { transform: [{ translateX }, { translateY }] }
      ]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  shadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: -5,
    bottom: -5,
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#000',
  },
  front: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#000',
    marginRight: 5,
    marginBottom: 5,
  },
});
