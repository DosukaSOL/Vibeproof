# VibeProof

A proof-of-action gaming platform for Solana. Connect your wallet, complete missions, earn XP, and climb the leaderboard.

## Features

✅ **Solana Wallet Integration** - Connect via Seeker (Solana Mobile Wallet Adapter)  
✅ **Missions System** - Complete curated actions to earn XP  
✅ **User Profiles** - Username, stats, and identity tracking  
✅ **Leaderboard** - Real-time rankings by XP  
✅ **Progression** - XP, levels, ranks, and streaks  
✅ **Production Ready** - Secure, typed, tested  

---

## Tech Stack

- **Frontend**: Expo, React Native, TypeScript
- **Navigation**: Expo Router
- **Wallet**: Solana Mobile Wallet Adapter (Seeker)
- **Backend**: Supabase (PostgreSQL + RLS)
- **State**: React Hooks + Custom Hooks
- **Build**: EAS Build

---

## Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- Solana Seeker app installed on test device (for Android testing)
- Supabase account (free tier OK)

---

## Setup

### 1. Clone Repository

```bash
git clone https://github.com/DosukaSOL/Vibeproof.git
cd Vibeproof
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your **Project URL** and **Anon Key** (from Settings > API)

#### Setup Database Schema
1. Go to SQL Editor in Supabase dashboard
2. Paste the contents of `docs/supabase_setup.sql`
3. Execute all queries

This creates:
- `users` table (profile data)
- `missions` table (available quests)
- `completions` table (mission submissions)
- Helper functions and RLS policies

#### Insert Sample Missions (Optional)
In SQL Editor, run:
```sql
insert into public.missions (title, description, mission_type, xp_reward)
values 
  ('Follow on X', 'Follow @vibeproof on X', 'follow', 100),
  ('Join Discord', 'Join our community', 'join', 150),
  ('Share a Post', 'Post about VibeProof', 'post', 200);
```

### 4. Configure Environment Variables

Create `.env.local` (or `.env` in root):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your_long_anon_key
```

**How to get these:**
- URL: In Supabase → Settings → API → Project URL
- Anon Key: In Supabase → Settings → API → `anon` key

### 5. Start Development Server

```bash
npm start
```

This opens Expo Go. Options:
- Press `i` for iOS simulator (macOS only)
- Press `a` for Android emulator
- Scan QR code with Expo Go app (mobile)

---

## Project Structure

```
app/
├── _layout.tsx          # Root navigation
└── (tabs)/
    ├── _layout.tsx      # Tab navigation
    ├── profile.tsx      # User profile & wallet connect
    ├── missions.tsx     # Available missions
    └── leaderboard.tsx  # User rankings

lib/
├── config.ts            # App configuration
├── auth.ts              # Session management
├── solana.ts            # Solana wallet integration
└── supabase.ts          # Database client & queries

hooks/
├── useWallet.ts         # Wallet state hook
├── useUser.ts           # User profile hook
├── useMissions.ts       # Missions hook
└── useLeaderboard.ts    # Leaderboard hook

components/
├── WalletButton.tsx     # Connect/disconnect button
├── MissionCard.tsx      # Mission display component
└── StatsPanel.tsx       # User stats display

docs/
└── supabase_setup.sql   # Database schema
```

---

## Development Workflow

### Test Locally
```bash
npm start
```
- Use Expo Go on phone or simulator
- Wallet connection limited to dev client

### Build Dev Client
```bash
eas build --platform android --profile development
```

### Build for Preview/Production
```bash
eas build --platform android --profile preview
# or
eas build --platform android --profile production
```

### Submit to Google Play
```bash
eas submit --platform android
```

---

## Wallet Integration

### How It Works

1. **Connect** → User presses "Connect Solana Wallet"
2. **Deep Link** → App opens Seeker (Solana Mobile Wallet)
3. **Authorize** → User approves transaction in Seeker
4. **Return** → Seeker returns to VibeProof with auth token
5. **Store** → Session saved securely (AsyncStorage + SecureStore)
6. **Reconnect** → Session restored on app restart

