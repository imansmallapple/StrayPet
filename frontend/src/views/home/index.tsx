import { NavLink } from 'react-router-dom'
import './index.scss'

export default function Home() {
  return (
    <div className="home">
      <header className="site-header">
        <div className="brand">Stray Pet</div>
        <nav className="site-nav">
          <NavLink to="/adopt">Adopt</NavLink>
          <NavLink to="/post">Post</NavLink>
          <NavLink to="/shelters">Shelters</NavLink>
          <NavLink to="/home" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            home
          </NavLink>
        </nav>
      </header>

      <main className="hero-title">
        <h1>Help pet finding a loving home</h1>
        <p>
          Open your doors and hearts to pets in need of a home and it will be thankful to you for
          the rest of their lives.
        </p>
      </main>

      <div className="hero-image">
          <img src="images/hero-cat.jpg" alt="A rescued cat in a shelter" />
      </div>
    
    </div>
  )
}
