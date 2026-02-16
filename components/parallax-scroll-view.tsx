/**
 * ParallaxScrollView — unused Expo template component (Reanimated removed)
 */
import type { PropsWithChildren, ReactElement } from 'react';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
}: Props) {
  return (
    <ScrollView style={{ flex: 1 }} scrollEventThrottle={16}>
      <View style={[styles.header, { backgroundColor: headerBackgroundColor.dark }]}>
        {headerImage}
      </View>
      <View style={styles.content}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: 'hidden',
  },
});
