import './index.scss'

export default function Home() {
  return (
    <div className="home">
      {/* 原来的 <header className="site-header"> ... </header> 删掉 */}

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
