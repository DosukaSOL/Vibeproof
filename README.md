<p align="center">
  <img src="assets/githubvplogo.png" alt="VibeProof" width="100%" style="max-width: 800px" />
</p>

<p align="center">
  <strong>Proof-of-Action Gaming on Solana</strong><br/>
  <em>Turn real-world actions into XP, ranks, and achievements — built for Solana Seeker.</em>
</p>

<p align="center">
  <a href="https://github.com/DosukaSOL/Vibeproof/releases/latest"><img src="https://img.shields.io/github/v/release/DosukaSOL/Vibeproof?style=flat-square&color=3FB950" alt="Latest Release" /></a>
  <img src="https://img.shields.io/badge/platform-Android-3DDC84?style=flat-square&logo=android&logoColor=white" alt="Android" />
  <img src="https://img.shields.io/badge/Solana-Seeker-9945FF?style=flat-square&logo=solana&logoColor=white" alt="Solana Seeker" />
  <img src="https://img.shields.io/badge/Expo_SDK-54-000020?style=flat-square&logo=expo&logoColor=white" alt="Expo SDK 54" />
</p>

---

## What is VibeProof?

**VibeProof** is a **proof-of-action gaming platform** built for the **Solana Seeker phone** that turns real on-chain activity, social engagement, and app usage into XP, ranks, and achievements.

Connect your wallet. Complete missions. Climb the leaderboard. Prove you showed up.

---

## Download

