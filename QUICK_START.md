# VibeProof Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Setup Environment
```bash
# Create .env.local in project root
echo "EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co" > .env.local
echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ..." >> .env.local
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Setup Supabase Database
1. Go to https://supabase.com
2. Create new project
3. Copy SQL from `docs/supabase_setup.sql`
4. Run in Supabase SQL Editor
5. Add sample missions (or create your own)

### Step 4: Start Development
```bash
npm start
```

Then:
- Press `i` (iOS simulator)
- Press `a` (Android emulator)
- Scan QR with Expo Go app

---

## 📱 Testing Locally

### Without Wallet (Limited Testing)
- Can test UI/UX
- Cannot test actual wallet connection
- Use Expo Go app

### With Wallet (Full Testing)
Requires:
1. Build dev client: `eas build --platform android --profile development`
2. Install on device with Seeker
3. Test real wallet connection

---

## 🧪 Test Cases

### Profile Tab
- [ ] Connect button visible when not connected
- [ ] Click "Connect Solana Wallet"
- [ ] Seeker opens (if on device with Seeker)
- [ ] Approve in Seeker
- [ ] Return to app with wallet address
- [ ] Display wallet and stats
- [ ] Enter username, click Save
- [ ] Verify in Supabase: users table
- [ ] Click Disconnect
- [ ] Verify session cleared

### Missions Tab
- [ ] Shows "Connect wallet" if not connected
- [ ] Shows missions list when connected
- [ ] Each mission shows icon, title, description, XP reward
- [ ] Click "Complete" button
- [ ] Enter proof/message
- [ ] Click "Submit"
- [ ] Verify in Supabase: completions table
- [ ] Mission marked as "Completed"

### Leaderboard Tab
- [ ] Shows top 50 users by XP
- [ ] Shows rank, username, XP, level
- [ ] Current user highlighted
- [ ] Pull-to-refresh works
- [ ] Scroll to bottom loads more users
- [ ] XP order is descending (highest first)

---

## 🐛 Debugging

### No environments loading
```bash
# Check .env.local exists
ls -la .env.local

# Should output: 2 vars
env | grep EXPO_PUBLIC
```

### App crashes on startup
```bash
# Check logs
npm start -- --clear

# Watch console for errors
# Common: missing Supabase URL/key
```

### Wallet connect fails
```bash
# On device with Seeker:
# 1. Ensure Seeker app installed
# 2. Ensure wallet created in Seeker
# 3. Check Seeker has mainnet cluster selected
# 4. Try disconnect and reconnect
```

### Missions not loading
```bash
# Check Supabase:
SELECT * FROM missions WHERE active = true;

# If empty, insert sample:
INSERT INTO missions (title, description, mission_type, xp_reward)
VALUES ('Test Mission', 'Complete this test', 'follow', 100);
```

---

## 📊 Database Queries

Check your data in Supabase SQL Editor:

```sql
-- Users
SELECT * FROM users;

-- Missions
SELECT * FROM missions WHERE active = true;

-- Completions
SELECT * FROM completions ORDER BY created_at DESC;

-- Check RLS policies
SELECT * FROM information_schema.table_privileges WHERE table_name = 'users';
```

---

## 🔧 Useful Commands

```bash
# Start dev server
npm start

# Lint code
npm run lint

# Build for Android
eas build --platform android --profile development

# Submit to Play Store
eas submit --platform android

# Clear Expo cache
npm start -- --clear

# Check environment variables
env | grep EXPO_PUBLIC
```

---

## ✅ Verification Checklist

When app loads:
- [ ] No red error messages
- [ ] Profile tab visible
- [ ] Missions tab visible  
- [ ] Leaderboard tab visible
- [ ] Connect button works
- [ ] Has Solana and Supabase icons

When connected:
- [ ] Wallet address displays
- [ ] Stats show (Level, XP, Rank, Streak)
- [ ] Can save username
- [ ] Missions load
- [ ] Can submit mission
- [ ] Leaderboard shows users
- [ ] Can refresh all screens

---

## 📝 Notes

- First user creation creates record in `users` table
- XP awarded when mission completed
- Levels calculated as: `floor(xp / 1000) + 1`
- Ranks recalculated on each leaderboard refresh
- Sessions expire after 30 days
- Usernames unique per user

---

## 🆘 Get Help

1. Check **README.md** for full setup guide
2. Check **DEPLOYMENT_CHECKLIST.md** before production
3. Review **docs/supabase_setup.sql** for schema
4. Check console logs: `npm start` shows errors

---

Built with ❤️ for Solana
