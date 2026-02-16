/**
 * AnimatedPressable Component
 * Button with scale + opacity press animation and haptics
 */
import { SPRING } from "@/lib/animations";
import { hapticLight } from "@/lib/haptics";
import React from "react";
import { Pressable, PressableProps, ViewStyle } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

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
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressableBase
      {...rest}
      style={[animatedStyle, style]}
      onPressIn={(e) => {
        scale.value = withSpring(scaleDown, SPRING.snappy);
        opacity.value = withSpring(0.9, SPRING.snappy);
        if (enableHaptics) hapticLight();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, SPRING.default);
        opacity.value = withSpring(1, SPRING.default);
        onPressOut?.(e);
      }}
      onPress={onPress}
    >
      {children}
    </AnimatedPressableBase>
  );
}
