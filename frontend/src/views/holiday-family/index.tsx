// src/views/holiday-family/index.tsx
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { authApi, type UserMe } from '@/services/modules/auth'
import './index.scss'

export default function HolidayFamilyPage() {
  const navigate = useNavigate()
  const { user, reloadMe } = useAuth()
  const [certifiedUsers, setCertifiedUsers] = useState<UserMe[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // 页面加载时刷新用户数据，确保获取最新的 is_holiday_family_certified 状态
  useEffect(() => {
    if (user) {
      reloadMe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 加载认证过的 Holiday Family 用户
  useEffect(() => {
    const loadCertifiedUsers = async () => {
      setLoadingUsers(true)
      try {
        const { data } = await authApi.getCertifiedUsers()
        setCertifiedUsers(data)
      } catch (error) {
        console.error('Failed to load certified users:', error)
      } finally {
        setLoadingUsers(false)
      }
    }
    
    loadCertifiedUsers()
  }, [])

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
        <p className="subtitle">Help pets find perfect holiday homes with caring families</p>
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

        {!user?.is_holiday_family_certified && (
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
        )}

        <div className="certified-section">
          <h2>🌟 Our Verified Holiday Families</h2>
          <p className="certified-subtitle">Meet the wonderful families who have been verified and are ready to provide loving homes for our pets!</p>
          {loadingUsers ? (
            <div className="text-center py-4">
              <p>Loading verified families...</p>
            </div>
          ) : certifiedUsers.length > 0 ? (
            <div className="certified-families-grid">
              {certifiedUsers.map((certUser) => (
                <div 
                  key={certUser.id} 
                  className="family-card"
                  onClick={() => navigate(`/user/profile/${certUser.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="family-avatar">
                    {certUser.avatar && typeof certUser.avatar === 'string' ? (
                      <img 
                        src={certUser.avatar} 
                        alt={certUser.username}
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/120?text=Avatar'
                        }}
                      />
                    ) : (
                      <div className="placeholder-avatar">
                        <i className="bi bi-person-circle"></i>
                      </div>
                    )}
                    <div className="verified-badge">
                      <i className="bi bi-check-circle-fill"></i>
                    </div>
                  </div>
                  <div className="family-info">
                    <h4>{certUser.first_name || certUser.username}</h4>
                    <p className="family-username">@{certUser.username}</p>
                    {certUser.email && (
                      <p className="family-email">
                        <i className="bi bi-envelope"></i> {certUser.email}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-families" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontSize: '18px', color: '#666' }}>No verified families yet. Be the first to apply!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
