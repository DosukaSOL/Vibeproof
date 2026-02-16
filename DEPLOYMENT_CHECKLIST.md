#!/bin/bash
# VibeProof Deployment Checklist

# ========== PRE-DEPLOYMENT CHECKLIST ==========
echo "✅ VibeProof Pre-Deployment Checklist"
echo ""

# 1. Environment Setup
echo "Step 1: Environment Configuration"
echo "--------"
echo "[ ] Create .env.local with Supabase credentials:"
echo "    EXPO_PUBLIC_SUPABASE_URL=your_url"
echo "    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key"
echo ""

# 2. Supabase Setup
echo "Step 2: Supabase Backend Setup"
echo "--------"
echo "[ ] Create Supabase project"
echo "[ ] Run SQL migration: docs/supabase_setup.sql"
echo "[ ] Verify all tables created (users, missions, completions)"
echo "[ ] Enable RLS on all tables (done in migration)"
echo "[ ] Insert sample missions (optional)"
echo ""

# 3. Git Status
echo "Step 3: Source Control"
echo "--------"
echo "[ ] All changes committed to main branch"
echo "[ ] No uncommitted changes (git status clean)"
echo ""

# 4. Dependencies
echo "Step 4: Dependencies"
echo "--------"
echo "[ ] npm install completed without errors"
echo "[ ] package-lock.json committed"
echo ""

# 5. Code Quality
echo "Step 5: Code Quality"
echo "--------"
echo "[ ] npm run lint passed"
echo "[ ] No TypeScript errors"
echo "[ ] All imports verified"
echo "[ ] No circular dependencies"
echo ""

# 6. Development Testing
echo "Step 6: Development Testing"
echo "--------"
echo "[ ] npm start works"
echo "[ ] App loads in Expo Go / development client"
echo "[ ] Profile tab loads"
echo "[ ] Missions tab loads"
echo "[ ] Leaderboard tab loads"
echo ""

# 7. Wallet Integration
echo "Step 7: Wallet Integration"
echo "--------"
echo "[ ] Seeker app installed on test device"
echo "[ ] Wallet connect button visible"
echo "[ ] Can initiate wallet connection"
echo "[ ] Connection returns to app successfully"
echo "[ ] Wallet address displays correctly"
echo "[ ] Disconnect works properly"
echo ""

# 8. User Creation
echo "Step 8: User Profile"
echo "--------"
echo "[ ] Can create user in Supabase"
echo "[ ] Username validation works"
echo "[ ] Username uniqueness enforced"
echo "[ ] Profile updates without errors"
echo ""

# 9. Missions
echo "Step 9: Missions"
echo "--------"
echo "[ ] Missions load from database"
echo "[ ] Mission list displays correctly"
echo "[ ] Can view mission details"
echo "[ ] Can submit mission completion"
echo "[ ] Proof validation works"
echo ""

# 10. Leaderboard
echo "Step 10: Leaderboard"
echo "--------"
echo "[ ] Leaderboard displays users"
echo "[ ] Ranking order is correct (by XP)"
echo "[ ] Pagination works"
echo "[ ] Pull-to-refresh works"
echo "[ ] Current user highlighted"
echo ""

# 11. Build Testing
echo "Step 11: Build Configuration"
echo "--------"
echo "[ ] app.json configured correctly"
echo "[ ] app.json scheme matches deep linking"
echo "[ ] eas.json exists and valid"
echo "[ ] EAS project ID correct"
echo ""

# 12. Production Build
echo "Step 12: Production Build"
echo "--------"
echo "[ ] eas build --platform android --profile production works"
echo "[ ] Build completes without errors"
echo "[ ] APK/AAB generated successfully"
echo ""

# 13. Deployment
echo "Step 13: App Store Deployment"
echo "--------"
echo "[ ] Google Play Developer account active"
echo "[ ] App listings created"
echo "[ ] Release notes prepared"
echo "[ ] Screenshots prepared"
echo "[ ] Privacy policy linked"
echo "[ ] APK uploaded to Play Console"
echo ""

# 14. Final Verification
echo "Step 14: Final Verification"
echo "--------"
echo "[ ] App builds successfully"
echo "[ ] No runtime errors"
echo "[ ] Wallet functionality confirmed"
echo "[ ] All tabs accessible"
echo "[ ] Data persists correctly"
echo "[ ] Performance acceptable"
echo ""

echo "=========================================="
echo "✅ All items checked? Ready to deploy!"
echo "=========================================="
