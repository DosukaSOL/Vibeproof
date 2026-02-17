/**
 * AnimatedNumber Component
 * Smoothly animates between number values with a counting effect.
 * Uses plain React Native Animated API — NO Reanimated.
 */
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, TextStyle } from "react-native";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  style?: TextStyle;
  prefix?: string;
  suffix?: string;
  formatFn?: (n: number) => string;
}

export function AnimatedNumber({
  value,
  duration = 800,
  style,
  prefix = "",
  suffix = "",
  formatFn,
}: AnimatedNumberProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(formatValue(value));
  const prevValue = useRef(value);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  function formatValue(n: number): string {
    if (formatFn) return formatFn(n);
    return Math.round(n).toLocaleString();
  }

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    prevValue.current = value;

    if (from === to) {
      setDisplay(formatValue(to));
      return;
    }

    animatedValue.setValue(0);

    const listener = animatedValue.addListener(({ value: progress }) => {
      const current = from + (to - from) * progress;
      setDisplay(formatValue(current));
    });

    // Count up animation
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // need JS-thread for text updates
    }).start();

    // Pop scale effect when value increases
    if (to > from) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 8,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value]);

  return (
    <Animated.Text style={[style, { transform: [{ scale: scaleAnim }] }]}>
      {prefix}
      {display}
      {suffix}
    </Animated.Text>
  );
}
