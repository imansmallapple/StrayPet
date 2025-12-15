// src/views/lost/index.tsx
import { useState } from 'react'
import { Container, Nav, Button } from 'react-bootstrap'
import LostPetsList from './components/LostPetsList'
import ReportLostPet from './components/ReportLostPet'
import './index.scss'

type TabKey = 'lost' | 'report'

export default function LostPetsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('lost')

  const handleReportClick = () => {
    setActiveTab('report')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Container fluid className="lost-and-found-page">
      <div className="page-header">
        <h1>🔍 Lost Pets</h1>
        <p className="subtitle">Help reunite lost pets with their families</p>
      </div>

      <Nav variant="tabs" className="custom-tabs" activeKey={activeTab}>
        <Nav.Item>
          <Nav.Link 
            eventKey="lost" 
            onClick={() => setActiveTab('lost')}
          >
            📋 Lost Pets
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            eventKey="report" 
            onClick={() => setActiveTab('report')}
          >
            📝 Report Lost Pet
          </Nav.Link>
        </Nav.Item>
        {activeTab === 'lost' && (
          <div className="tab-action-button">
            <Button 
              variant="primary" 
              className="report-pet-btn"
              onClick={handleReportClick}
            >
              <span className="btn-icon">📢</span>
              Report Lost Pet
            </Button>
          </div>
        )}
      </Nav>

      <div className="tab-content">
        {activeTab === 'lost' && <LostPetsList onReportClick={handleReportClick} />}
        {activeTab === 'report' && <ReportLostPet />}
      </div>
    </Container>
  )
}
