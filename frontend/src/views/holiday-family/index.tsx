// src/views/holiday-family/index.tsx
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import './index.scss'

export default function HolidayFamilyPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleApplyClick = () => {
    if (!user) {
      navigate('/auth/login')
    } else {
      navigate('/holiday-family/apply')
    }
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="page-header">
        <h1>🎄 Holiday Family</h1>
        <p className="subtitle">Celebrate the holidays with your furry friends and create lasting memories</p>
        <div className="page-header-underline"></div>
      </div>

      <div className="holiday-family-container">
        <div className="intro-section">
          <h2>Give Pets a Special Holiday Season</h2>
          <p>
            Our Holiday Family program connects loving families with pets who need a temporary home during the holiday season. 
            If you're passionate about pets and want to make a difference, we'd love to have you join our community!
          </p>

          <div className="features">
            <div className="feature-card">
              <div className="feature-icon">🏡</div>
              <h3>Safe & Temporary Home</h3>
              <p>Provide a loving temporary home for a pet during holidays</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">❤️</div>
              <h3>Make a Difference</h3>
              <p>Help reduce overcrowding in shelters during busy seasons</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👨‍👩‍👧‍👦</div>
              <h3>Family Bonding</h3>
              <p>Create unforgettable memories with your family and pets</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Community Support</h3>
              <p>Join a community of pet lovers and make new friends</p>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <h2>Ready to Become a Holiday Family?</h2>
          <p>Apply today and help a pet have the best holiday season ever!</p>
          <button 
            className="apply-btn"
            onClick={handleApplyClick}
            type="button"
          >
            {user ? '📝 Apply Now' : '🔓 Login to Apply'}
          </button>
        </div>

        <div className="info-section">
          <h2>How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Apply</h3>
              <p>Submit your application with your family information</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Review</h3>
              <p>Our team reviews your application</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Match</h3>
              <p>We match you with a suitable pet</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Celebrate</h3>
              <p>Enjoy the holidays with your temporary furry friend!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
