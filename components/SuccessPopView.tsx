/**
 * SuccessPopView Component
 * Bouncy entrance animation for success states (XP gained, mission complete)
 */
import { SPRING } from "@/lib/animations";
import React, { useEffect } from "react";
import { ViewStyle } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

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
  const scale = useSharedValue(trigger ? 0.6 : 1);
  const opacity = useSharedValue(trigger ? 0 : 1);

  useEffect(() => {
    if (trigger) {
      scale.value = withSpring(1, SPRING.bouncy);
      opacity.value = withSpring(1, SPRING.default);
    }
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
  );
}
