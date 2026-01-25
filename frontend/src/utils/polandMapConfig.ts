/**
 * 波兰地图边界配置和验证
 * 
 * 波兰地理范围（WGS84）:
 *   - 纬度: 49.00°N ~ 54.84°N
 *   - 经度: 14.12°E ~ 24.15°E
 */

export const POLAND_BOUNDS = {
  // [west, south, east, north] - Mapbox format
  bbox: [14.12, 49.00, 24.15, 54.84],
  // [lng, lat] format
  southwest: [14.12, 49.00],
  northeast: [24.15, 54.84],
  // Center of Poland
  center: [19.145, 51.919],
  // Default zoom level for Poland
  initialZoom: 6,
} as const

/**
 * 波兰主要城市
 */
export const POLAND_CITIES = {
  Warsaw: { lat: 52.2297, lng: 21.0122 },
  Krakow: { lat: 50.0647, lng: 19.9450 },
  Gdansk: { lat: 54.3520, lng: 18.6466 },
  Wroclaw: { lat: 51.1079, lng: 17.0385 },
  Poznan: { lat: 52.4064, lng: 16.9252 },
  Lodz: { lat: 51.7656, lng: 19.4557 },
  Katowice: { lat: 50.2647, lng: 19.0238 },
  Szczecin: { lat: 53.4285, lng: 14.5528 },
  Bialystok: { lat: 53.1325, lng: 23.1688 },
  Gdynia: { lat: 54.4808, lng: 18.5305 },
} as const

/**
 * 检查坐标是否在波兰范围内
 */
export function isCoordinateInPoland(lat: number, lng: number): boolean {
  const [west, south, east, north] = POLAND_BOUNDS.bbox
  return lat >= south && lat <= north && lng >= west && lng <= east
}

/**
 * 将坐标限制在波兰范围内
 */
export function clampCoordinateToPoland(lat: number, lng: number): [number, number] {
  const [west, south, east, north] = POLAND_BOUNDS.bbox
  const clampedLat = Math.max(south, Math.min(north, lat))
  const clampedLng = Math.max(west, Math.min(east, lng))
  return [clampedLng, clampedLat]
}

/**
 * 找到离给定坐标最近的波兰城市
 */
export function findNearestCity(lat: number, lng: number): string {
  let minDistance = Infinity
  let nearestCity = 'Warsaw'

  for (const [city, coords] of Object.entries(POLAND_CITIES)) {
    const distance = Math.sqrt(
      Math.pow(lat - coords.lat, 2) + Math.pow(lng - coords.lng, 2)
    )
    if (distance < minDistance) {
      minDistance = distance
      nearestCity = city
    }
  }

  return nearestCity
}

/**
 * 验证和修正坐标
 */
export function validateAndClampCoordinate(lat: number | null, lng: number | null): [number, number] | null {
  if (lat === null || lng === null) {
    return null
  }

  if (!isCoordinateInPoland(lat, lng)) {
    console.warn(`⚠️ Coordinate (${lat}, ${lng}) is outside Poland bounds, clamping...`)
    return clampCoordinateToPoland(lat, lng)
  }

  return [lng, lat]
}
