import './Leaderboard.css'

const LEADERBOARD_DATA = [
  { rank: 1, username: 'Luna.sol', xp: 15230, medals: '🥇' },
  { rank: 2, username: 'VibeMaster', xp: 14890, medals: '🥈' },
  { rank: 3, username: 'SolanaGhost', xp: 13450, medals: '🥉' },
  { rank: 4, username: 'XPHunter', xp: 12340 },
  { rank: 5, username: 'CryptoVibe', xp: 11890 },
  { rank: 6, username: 'EchoWave', xp: 10230 },
  { rank: 7, username: 'NeonVibe', xp: 9876 },
  { rank: 8, username: 'SonicBlast', xp: 9120 },
  { rank: 9, username: 'MoonWalker', xp: 8765 },
  { rank: 10, username: 'StarDust', xp: 8234 },
]

export default function Leaderboard() {
  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>Leaderboard</h1>
        <p>Ranked by XP</p>
      </div>

      <div className="leaderboard-table">
        <div className="table-header">
          <div className="col-rank">Rank</div>
          <div className="col-user">User</div>
          <div className="col-xp">XP</div>
        </div>

        {LEADERBOARD_DATA.map((user) => (
          <div key={user.rank} className="table-row">
            <div className="col-rank">
              <span className="rank-badge">{user.medals || user.rank}</span>
            </div>
            <div className="col-user">
              <span className="username">{user.username}</span>
            </div>
            <div className="col-xp">
              <span className="xp-value">{user.xp.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
