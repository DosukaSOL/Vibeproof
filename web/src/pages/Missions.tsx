import { useState } from 'react'
import './Missions.css'

const SAMPLE_MISSIONS = [
  {
    id: 1,
    title: 'Follow @VibeProof',
    description: 'Follow our official Twitter account',
    type: 'follow',
    xp_reward: 100,
    completed: false,
  },
  {
    id: 2,
    title: 'Join Discord',
    description: 'Join our community Discord server',
    type: 'join',
    xp_reward: 150,
    completed: true,
  },
  {
    id: 3,
    title: 'Verify Wallet',
    description: 'Connect and verify your Solana wallet',
    type: 'verify',
    xp_reward: 200,
    completed: true,
  },
  {
    id: 4,
    title: 'Share a Post',
    description: 'Share VibeProof on your social media',
    type: 'post',
    xp_reward: 250,
    completed: false,
  },
]

export default function Missions() {
  const [missions] = useState(SAMPLE_MISSIONS)
  const [submitting, setSubmitting] = useState<number | null>(null)

  const handleSubmit = (id: number) => {
    setSubmitting(id)
    setTimeout(() => setSubmitting(null), 1000)
  }

  return (
    <div className="missions-container">
      <div className="missions-header">
        <h1>Missions</h1>
        <p>Earn XP by completing actions</p>
      </div>

      <div className="missions-list">
        {missions.map((mission) => (
          <div key={mission.id} className="mission-card">
            <div className="mission-content">
              <div className="mission-header">
                <h3>{mission.title}</h3>
                <span className={`mission-type ${mission.type}`}>
                  {mission.type}
                </span>
              </div>
              <p className="mission-description">{mission.description}</p>
              <p className="mission-xp">+{mission.xp_reward} XP</p>
            </div>

            {mission.completed ? (
              <div className="mission-completed">✓ Completed</div>
            ) : (
              <button
                className="mission-submit-btn"
                onClick={() => handleSubmit(mission.id)}
                disabled={submitting === mission.id}
              >
                {submitting === mission.id ? 'Submitting...' : 'Submit'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
