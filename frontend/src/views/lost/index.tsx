// src/views/lost/index.tsx
import { Container } from 'react-bootstrap'
import LostPetsList from './components/LostPetsList'
import './index.scss'

export default function LostPetsPage() {
  const handleReportClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Container fluid className="lost-and-found-page">
      <div className="page-header">
        <h1>🔍 Lost Pets</h1>
        <p className="subtitle">Help reunite lost pets with their families</p>
      </div>

      <LostPetsList onReportClick={handleReportClick} />
    </Container>
  )
}
