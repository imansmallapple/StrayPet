// src/components/page-hero-title/index.tsx
import './index.scss'

interface PageHeroTitleProps {
  title: string
  subtitle?: string
  className?: string
}

export default function PageHeroTitle(props: PageHeroTitleProps) {
  const { title, subtitle, className } = props
  const cn = ['page-hero-title', className].filter(Boolean).join(' ')

  return (
    <div className={cn}>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      <div className="page-hero-underline" />
    </div>
  )
}