**[📥 Latest APK — v3.0.1](https://github.com/DosukaSOL/Vibeproof/releases/latest)** (Android / Solana Seeker)

---

## Features

### 🔐 Solana Wallet Authentication
- One-tap connect via Seeker Mobile Wallet Adapter
- No passwords, no emails — your wallet is your identity
- Mainnet-beta by default

### 🎯 Mission Engine
Three mission types with automatic verification:

**Daily Missions** — 4 rotate each day from a pool of 15
| Mission | Type | XP |
|---------|------|----|
| Make a Solana Transaction | On-chain TX | 100 |
| HODL Check (≥0.01 SOL) | Balance check | 50 |
| Daily Check-in | App action | 25 |
| Explore Solana | On-chain TX | 100 |
| Send SOL | Transfer | 80 |
| NFT Portfolio Check | Balance check | 40 |
| DeFi Interaction | On-chain TX | 90 |
| Token Swap | On-chain TX | 110 |
| Staking Check (≥0.05 SOL) | Balance check | 60 |
| Social Share | App action | 35 |
| Profile Visit | App action | 20 |
| Leaderboard Check | App action | 20 |
| Wallet Health Check | Balance check | 30 |
| Active Trader | On-chain TX | 120 |
| HODL Strong (≥0.1 SOL) | Balance check | 75 |

**Weekly Missions** — 2 rotate each Monday from a pool of 6
| Mission | Target | XP |
|---------|--------|----|
| Mission Marathon | 5 missions this week | 300 |
| Consistent Player | 3 check-ins this week | 200 |
| XP Hunter | 500 XP this week | 250 |
| Perfect Day | All 4 dailies in one day | 400 |
| Chain Runner | 3 days with TX activity | 350 |
| Streak Keeper | Maintain active streak | 300 |

**One-Time Missions** — 9 total, complete once ever
| Mission | Trigger | XP |
|---------|---------|-----|
| Connect Your Wallet | First connect | 200 |
| Set Your Username | Set username | 100 |
| Upload Profile Photo | Set avatar | 100 |
| Link X Account | OAuth link | 200 |
| Link GitHub Account | Device flow link | 200 |
| Star VibeProof on GitHub | Star the repo | 150 |
| Follow VibeProof on GitHub | Follow DosukaSOL | 100 |
| Diamond Hands 💎 | Hold ≥0.1 SOL | 250 |
| Daily Warrior | Complete first daily | 150 |

### 🏆 Achievements
17 achievements across 4 rarity tiers:

| Rarity | Achievements |
|--------|-------------|
| **Common** | First Steps, Named, Photographer, Rookie, Getting Warm (3-day streak) |
| **Rare** | Social Butterfly, Developer, Star Gazer, Worker (10 missions), On Fire (7-day streak), Rising Star (Level 5) |
| **Epic** | Grinder (50 missions), Diamond Streak (14 days), Veteran (Level 10), Whale (≥5000 XP) |
| **Legendary** | Centurion (100 missions), Legendary Streak (30 days) |

### 🎖️ Rank System
| Rank | XP Required | Icon |
|------|------------|------|
| Bronze | 0 | 🥉 |
| Silver | 1,000 | 🥈 |
| Gold | 5,000 | 🥇 |
| Platinum | 15,000 | 💠 |
| Diamond | 50,000 | 💎 |

### 🔥 Streak System
Daily login streaks with XP multipliers:
- **3-day streak** → 1.25x XP
- **7-day streak** → 1.5x XP
- **14-day streak** → 1.75x XP
- **30-day streak** → 2.0x XP

### 🔗 Social Linking
- **X (Twitter)** — PKCE OAuth flow, link/unlink, verified badge on profile
- **GitHub** — Device Code flow, link/unlink, star & follow verification

### 📊 Leaderboard
- Global ranking by XP
- Search by username or wallet address
- Tap any user to view their full profile
- Pull-to-refresh, infinite scroll

### 👤 Profile
- Avatar (camera or photo library)
- Editable username
- Stats panel: XP, Level, Streak, Missions Completed
- Profile completion meter (6-step checklist)
- Achievement badge grid
- Recent activity feed
- Share stats via native share sheet
- Rank badge display

### 🎓 Onboarding
4-step swipeable intro for new users covering missions, streaks, achievements, and getting started.

### ⚙️ Settings
- Toggle notifications, sound effects, haptics
- Disconnect wallet
- Clear all data (full account reset)
- Version info

### 🌐 Offline-First
- All data stored locally via AsyncStorage
- Works without internet — syncs when online
- Connectivity check banner (non-intrusive)

### 🎨 Design
- Dark-first GitHub-style theme (`#0D1117` background, `#3FB950` accent)
- Animated splash screen with logo spin + chime sound
- Haptic feedback throughout (10 haptic patterns)
- Sound effects system
- Level-up celebration overlay
- Smooth fade-in animations

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81.5 + Expo SDK 54 |
| Routing | expo-router v6 (file-based) |
| Wallet | Solana Mobile Wallet Adapter v2.2.5 |
| Blockchain | @solana/web3.js (mainnet-beta) |
| Backend | Supabase (PostgreSQL + Row Level Security) |
| Storage | AsyncStorage (offline-first) |
| Auth | Wallet-based + X OAuth + GitHub Device Flow |
| Build | EAS Build (local Android APK) |
| Language | TypeScript (strict) |

---

## Project Structure

```
app/
  index.tsx              # Animated splash screen
  onboarding.tsx         # 4-step intro
  settings.tsx           # App settings
  user-profile.tsx       # View other users
  x-callback.tsx         # X OAuth callback
  github-callback.tsx    # GitHub OAuth callback
  _layout.tsx            # Root stack + providers
  (tabs)/
    profile.tsx          # Profile tab
    missions.tsx         # Missions tab (daily/weekly/one-time)
    leaderboard.tsx      # Global leaderboard

components/              # 24 reusable components
  WalletButton, EngineMissionCard, XLinkCard,
  GitHubLinkCard, AchievementBadge, AvatarPicker,
  StatsPanel, StreakCard, RankBadge, ActivityFeed,
  LevelUpCelebration, OfflineBanner, ShareStatsCard,
  ProfileCompletionMeter, AnimatedPressable, FadeInView,
  AnimatedNumber, UserAvatar, ErrorBoundary, ...

hooks/                   # 8 custom hooks
  useWallet, useUser, useMissionEngine,
  useLeaderboard, useXLink, useGitHubLink,
  useColorScheme, useThemeColor

lib/                     # Core logic
  config.ts              # Environment config
  solana.ts              # Wallet adapter + MWA
  supabase.ts            # Supabase client
  localStore.ts          # AsyncStorage CRUD
  localVerify.ts         # Mission verification dispatcher
  verifyOnChain.ts       # Solana RPC verification
  verifyX.ts             # X post/follow verification
  xLink.ts              # X OAuth flow
  githubLink.ts          # GitHub device flow
  missionTemplates.ts    # 30+ mission definitions
  missionEngine.ts       # Mission state machine
  achievements.ts        # 17 achievement definitions
  ranks.ts               # 5-tier rank system
  theme.ts               # Design tokens
  haptics.ts             # 10 haptic patterns
  sounds.ts              # Sound effect system
  notifications.ts       # Daily push reminders
  animations.ts          # Shared animation utils

context/
  WalletContext.tsx       # Global wallet state
```

---

## Verification Types

VibeProof verifies missions locally and on-chain:

| Verification | How It Works |
|-------------|-------------|
| `on_chain_tx` | Checks recent Solana transactions via RPC |
| `on_chain_balance` | Verifies minimum SOL balance |
| `on_chain_transfer` | Confirms SOL transfer activity |
| `app_action` | Local checks (check-in, avatar, daily completions, weekly totals) |
| `social_link` | Whether X or GitHub is linked |
| `github_star` | GitHub API — starred the repo |
| `github_follow` | GitHub API — following DosukaSOL |
| `x_post_hashtag` | X post with specific hashtag |
| `x_follow` | Following a specific X account |

---

## Release History

### v3.0.1 — Bug Fixes (February 18, 2026)
- Fixed offline banner falsely showing "offline mode"
- Fixed GitHub linking "requires app configuration" error
- Fixed weekly missions "unknown app action" verification
- Fixed one-time mission "Daily Warrior" verification
- Improved error UX: "Not Yet Complete" instead of "Verification Failed"

### v3.0.0 — Major Feature Release (February 2026)
- 17 achievements across 4 rarity tiers
- 5-tier rank system (Bronze → Diamond)
- 4-step onboarding flow
- 6 weekly missions with rotation
- Settings screen (notifications, sounds, haptics, data management)
- Profile completion meter
- Activity feed
- Level-up celebration overlay
- Streak XP multipliers (up to 2x)
- Offline connectivity banner
- GitHub account linking (Device Code flow)
- GitHub star & follow missions
- Sound effects and haptic feedback system
- Share stats card
- Daily push notification reminders
- Enhanced leaderboard with search and user profiles

### v1.0.0 — First Stable Release (February 16, 2026)
- Animated splash screen with chime sound
- Solana wallet connect via Seeker Mobile Wallet Adapter
- Mission system with XP rewards (15 daily + one-time missions)
- Real-time leaderboard
- X (Twitter) account linking with PKCE OAuth
- User profile with stats and streaks
- Supabase backend with Row Level Security
- Offline-first local storage

---

## Contact

**X:** [@DosukaSOL](https://twitter.com/DosukaSOL)
**GitHub:** [DosukaSOL](https://github.com/DosukaSOL)

---

<p align="center">
  <strong>Built for humans who actually do stuff.</strong><br/>
  <em>Proof of action. On Solana.</em>
</p>


