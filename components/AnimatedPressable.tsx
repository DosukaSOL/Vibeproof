/**
 * AnimatedPressable Component
 * Button with scale + opacity press animation and haptics.
 * Uses plain React Native Animated API — NO Reanimated worklets.
 */
import { SPRING } from "@/lib/animations";
import { hapticLight } from "@/lib/haptics";
import React, { useRef } from "react";
import { Animated, Pressable, PressableProps, ViewStyle } from "react-native";

interface AnimatedPressableProps extends PressableProps {
  style?: ViewStyle | ViewStyle[];
  scaleDown?: number;
  enableHaptics?: boolean;
  children: React.ReactNode;
}

export function AnimatedPressable({
  style,
  scaleDown = 0.96,
  enableHaptics = true,
  onPressIn,
  onPressOut,
  onPress,
  children,
  ...rest
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View
      style={[{ transform: [{ scale }], opacity }, style]}
    >
      <Pressable
        {...rest}
        onPressIn={(e) => {
          Animated.parallel([
            Animated.spring(scale, {
              toValue: scaleDown,
              ...SPRING.snappy,
              useNativeDriver: true,
            }),
            Animated.spring(opacity, {
              toValue: 0.9,
              ...SPRING.snappy,
              useNativeDriver: true,
            }),
          ]).start();
          if (enableHaptics) hapticLight();
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          Animated.parallel([
            Animated.spring(scale, {
              toValue: 1,
              ...SPRING.default,
              useNativeDriver: true,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              ...SPRING.default,
              useNativeDriver: true,
            }),
          ]).start();
          onPressOut?.(e);
        }}
        onPress={onPress}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
