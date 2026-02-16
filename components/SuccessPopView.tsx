/**
 * SuccessPopView Component
 * Bouncy entrance animation for success states (XP gained, mission complete).
 * Uses plain React Native Animated API — NO Reanimated worklets.
 */
import { SPRING } from "@/lib/animations";
import React, { useEffect, useRef } from "react";
import { Animated, ViewStyle } from "react-native";

interface SuccessPopViewProps {
  children: React.ReactNode;
  trigger?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export function SuccessPopView({
  children,
  trigger = true,
  style,
}: SuccessPopViewProps) {
  const scale = useRef(new Animated.Value(trigger ? 0.6 : 1)).current;
  const opacity = useRef(new Animated.Value(trigger ? 0 : 1)).current;

  useEffect(() => {
    if (trigger) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          ...SPRING.bouncy,
          useNativeDriver: true,
        }),
        Animated.spring(opacity, {
          toValue: 1,
          ...SPRING.default,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [trigger]);

  return (
    <Animated.View style={[{ transform: [{ scale }], opacity }, style]}>
      {children}
    </Animated.View>
  );
}
