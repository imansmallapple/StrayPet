// src/views/holiday-family/index.tsx
import { useNavigate } from 'react-router-dom'
import './index.scss'

export default function HolidayFamilyPage() {
  const navigate = useNavigate()

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="page-header">
        <h1>🎄 Holiday Family</h1>
        <p className="subtitle">Celebrate the holidays with your furry friends and create lasting memories</p>
        <div className="page-header-underline"></div>
      </div>

      <div className="holiday-family-container">
        <div className="content-section">
          <h2>Coming Soon</h2>
          <p>We're preparing special holiday activities and features for you and your pets!</p>
          <button 
            className="back-btn"
            onClick={() => navigate('/')}
            type="button"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
