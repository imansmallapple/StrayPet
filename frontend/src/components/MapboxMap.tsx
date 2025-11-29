import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

type Props = {
  address?: string
  lon?: number
  lat?: number
  className?: string
  width?: string | number
  height?: string | number
}

export default function MapboxMap({ address, lon, lat, className, width = '100%', height = 200 }: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const [mapFallbackUrl, setMapFallbackUrl] = useState<string | null>(null)

  useEffect(() => {
    const el = mapContainerRef.current
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!el || !token) return

    mapboxgl.accessToken = token
    let map: mapboxgl.Map | null = null
    let mounted = true

    const init = async () => {
      // reset fallback url before initialization (inside async handler to satisfy hooks-extra rule)
      setMapFallbackUrl(null)
      let center: [number, number] | null = null
      if (typeof lon === 'number' && typeof lat === 'number') {
        center = [lon, lat]
      }

      const addr = (address || '').trim() || ''
      if (!center && addr) {
        try {
          const q = encodeURIComponent(addr)
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${token}&limit=1`
          const r = await fetch(url)
          const j = await r.json()
          const f = j.features && j.features[0]
          if (f?.geometry?.coordinates) {
            const coords = f.geometry.coordinates as [number, number]
            center = [coords[0], coords[1]]
          }
        } catch (_e) {
          console.warn('[mapbox] geocode failed', _e)
        }
      }

      if (!center) return
      if (!mounted) return

      // Use library helper if available (Mapbox GL), fallback to manual canvas test
      const hasMapboxSupported = typeof (mapboxgl as any).supported === 'function' ? (mapboxgl as any).supported() : null
      // Check WebGL support
      const isWebGLSupported = hasMapboxSupported !== null ? hasMapboxSupported : (() => {
        try {
          const canvas = document.createElement('canvas')
          return !!(canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        } catch (_) {
          return false
        }
      })()

      if (!isWebGLSupported) {
        try {
          const widthParam = 600
          const heightParam = 200
          const z = 12
          const staticUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+ff0000(${center[0]},${center[1]})/${center[0]},${center[1]},${z},0/${widthParam}x${heightParam}?access_token=${token}`
          setMapFallbackUrl(staticUrl)
        } catch (_e) {
          console.warn('[mapbox] build static fallback url failed', _e)
        }
        return
      }

      try {
        // double-check via mapboxgl.supported() if present
        const supported = typeof (mapboxgl as any).supported === 'function' ? (mapboxgl as any).supported() : null
        if (supported === false) {
          // Not supported — fallback
          const widthParam = 600
          const heightParam = 200
          const z = 12
          const staticUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+ff0000(${center[0]},${center[1]})/${center[0]},${center[1]},${z},0/${widthParam}x${heightParam}?access_token=${token}`
          setMapFallbackUrl(staticUrl)
          return
        }
        map = new mapboxgl.Map({ container: el, style: 'mapbox://styles/mapbox/streets-v12', center, zoom: 12 })
      } catch (_e) {
        try {
          const widthParam = 600
          const heightParam = 200
          const z = 12
          const staticUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+ff0000(${center[0]},${center[1]})/${center[0]},${center[1]},${z},0/${widthParam}x${heightParam}?access_token=${token}`
          setMapFallbackUrl(staticUrl)
        } catch (ee) {
          console.warn('[mapbox] fallback static url failed', ee)
        }
        return
      }

      new mapboxgl.Marker().setLngLat(center).addTo(map)
    }

    init()

    return () => { mounted = false; try { map?.remove() } catch (e) { console.warn('[mapbox] cleanup failed', e) } }
  }, [address, lon, lat])

  return (
    <div style={{ width, height }} className={className}>
      {mapFallbackUrl ? (
        <img src={mapFallbackUrl} alt="map-fallback" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
      ) : (
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      )}
    </div>
  )
}
