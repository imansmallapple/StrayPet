import { NavLink } from 'react-router-dom'
import SignInWidget from '@/components/sign-in-widget'
import './index.scss'  // 可选

export default function TopNavbar() {
  return (
    <header className="site-header">
      <div className="brand">Stray Pet</div>

      <nav className="site-nav">
        <NavLink to="/adopt">Adopt</NavLink>
        <NavLink to="/lost">Lost Pet</NavLink>
        <NavLink to="/donation">Found/Stray</NavLink>
        <NavLink to="/shelters">Shelters</NavLink>
        <NavLink to="/blog">Blog</NavLink>
        <NavLink
          to="/home"
          className={({ isActive }) => (isActive ? 'active' : undefined)}
        >
          home
        </NavLink>
      </nav>

      <div className="header-right">
        <SignInWidget />
      </div>
    </header>
  )
}