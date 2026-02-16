import { useState } from 'react'
import './Profile.css'

export default function Profile() {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [username, setUsername] = useState('Anonymous Vibester')
  const [level, setLevel] = useState(5)
  const [xp, setXp] = useState(3450)

  const handleConnect = () => {
    setIsConnected(true)
    setAddress('9B5X...7nK2')
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setAddress(null)
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile</h1>
        <p>Manage your identity and wallet</p>
      </div>

      {!isConnected ? (
        <div className="connect-card">
          <h2>🔐 Wallet Not Connected</h2>
          <p>Connect your Solana wallet to start earning XP</p>
          <button className="btn-primary" onClick={handleConnect}>
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          <div className="wallet-card">
            <h2>Wallet Connected</h2>
            <p className="wallet-address">{address}</p>
            <button className="btn-secondary" onClick={handleDisconnect}>
              Disconnect
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-icon">⭐</span>
              <div className="stat-content">
                <p className="stat-label">Level</p>
                <p className="stat-value">{level}</p>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💫</span>
              <div className="stat-content">
                <p className="stat-label">XP</p>
                <p className="stat-value">{xp}</p>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🏆</span>
              <div className="stat-content">
                <p className="stat-label">Rank</p>
                <p className="stat-value">42</p>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🔥</span>
              <div className="stat-content">
                <p className="stat-label">Streak</p>
                <p className="stat-value">7 days</p>
              </div>
            </div>
          </div>

          <div className="username-card">
            <h3>Username</h3>
            <p className="current-username">{username}</p>
            <div className="input-group">
              <input
                type="text"
                placeholder="Enter new username"
                className="input"
              />
              <button className="btn-primary">Update</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
