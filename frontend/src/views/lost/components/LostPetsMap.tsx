'use strict'

import 'mapbox-gl/dist/mapbox-gl.css'
import mapboxgl from 'mapbox-gl'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { lostApi, type LostPet } from '@/services/modules/lost'
import { POLAND_BOUNDS } from '@/utils/polandMapConfig'

// Set Mapbox token globally from environment variable
const token = import.meta.env.VITE_MAPBOX_TOKEN
if (token) {
  mapboxgl.accessToken = token
} else {
  console.warn('⚠️ Mapbox token not found in environment variables')
}

export default function LostPetsMap() {
  const navigate = useNavigate()
  const location = useLocation()
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [pets, setPets] = useState<LostPet[]>([])
  const [loading, setLoading] = useState(true)
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapErrorRef = useRef<string>('')
  const markersRef = useRef<mapboxgl.Marker[]>([])

  // Fetch lost pets on component mount
  useEffect(() => {
    const loadPets = async () => {
      try {
        const result = await lostApi.listAll('open')
        const data = result.data?.results || []
        setPets(data)
        ;(window as any).__LOST_PETS_DATA = data
        console.warn('🗺️ Lost pets loaded:', data.length, 'pets')
      } catch (error) {
        console.error('Failed to fetch lost pets:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPets()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return

    try {
      if (!map.current) {
        console.warn('🗺️ Initializing Mapbox with token:', mapboxgl.accessToken ? '✅ Set' : '❌ Not set')
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [POLAND_BOUNDS.center[0], POLAND_BOUNDS.center[1]],
          zoom: POLAND_BOUNDS.initialZoom,
          minZoom: 0,
          maxZoom: 18,
          pitch: 0,
          bearing: 0,
        })

        map.current.on('load', () => {
          console.warn('✅ Mapbox map loaded successfully')
          setMapLoaded(true)
        })

        map.current.on('error', (e) => {
          console.error('❌ Mapbox error:', e)
        })

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-left')
      }
    } catch (error) {
      console.warn('Failed to initialize Mapbox:', error)
      mapErrorRef.current = 'Failed to initialize map. Your browser may not support WebGL. Please try Chrome, Firefox, or Safari.'
      if (mapContainer.current) {
        mapContainer.current.style.display = 'none'
      }
    }

    return () => {
      // Cleanup
    }
  }, [])

  // Monitor container resize and call map.resize()
  useEffect(() => {
    if (!map.current || !mapContainer.current) return

    const resizeObserver = new ResizeObserver(() => {
      console.warn('📏 Container resized, calling map.resize()')
      map.current?.resize()
    })

    resizeObserver.observe(mapContainer.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Update markers when pets change and map is loaded
  useEffect(() => {
    if (!map.current || pets.length === 0 || !mapLoaded) return

    console.warn('🗺️ Updating markers for', pets.length, 'pets (map loaded:', mapLoaded, ')')

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Create a local reference to track handlers for cleanup
    const eventHandlers = new Map<HTMLElement, (e: Event) => void>()
    const popupHandlers = new Map<mapboxgl.Popup, { element: HTMLElement | null; handler: (e?: any) => void; closeHandler?: (e?: any) => void; isPopupHandler?: boolean; isDomListener?: boolean }>()

    // Helper function to parse coordinates
    const parseCoordinate = (value: any): number | null => {
      if (value == null) return null
      
      // Handle string with comma as decimal separator
      let numStr = String(value).trim()
      if (typeof value === 'string') {
        numStr = numStr.replace(',', '.')
      }
      
      const num = Number(numStr)
      return Number.isFinite(num) ? num : null
    }

    // Define delegated handler outside loop for event listener tracking
    const delegatedClickHandler = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'STRONG' && target.hasAttribute('data-pet-id')) {
        const petId = target.getAttribute('data-pet-id')
        if (petId) {
          navigate(`/lost/${petId}${location.search}`)
        }
      }
    }

    // Group pets by coordinates (if multiple pets have the exact same coordinates)
    const petsByCoords = new Map<string, LostPet[]>()
    pets.forEach((pet: LostPet) => {
      const lng = parseCoordinate(pet.longitude)
      const lat = parseCoordinate(pet.latitude)
      
      // Skip invalid coordinates
      if (lng == null || lat == null || !Number.isFinite(lng) || !Number.isFinite(lat)) {
        return
      }
      
      const coordKey = `${lng},${lat}`
      if (!petsByCoords.has(coordKey)) {
        petsByCoords.set(coordKey, [])
      }
      petsByCoords.get(coordKey)!.push(pet)
    })

    // Create markers from grouped coordinate data
    petsByCoords.forEach((petsAtCoord: LostPet[]) => {
      const firstPet = petsAtCoord[0]
      const lng = parseCoordinate(firstPet.longitude)
      const lat = parseCoordinate(firstPet.latitude)

      // Skip if invalid coordinates
      if (lng == null || lat == null) {
        return
      }

      if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        return
      }

      console.warn(`✅ Creating marker for coordinates [${lng}, ${lat}] with ${petsAtCoord.length} pet(s)`)

      // Create marker root element (Mapbox will position this via transform)
      // IMPORTANT: Don't add transform/position/margin to this element
      const markerRoot = document.createElement('div')
      markerRoot.style.width = '50px'
      markerRoot.style.height = '50px'
      markerRoot.style.cursor = 'pointer'
      markerRoot.style.display = 'flex'
      markerRoot.style.alignItems = 'center'
      markerRoot.style.justifyContent = 'center'
      // NO position/transform/margin on this element!

      // Create visual marker element with all styling
      const markerVisual = document.createElement('div')
      markerVisual.className = 'pet-marker'
      markerVisual.style.width = '50px'
      markerVisual.style.height = '50px'
      markerVisual.style.display = 'flex'
      markerVisual.style.alignItems = 'center'
      markerVisual.style.justifyContent = 'center'

      // If only one pet at this location, show its specific icon; if multiple, show count badge
      if (petsAtCoord.length === 1) {
        // Single pet - show its uploaded image
        const pet = petsAtCoord[0]
        const markerContainer = document.createElement('div')
        markerContainer.style.width = '50px'
        markerContainer.style.height = '50px'
        markerContainer.style.borderRadius = '50%'
        markerContainer.style.border = '3px solid white'
        markerContainer.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
        markerContainer.style.display = 'flex'
        markerContainer.style.alignItems = 'center'
        markerContainer.style.justifyContent = 'center'
        markerContainer.style.position = 'relative'
        markerContainer.style.overflow = 'hidden'

        // Show pet's uploaded image if available
        if (pet.photo_url) {
          const img = document.createElement('img')
          img.src = pet.photo_url
          img.style.width = '100%'
          img.style.height = '100%'
          img.style.objectFit = 'cover'
          img.style.borderRadius = '50%'
          markerContainer.appendChild(img)
        } else {
          // Fallback to emoji if no image
          markerContainer.style.background = pet.species === 'dog' ? 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)' : 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)'
          const emojiSpan = document.createElement('span')
          emojiSpan.style.fontSize = '24px'
          emojiSpan.style.fontWeight = 'bold'
          emojiSpan.textContent = pet.species === 'dog' ? '🐕' : '🐱'
          markerContainer.appendChild(emojiSpan)
        }

        markerVisual.appendChild(markerContainer)
      } else {
        // Multiple pets at same location - show count badge
        const markerContainer = document.createElement('div')
        markerContainer.style.width = '50px'
        markerContainer.style.height = '50px'
        markerContainer.style.borderRadius = '50%'
        markerContainer.style.border = '3px solid white'
        markerContainer.style.background = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
        markerContainer.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
        markerContainer.style.display = 'flex'
        markerContainer.style.alignItems = 'center'
        markerContainer.style.justifyContent = 'center'
        markerContainer.style.position = 'relative'

        // Pet count badge
        const badge = document.createElement('div')
        badge.style.position = 'absolute'
        badge.style.top = '-5px'
        badge.style.right = '-5px'
        badge.style.background = '#ef4444'
        badge.style.color = 'white'
        badge.style.borderRadius = '50%'
        badge.style.width = '24px'
        badge.style.height = '24px'
        badge.style.display = 'flex'
        badge.style.alignItems = 'center'
        badge.style.justifyContent = 'center'
        badge.style.fontSize = '12px'
        badge.style.fontWeight = 'bold'
        badge.style.border = '2px solid white'
        badge.textContent = String(petsAtCoord.length)
        markerContainer.appendChild(badge)

        // Add emoji to marker
        const emojiSpan = document.createElement('span')
        emojiSpan.style.fontSize = '24px'
        emojiSpan.style.fontWeight = 'bold'
        emojiSpan.textContent = '🐾'
        markerContainer.appendChild(emojiSpan)

        markerVisual.appendChild(markerContainer)
      }

      // Add visual element to root
      markerRoot.appendChild(markerVisual)

      // Create Mapbox marker with clean root element
      const marker = new mapboxgl.Marker({
        element: markerRoot,
        anchor: 'center',
      })
        .setLngLat([lng, lat])
        .addTo(map.current!)

      // Create popup with list of all pets at this location
      const petListHTML = petsAtCoord.map((pet) => {
        const petEmoji = pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐱' : '🐾'
        const petName = pet.pet_name || `${pet.species}${pet.breed ? ' · ' + pet.breed : ''}`
        const petImage = pet.photo_url ? `<img src="${pet.photo_url}" style="width: 100%; height: 100%; object-fit: cover;">` : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f3f4f6; font-size: 24px;">${petEmoji}</div>`
        return `
          <div style="padding: 8px; border-bottom: 1px solid #eee;">
            <div style="display: flex; gap: 8px; align-items: flex-start;">
              <!-- Left: Circular pet image -->
              <div style="width: 60px; height: 60px; border-radius: 50%; overflow: hidden; flex-shrink: 0; border: 2px solid #e5e7eb;">
                ${petImage}
              </div>
              <!-- Right: Pet info -->
              <div style="flex: 1; min-width: 0;">
                <strong style="cursor: pointer; color: #d97706; display: block; margin-bottom: 4px;" data-pet-id="${pet.id}">${petName}</strong>
                <div style="font-size: 11px; color: #666;">
                  ${petEmoji} ${pet.species}${pet.breed ? ' · ' + pet.breed : ''} &nbsp; ${pet.sex === 'male' ? '♂️ Boy' : '♀️ Girl'}
                </div>
              </div>
            </div>
            <small style="color: #999; display: block; margin-top: 4px;">Lost: ${new Date(pet.lost_time).toLocaleDateString()}</small>
          </div>
        `
      }).join('')

      const popupContent = `
        <div style="font-size: 13px; font-weight: bold; padding: 8px 8px 4px 8px; border-bottom: 2px solid #f59e0b;">
          📍 ${firstPet.city || 'Unknown'} (${petsAtCoord.length} pet${petsAtCoord.length > 1 ? 's' : ''})
        </div>
        <div style="max-width: 300px; max-height: 400px; overflow-y: auto;">
          ${petListHTML}
        </div>
      `
      
      const popup = new mapboxgl.Popup({
        offset: [0, -60],
        closeButton: true,
        closeOnClick: true,
        anchor: 'bottom',
        maxWidth: '350px'
      }).setHTML(popupContent)
      
      marker.setPopup(popup)
      
      // Attach listener when popup opens, remove when it closes
      const addPopupListener = () => {
        const popupElement = popup.getElement() as HTMLElement
        // eslint-disable-next-line @eslint-react/web-api/no-leaked-event-listener
        popupElement.addEventListener('click', delegatedClickHandler)
        
        const removePopupListener = () => {
          popupElement.removeEventListener('click', delegatedClickHandler)
          popup.off('close', removePopupListener)
        }
        popup.on('close', removePopupListener)
      }
      
      popup.on('open', addPopupListener)
      
      // Store marker with handler for later attachment
      const clickHandler = (e: Event) => {
        e.stopPropagation()
        marker.togglePopup()
      }
      
      eventHandlers.set(markerRoot, clickHandler)
      markersRef.current.push(marker)
    })

    console.warn(`📍 Total markers created: ${markersRef.current.length}`)

    // Attach event listeners after all markers are created
    eventHandlers.forEach((handler, element) => {
      element.addEventListener('click', handler)
    })

    // Fit map to bounds
    if (markersRef.current.length > 0 && map.current) {
      requestAnimationFrame(() => {
        const bounds = new mapboxgl.LngLatBounds()
        
        petsByCoords.forEach((petsAtCoord) => {
          const lng = parseCoordinate(petsAtCoord[0].longitude)
          const lat = parseCoordinate(petsAtCoord[0].latitude)
          if (lng != null && lat != null) {
            bounds.extend([lng, lat])
          }
        })
        
        map.current!.fitBounds(bounds, { 
          padding: 100, 
          duration: 1000
        })
      })
    }

    // Cleanup: remove event listeners when markers are recreated
    return () => {
      eventHandlers.forEach((handler, element) => {
        element.removeEventListener('click', handler)
      })
      eventHandlers.clear()
      
      // Popup listeners are managed by popup.on('open'/'close') handlers
      
      // Cleanup popup handlers
      popupHandlers.forEach(({ element, handler, isPopupHandler, isDomListener }) => {
        if (isDomListener && element) {
          // Remove DOM click listeners
          element.removeEventListener('click', handler)
        } else if (isPopupHandler) {
          // Popup event handlers are cleaned up with popup.off() in parent cleanup
        }
      })
      popupHandlers.clear()
    }
  }, [pets, mapLoaded, navigate, location.search])

  // Cleanup marker event listeners on component unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []
    }
  }, [])

  return (
    <div className="lost-pets-map-container">
      <div className="map-header" style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
        backdropFilter: 'blur(8px)',
        padding: '16px 20px',
        border: '1px solid rgba(255,255,255,0.6)',
        position: 'relative',
        zIndex: 10,
        maxWidth: '280px'
      }}>
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: '#1f2937',
          lineHeight: '1.4'
        }}>📍 Lost Pets Locations</h3>
        <p className="map-info" style={{
          margin: '0',
          fontSize: '13px',
          color: '#6b7280',
          fontWeight: '500',
          lineHeight: '1.5'
        }}>
          {loading ? '⏳ Loading map...' : mapErrorRef.current ? '⚠️ Map unavailable' : `✨ ${pets.length} lost pet${pets.length !== 1 ? 's' : ''} in ${markersRef.current.length} location${markersRef.current.length !== 1 ? 's' : ''}`}
        </p>
      </div>
      {mapErrorRef.current ? (
        <div
          style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            color: '#856404',
            padding: '20px',
            borderRadius: '8px',
            fontSize: '14px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</div>
          <strong>Unable to Load Map</strong>
          <p style={{ margin: '10px 0 0 0' }}>{mapErrorRef.current}</p>
        </div>
      ) : (
        <div 
          ref={mapContainer} 
          className="map-container"
          style={{
            width: '100%',
            height: '500px',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        />
      )}
    </div>
  )
}
