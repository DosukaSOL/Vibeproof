<p align="center">
  <img src="assets/logo.png" alt="VibeProof logo" width="180" />
</p>

<h1 align="center">VibeProof</h1>
<p align="center"><b>On-chain proof of consistency.</b><br/>Turn daily actions into XP, streaks, rank, and reputation.</p>

<p align="center">
  <a href="#what-is-vibeproof">What is VibeProof</a> •
  <a href="#how-it-works">How it Works</a> •
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#local-development">Local Development</a> •
  <a href="#security--rls">Security & RLS</a> •
  <a href="#roadmap">Roadmap</a>
</p>

---

## What is VibeProof

**VibeProof** is a lightweight mobile app that turns daily missions into a measurable identity layer:
- **XP** for completing missions  
- **Streaks** for consistency  
- **Rank** based on XP (leaderboard)  
- A profile that reflects your progress over time

The goal: make consistency *visible* and *verifiable*.

---

## How it Works

1. **Connect wallet** (local session)
2. App loads your **profile + stats** from Supabase
3. You complete missions → recorded as **quest completions**
4. XP/streaks update → leaderboard recalculates rank

---

## Features

- ✅ Wallet identity + username
- ✅ XP / level progression
- ✅ Daily streak logic + check-in tracking
- ✅ Missions (quests) list
- ✅ Completion tracking (prevents double completes)
- ✅ Leaderboard: Top 50 by XP
- ✅ Row Level Security (RLS) policies enabled

---

## Tech Stack

- **Expo / React Native**
- **TypeScript**
- **Supabase** (Postgres + RLS)
- **File-based routing** (`app/`)

---

## Local Development

### 1) Install
```bash
npm install
