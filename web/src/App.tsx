import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './App.css'
import logo from './assets/logo.png'
import Leaderboard from './pages/Leaderboard'
import Missions from './pages/Missions'
import Profile from './pages/Profile'

export default function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <img src={logo} alt="VibeProof" className="logo" />
          <div className="nav-links">
            <Link to="/">Profile</Link>
            <Link to="/missions">Missions</Link>
            <Link to="/leaderboard">Leaderboard</Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Profile />} />
            <Route path="/missions" element={<Missions />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}
