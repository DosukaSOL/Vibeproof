/**
 * FadeInView Component
 * Wraps children with a staggered fade-in + slide-up animation.
 * Uses plain React Native Animated API — NO Reanimated worklets.
 */
import { DURATION, EASING, getStaggerDelay } from "@/lib/animations";
import React, { useEffect, useRef } from "react";
import { Animated, ViewStyle } from "react-native";

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  index?: number;
  duration?: number;
  translateY?: number;
  style?: ViewStyle | ViewStyle[];
}

export function FadeInView({
  children,
  delay = 0,
  index = 0,
  duration = DURATION.entrance,
  translateY = 16,
  style,
}: FadeInViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const offsetY = useRef(new Animated.Value(translateY)).current;

  const totalDelay = delay + getStaggerDelay(index);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          easing: EASING.enter,
          useNativeDriver: true,
        }),
        Animated.timing(offsetY, {
          toValue: 0,
          duration,
          easing: EASING.enter,
          useNativeDriver: true,
        }),
      ]).start();
    }, totalDelay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[{ opacity, transform: [{ translateY: offsetY }] }, style]}
    >
      {children}
    </Animated.View>
  );
}
