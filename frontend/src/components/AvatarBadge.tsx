import { CSSProperties } from 'react'

interface AvatarBadgeProps {
  src?: string
  username?: string
  isHolidayFamilyCertified?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  title?: string
}

export default function AvatarBadge({
  src,
  username,
  isHolidayFamilyCertified = false,
  size = 'md',
  className = '',
  onClick,
  title
}: AvatarBadgeProps) {
  const sizeMap = {
    sm: { avatar: 32, badge: 12 },
    md: { avatar: 40, badge: 14 },
    lg: { avatar: 64, badge: 20 }
  }

  const { avatar: avatarSize, badge: badgeSize } = sizeMap[size]

  const containerStyle: CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    cursor: onClick ? 'pointer' : 'default'
  }

  const avatarStyle: CSSProperties = {
    width: `${avatarSize}px`,
    height: `${avatarSize}px`,
    borderRadius: '50%',
    backgroundColor: '#e9ecef',
    backgroundImage: src ? `url(${src})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6c757d',
    fontSize: `${avatarSize * 0.4}px`,
    fontWeight: 500
  }

  const badgeStyle: CSSProperties = {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: `${badgeSize}px`,
    height: `${badgeSize}px`,
    backgroundColor: '#fbbf24',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${badgeSize * 0.6}px`,
    border: '2px solid white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }

  return (
    <div style={containerStyle} className={className} onClick={onClick} title={title}>
      <div style={avatarStyle}>
        {!src && username ? username.charAt(0).toUpperCase() : ''}
      </div>
      {isHolidayFamilyCertified && <div style={badgeStyle}>⭐</div>}
    </div>
  )
}
