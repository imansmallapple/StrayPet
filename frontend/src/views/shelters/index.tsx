// src/views/shelters/index.tsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { shelterApi, type Shelter } from '@/services/modules/shelter'
import { useAuth } from '@/hooks/useAuth'
import CreateShelter from './components/CreateShelter'
import PageHeroTitle from '@/components/page-hero-title'
import Pagination from '@/components/Pagination'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './index.scss'

// Compact MapboxMap component for shelter cards
type MapboxMapProps = {
  lon?: number
  lat?: number
  className?: string
  width?: string | number
  height?: number
}

function ShelterMapPreview({ lon, lat, className, width = '100%', height = 180 }: MapboxMapProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)

  // 点击地图打开 Google Maps
  const handleMapClick = useCallback(() => {
    if (typeof lon === 'number' && typeof lat === 'number') {
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
      window.open(googleMapsUrl, '_blank')
    }
  }, [lat, lon])

  useEffect(() => {
    if (!ref.current || typeof lon !== 'number' || typeof lat !== 'number') return
    
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!token) {
      console.warn('Mapbox token missing: set VITE_MAPBOX_TOKEN')
      return
    }

    // Check WebGL support before creating map
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) {
      console.warn('WebGL not supported, will use static image fallback')
      return
    }

    try {
      mapboxgl.accessToken = token

      const map = new mapboxgl.Map({
        container: ref.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lon, lat],
        zoom: 13,
        interactive: true, // 允许交互
      })

      // 添加导航控件
      map.addControl(new mapboxgl.NavigationControl(), 'top-right')

      // 创建标记
      new mapboxgl.Marker()
        .setLngLat([lon, lat])
        .addTo(map)
      
      // 地图点击打开 Google Maps
      map.on('click', handleMapClick)
      
      mapInstanceRef.current = map
    } catch (error) {
      console.error('Failed to initialize Mapbox map, will use static fallback:', error)
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch (e) {
          console.warn('Error removing map:', e)
        }
        mapInstanceRef.current = null
      }
    }
  }, [lat, lon, handleMapClick])

  // If no coordinates, show placeholder
  if (typeof lon !== 'number' || typeof lat !== 'number') {
    return (
      <div 
        className={className} 
        style={{ 
          width, 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          color: '#6c757d'
        }}
      >
        <i className="bi bi-map fs-3"></i>
      </div>
    )
  }

  // Show static map image as fallback
  const token = import.meta.env.VITE_MAPBOX_TOKEN
  if (!token) {
    return (
      <div 
        className={className} 
        style={{ 
          width, 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          color: '#6c757d'
        }}
      >
        <i className="bi bi-map fs-3"></i>
      </div>
    )
  }

  const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+7c3aed(${lon},${lat})/${lon},${lat},13,0/400x${height}@2x?access_token=${token}`
  
  return (
    <div 
      style={{ position: 'relative', width, height, cursor: 'pointer' }}
      onClick={handleMapClick}
      title="Click to view in Google Maps"
    >
      {/* Static map as background/fallback */}
      <img 
        src={staticMapUrl} 
        alt="Map location"
        className={className}
        style={{ 
          width, 
          height, 
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />
      {/* Interactive map container overlays the static image */}
      <div ref={ref} className={className} style={{ width, height, position: 'relative', zIndex: 1 }} />
      
      {/* Google Maps 图标提示 */}
      <div 
        style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          backgroundColor: 'white',
          borderRadius: '4px',
          padding: '4px 8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          fontSize: '12px',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <i className="bi bi-box-arrow-up-right"></i>
        <span>View in Maps</span>
      </div>
    </div>
  )
}

export default function SheltersPage() {
  const { user } = useAuth()
  const isAdmin = user?.is_staff || false
  const [shelters, setShelters] = useState<Shelter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadShelters = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await shelterApi.list({ 
        is_active: true,
        page: currentPage,
        page_size: 12  // 每页显示 12 条
      })
      setShelters(response.data.results)
      setTotalCount(response.data.count)
    } catch (err: any) {
      setError(err.message || 'Failed to load shelters')
    } finally {
      setLoading(false)
    }
  }, [currentPage])

  useEffect(() => {
    loadShelters()
  }, [currentPage, loadShelters])

  const filteredShelters = shelters.filter(shelter => 
    shelter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shelter.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shelter.region?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateSuccess = () => {
    setCurrentPage(1) // Reset to first page
    loadShelters() // Refresh the list after creating a new shelter
  }

  const handleAddClick = () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      alert('Please log in to add a shelter')
      // Optionally redirect to login page
      // navigate('/auth/login')
      return
    }
    setShowCreateModal(true)
  }

  if (loading) {
    return (
      <div className="shelters-page">
        <PageHeroTitle title="Animal Shelters" subtitle="Find local animal shelters and rescue organizations" />
        <div className="shelters-container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading shelters...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="shelters-page">
        <PageHeroTitle title="Animal Shelters" subtitle="Find local animal shelters and rescue organizations" />
        <div className="shelters-container">
          <div className="error-alert">
            <h3>Error</h3>
            <p>{error}</p>
            <button type="button" onClick={loadShelters} className="retry-btn">Try Again</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="shelters-page">
      <PageHeroTitle title="Animal Shelters" subtitle="Find local animal shelters and rescue organizations" />
      
      <div className="shelters-container">
        {/* Search Bar */}
        <div className="search-bar-section">
          <div className="search-wrapper">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="stats-info">
            <span className="stats-count">{totalCount} {totalCount === 1 ? 'Shelter' : 'Shelters'}</span>
            {isAdmin && (
              <button 
                type="button"
                className="add-shelter-btn"
                onClick={handleAddClick}
              >
                <i className="bi bi-plus-circle"></i>
                Add Shelter
              </button>
            )}
          </div>
        </div>

        {/* Shelters Grid */}
        {filteredShelters.length === 0 ? (
          <div className="empty-alert">
            <p>No shelters found. Try adjusting your search.</p>
          </div>
        ) : (
          <div className="shelters-grid">
            {filteredShelters.map((shelter) => (
              <article key={shelter.id} className="shelter-card">
                {/* Map Preview or Cover Image */}
                {shelter.latitude && shelter.longitude ? (
                  <div className="shelter-map">
                    <ShelterMapPreview
                      lon={shelter.longitude}
                      lat={shelter.latitude}
                      className="map-container"
                      height={180}
                    />
                  </div>
                ) : shelter.cover_url ? (
                  <img 
                    src={shelter.cover_url} 
                    alt={shelter.name}
                    className="cover-image"
                  />
                ) : (
                  <div className="cover-placeholder">
                    <i className="bi bi-house-heart"></i>
                  </div>
                )}
                
                {shelter.is_verified && (
                  <div className="verified-badge">✓ Verified</div>
                )}

                <div className="shelter-content">
                  {/* Logo and Name */}
                  <div className="shelter-header">
                    {shelter.logo_url ? (
                      <img 
                        src={shelter.logo_url} 
                        alt={`${shelter.name} logo`}
                        className="shelter-logo"
                      />
                    ) : (
                      <div className="shelter-logo-placeholder">
                        <i className="bi bi-building"></i>
                      </div>
                    )}
                    <div className="header-info">
                      <h3 className="shelter-name">{shelter.name}</h3>
                      {(() => {
                        const addressParts = []
                        if (shelter.street) {
                          addressParts.push(shelter.street)
                          if (shelter.building_number) {
                            addressParts[0] += ` ${shelter.building_number}`
                          }
                        }
                        if (shelter.postal_code) addressParts.push(shelter.postal_code)
                        if (shelter.city) addressParts.push(shelter.city)
                        if (shelter.region) addressParts.push(shelter.region)
                        if (shelter.country) addressParts.push(shelter.country)
                        const address = addressParts.length > 0 
                          ? addressParts.join(', ')
                          : 'No address'
                        return (
                          <p className="address">
                            <i className="bi bi-geo-alt-fill"></i>
                            {address}
                          </p>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Description */}
                  {shelter.description && (
                    <p className="description">
                      {shelter.description.length > 100
                        ? `${shelter.description.substring(0, 100)}...`
                        : shelter.description}
                    </p>
                  )}

                  {/* Capacity Info */}
                  <div className="capacity-section">
                    <div className="capacity-header">
                      <span>Capacity</span>
                      <span className="occupancy-badge">
                        {shelter.occupancy_rate?.toFixed(0) || 0}%
                      </span>
                    </div>
                    <div className="capacity-bar">
                      <div 
                        className="capacity-fill"
                        style={{ width: `${Math.min(shelter.occupancy_rate || 0, 100)}%` }}
                      ></div>
                    </div>
                    <p className="capacity-text">
                      {shelter.current_animals} / {shelter.capacity} animals
                    </p>
                  </div>

                  {/* Contact Info */}
                  <div className="contact-section">
                    {shelter.phone && (
                      <div className="contact-item">
                        <i className="bi bi-telephone"></i>
                        <small>{shelter.phone}</small>
                      </div>
                    )}
                    {shelter.email && (
                      <div className="contact-item">
                        <i className="bi bi-envelope"></i>
                        <small>{shelter.email}</small>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="action-buttons">
                    <Link to={`/shelters/${shelter.id}`} className="btn btn-primary">
                      View Details
                    </Link>
                    {!isAdmin && (shelter.phone || shelter.email) && (
                      <button 
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          // Prioritize email, then fall back to phone
                          if (shelter.email) {
                            window.location.href = `mailto:${shelter.email}`
                          } else if (shelter.phone) {
                            window.location.href = `tel:${shelter.phone}`
                          }
                        }}
                      >
                        <i className="bi bi-telephone"></i>
                        Contact Us
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          page={currentPage}
          totalPages={Math.ceil(totalCount / 12)}
          onPageChange={setCurrentPage}
        />

        {/* Create Shelter Modal */}
        <CreateShelter
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      </div>
    </div>
  )
}

