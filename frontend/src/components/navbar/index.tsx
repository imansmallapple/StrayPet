import { NavLink, useNavigate } from 'react-router-dom'
import SignInWidget from '@/components/sign-in-widget'
import NotificationBell from '@/components/NotificationBell'
import './index.scss'

export default function TopNavbar() {
  const navigate = useNavigate()

  return (
    <header className="site-header">
      <div className="brand" onClick={() => navigate('/')} title="Go to home">
        🐾 Stray Pet
      </div>

      <nav className="site-nav">
        <NavLink
          to="/"
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          Home
        </NavLink>
        <NavLink to="/adopt" className="nav-link">Adopt</NavLink>
        <NavLink to="/lost" className="nav-link">Lost Pet</NavLink>
        <NavLink to="/found" className="nav-link">Found/Stray</NavLink>
        <NavLink to="/shelters" className="nav-link">Shelters</NavLink>
        <NavLink to="/blog" className="nav-link">Blog</NavLink>
        <NavLink to="/holiday-family" className="nav-link">Holiday Family</NavLink>
      </nav>

      <div className="header-right">
        <NotificationBell />
        <SignInWidget />
      </div>
    </header>
  )
}