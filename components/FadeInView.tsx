/**
 * FadeInView Component
 * Wraps children with a staggered fade-in + slide-up animation
 */
import { DURATION, EASING, getStaggerDelay } from "@/lib/animations";
import React, { useEffect } from "react";
import { ViewStyle } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";

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
  const opacity = useSharedValue(0);
  const offsetY = useSharedValue(translateY);

  const totalDelay = delay + getStaggerDelay(index);

  useEffect(() => {
    opacity.value = withDelay(
      totalDelay,
      withTiming(1, { duration, easing: EASING.enter })
    );
    offsetY.value = withDelay(
      totalDelay,
      withTiming(0, { duration, easing: EASING.enter })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: offsetY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
  );
}
