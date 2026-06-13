import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, ViewStyle, TextStyle, View, StyleProp } from 'react-native';

interface BrutalButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const BrutalButton: React.FC<BrutalButtonProps> = ({ 
  title, 
  onPress, 
  color = '#FFF', 
  style,
  textStyle 
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
      style={style}
    >
      {/* Shadow Layer */}
      <View style={styles.shadow} />
      
      {/* Animated Front Layer */}
      <Animated.View style={[
        styles.front, 
        { backgroundColor: color, transform: [{ translateX }, { translateY }] }
      ]}>
        <Text style={[styles.text, textStyle as any]}>{title.toUpperCase()}</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  shadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: -6,
    bottom: -6,
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#000',
  },
  front: {
    height: 60,
    borderWidth: 3,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginBottom: 6,
  },
  text: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
});
