// src/views/donation/index.tsx
import { useState, useEffect } from 'react'
import './index.scss'
import { shelterApi, type Shelter } from '@/services/modules/shelter'
import PageHeroTitle from '@/components/page-hero-title'

export default function DonationPage() {
  const [shelters, setShelters] = useState<Shelter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchShelters()
  }, [])

  const fetchShelters = async () => {
    try {
      setLoading(true)
      // 调用后端 API 获取收容所列表
      const response = await shelterApi.list({ is_active: true })
      setShelters(response.data.results || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching shelters:', err)
      setError('Failed to load shelter list')
      setShelters([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="donation-page">
      <PageHeroTitle 
        title="Found a Lost or Stray Pet" 
        subtitle="If you find a lost pet outside, don't assume it has no owner. The pet might just be lost, and someone might be frantically searching for it."
      />
      
      <div className="donation-container">
        <div className="donation-intro">
          <div className="donation-alert">
            <div className="alert-content">
              <h3 className="alert-title">If you find a lost dog outside, you have a responsibility to notify your local shelter first.</h3>
              <p className="alert-description">
                We appreciate your effort in finding a lost pet. Please contact the shelter below - they will help you reunite the pet with its owner or provide proper care for the animal.
              </p>
            </div>
          </div>
        </div>

        {/* 操作指南部分 */}
        <div className="donation-section">
          <h2 className="section-title">What to Do When You Find a Pet</h2>
          <div className="guides-grid">
            <article className="guide-card">
              <div className="guide-number">1</div>
              <h3 className="guide-title">Walk the Dog Around the Neighborhood</h3>
              <p className="guide-text">
                Check the dog's tag and ask nearby residents if they recognize the dog. Most lost dogs hide close to home. Someone nearby might help you locate the owner.
              </p>
            </article>

            <article className="guide-card">
              <div className="guide-number">2</div>
              <h3 className="guide-title">Post Photos on Social Media & Community Groups</h3>
              <p className="guide-text">
                Use social media to share pet information quickly. Utilize multiple platforms and neighborhood networks, including local forums. Nextdoor and Neighbors by Ring help you reach the community and increase chances of finding the owner.
              </p>
            </article>

            <article className="guide-card">
              <div className="guide-number">3</div>
              <h3 className="guide-title">Check for a Microchip</h3>
              <p className="guide-text">
                Most veterinary clinics and pet stores have microchip scanners and can scan for free. This can help identify the owner and facilitate quick reunification.
              </p>
            </article>

            <article className="guide-card">
              <div className="guide-number">4</div>
              <h3 className="guide-title">Report the Lost Pet</h3>
              <p className="guide-text">
                Contact your local animal shelter and inform them you've found a lost dog. This will help the owner find their pet once they're notified.
              </p>
            </article>
          </div>
        </div>

        {/* 收容所列表部分 */}
        <div className="donation-section">
          <h2 className="section-title">Find a Local Animal Shelter Near You</h2>
          
          {error && (
            <div className="error-alert">
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading shelters...</p>
            </div>
          ) : shelters.length === 0 ? (
            <div className="empty-alert">
              <p>No shelter information available at this time. Please try again later.</p>
            </div>
          ) : (
            <div className="shelters-grid">
              {shelters.map((shelter) => (
                <article key={shelter.id} className="shelter-card">
                  <div className="shelter-header">
                    <h3 className="shelter-name">
                      {shelter.name}
                      {shelter.is_verified && (
                        <span className="verified-badge">Verified</span>
                      )}
                    </h3>
                  </div>

                  <p className="shelter-description">
                    {shelter.description}
                  </p>

                  <div className="shelter-info">
                    <div className="info-item">
                      <strong>Capacity:</strong>
                      <span>{shelter.current_animals} / {shelter.capacity}</span>
                    </div>
                    <div className="info-item">
                      <strong>Founded:</strong>
                      <span>{shelter.founded_year || 'Unknown'}</span>
                    </div>
                  </div>

                  <div className="shelter-contact">
                    {shelter.email && (
                      <div className="contact-item">
                        <i className="bi bi-envelope"></i>
                        <a href={`mailto:${shelter.email}`}>{shelter.email}</a>
                      </div>
                    )}
                    {shelter.phone && (
                      <div className="contact-item">
                        <i className="bi bi-telephone"></i>
                        <a href={`tel:${shelter.phone}`}>{shelter.phone}</a>
                      </div>
                    )}
                    {shelter.website && (
                      <div className="contact-item">
                        <i className="bi bi-globe"></i>
                        <a href={shelter.website} target="_blank" rel="noopener noreferrer">
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="shelter-social">
                    {shelter.facebook_url && (
                      <a href={shelter.facebook_url} target="_blank" rel="noopener noreferrer" className="social-link" title="Facebook">
                        <i className="bi bi-facebook"></i>
                      </a>
                    )}
                    {shelter.instagram_url && (
                      <a href={shelter.instagram_url} target="_blank" rel="noopener noreferrer" className="social-link" title="Instagram">
                        <i className="bi bi-instagram"></i>
                      </a>
                    )}
                    {shelter.twitter_url && (
                      <a href={shelter.twitter_url} target="_blank" rel="noopener noreferrer" className="social-link" title="Twitter">
                        <i className="bi bi-twitter"></i>
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
