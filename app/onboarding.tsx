/**
 * Onboarding Screen
 * First-launch intro with swipeable pages
 */
import { markOnboardingDone } from "@/lib/localStore";
import { T } from "@/lib/theme";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    Dimensions,
    FlatList,
    Text,
    TouchableOpacity,
    View,
    ViewToken,
} from "react-native";

const { width } = Dimensions.get("window");

interface OnboardingPage {
  icon: string;
  title: string;
  description: string;
}

const PAGES: OnboardingPage[] = [
  {
    icon: "🎮",
    title: "Welcome to VibeProof",
    description:
      "A proof-of-action gaming platform on Solana. Complete missions, earn XP, and climb the leaderboard.",
  },
  {
    icon: "🎯",
    title: "Daily Missions",
    description:
      "New missions every day! Verify on-chain activity, link socials, and complete challenges to earn XP.",
  },
  {
    icon: "🔥",
    title: "Streaks & Achievements",
    description:
      "Keep your daily streak alive for XP multipliers. Unlock badges and rank up from Bronze to Diamond.",
  },
  {
    icon: "🏆",
    title: "Ready to Prove Your Vibe?",
    description:
      "Connect your Solana wallet and start your journey. Your progress is saved offline — no internet required.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < PAGES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleDone();
    }
  };

  const handleSkip = () => {
    handleDone();
  };

  const handleDone = async () => {
    await markOnboardingDone();
    router.replace("/(tabs)/profile");
  };

  const renderPage = ({ item }: { item: OnboardingPage }) => (
    <View style={[styles.page, { width }]}>
      <Text style={styles.pageIcon}>{item.icon}</Text>
      <Text style={styles.pageTitle}>{item.title}</Text>
      <Text style={styles.pageDesc}>{item.description}</Text>
    </View>
  );

  const isLast = currentIndex === PAGES.length - 1;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={PAGES}
        renderItem={renderPage}
        keyExtractor={(_, i) => i.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig}
        bounces={false}
      />

      {/* Dot indicators */}
      <View style={styles.dotsRow}>
        {PAGES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex && styles.dotActive]}
          />
        ))}
      </View>

      {/* Bottom buttons */}
      <View style={styles.bottomRow}>
        {!isLast ? (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
          <Text style={styles.nextText}>
            {isLast ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  page: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: 40,
    gap: 20,
  },
  pageIcon: {
    fontSize: 80,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800" as const,
    color: T.text,
    textAlign: "center" as const,
  },
  pageDesc: {
    fontSize: 16,
    color: T.textSec,
    textAlign: "center" as const,
    lineHeight: 22,
  },
  dotsRow: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    gap: 8,
    paddingBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.surface2,
  },
  dotActive: {
    backgroundColor: T.accent,
    width: 24,
  },
  bottomRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 14,
  },
  skipText: {
    fontSize: 15,
    color: T.textMuted,
    fontWeight: "600" as const,
  },
  nextBtn: {
    backgroundColor: T.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: T.rXL,
  },
  nextText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700" as const,
  },
};