### Flow Details

- Uses `@solana-mobile/mobile-wallet-adapter-protocol-web3js`
- Deep link scheme: `vibeproof://`
- Handled by `lib/solana.ts` and `hooks/useWallet.ts`
- Fallback: No demo wallets. Real wallet required.

---

## Database Operations

### Create New User
```typescript
import { upsertUser } from '@/lib/supabase';

const user = await upsertUser('wallet_address_here', 'username');
```

### Get Leaderboard
```typescript
import { getLeaderboard } from '@/lib/supabase';

const topUsers = await getLeaderboard(50, 0); // Top 50, page 0
```

### Submit Mission Completion
```typescript
import { submitMissionCompletion } from '@/lib/supabase';

const completion = await submitMissionCompletion(
  walletAddress,
  missionId,
  'proof_data_here'
);
```

### Add XP
```typescript
import { addUserXP } from '@/lib/supabase';

const updated = await addUserXP(walletAddress, 100);
```

---

## Styling

All components use inline `StyleSheet` patterns. Color scheme:

- **Primary**: `#7C3AED` (violet)
- **Success**: `#22C55E` (green)
- **Error**: `#EF4444` (red)
- **Background**: `#F8F9FA` (light gray)
- **Border**: `#E5E7EB` (gray)

To customize: Edit style objects in component files.

---

## RLS Policies

Supabase uses Row Level Security (RLS) for security:

| Table | Select | Insert | Update | Notes |
|-------|--------|--------|--------|-------|
| users | Public | Anyone | Anyone | Public profiles |
| missions | Active only | Admin | Admin | Users see active missions |
| completions | Own only | Anyone | Backend | Users submit, backend verifies |

---

## Common Issues

### "Config validation failed"
Missing environment variables. Create `.env.local` with Supabase keys.

### "No wallet account returned"
Seeker app not installed or not authorized. Must approve on device.

### "Username taken"
Choose a different username. Usernames are unique per user.

### "Mission not found"
Ensure missions exist in Supabase `missions` table and `active = true`.

---

## Testing Checklist

- [ ] Wallet connects successfully
- [ ] Username saves without errors
- [ ] Profile shows correct stats
- [ ] Missions load from database
- [ ] Can submit mission completion
- [ ] Leaderboard shows top users
- [ ] Pull-to-refresh works
- [ ] Disconnect clears session
- [ ] App survives hot reload
- [ ] No console errors

---

## Deployment

### To Google Play

1. **Prepare**
   ```bash
   eas build --platform android --profile production
   ```

2. **Submit**
   ```bash
   eas submit --platform android
   ```

3. **Review** → Google reviews the app (typically 1-3 hours)

4. **Launch** → Once approved, set availability in Play console

### To App Store (iOS)

1. Similar process, use `--platform ios`
2. Requires Apple Developer account ($99/year)
3. One-time: Generate signing credentials with `eas credentials`

---

## Security Notes

- Never commit `.env` or `.env.local`
- Use Supabase RLS for data access control
- Wallet signatures verified on client (for demo)
- Sessions expire after 30 days
- Use HTTPS for all URLs

---

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push: `git push origin feature/your-feature`
4. Open PR on GitHub

---

## Support

- GitHub Issues: [Report bugs](https://github.com/DosukaSOL/Vibeproof/issues)
- Discussions: [Ask questions](https://github.com/DosukaSOL/Vibeproof/discussions)
- Twitter: [@vibeproof](https://twitter.com/vibeproof)

---

## License

MIT License - See LICENSE file

---

## Roadmap

- [ ] Transaction verification (on-chain XP)
- [ ] Badges/achievements system
- [ ] Social sharing features
- [ ] NFT rewards
- [ ] Mobile app store listings
- [ ] Web dashboard
- [ ] API for third-party integrations

---

**Built with ❤️ for Solana mobile.**


