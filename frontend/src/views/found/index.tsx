// src/views/found/index.tsx
import { useState } from 'react'
import { Container, Nav, Button } from 'react-bootstrap'
import FoundPetsList from './components/FoundPetsList'
import ReportFoundPet from './components/ReportFoundPet'
import './index.scss'

type TabKey = 'found' | 'report'

export default function FoundPetsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('found')

  const handleReportClick = () => {
    setActiveTab('report')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleReportSuccess = () => {
    setActiveTab('found')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Container fluid className="found-pets-page">
      <div className="page-header">
        <h1>✨ Found Pets</h1>
        <p className="subtitle">Help found pets reunite with their owners</p>
      </div>

      <Nav variant="tabs" className="custom-tabs" activeKey={activeTab}>
        <Nav.Item>
          <Nav.Link 
            eventKey="found" 
            onClick={() => setActiveTab('found')}
          >
            📋 Found Pets
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            eventKey="report" 
            onClick={() => setActiveTab('report')}
          >
            📝 Report Found Pet
          </Nav.Link>
        </Nav.Item>
        {activeTab === 'found' && (
          <div className="tab-action-button">
            <Button 
              variant="success" 
              className="report-pet-btn"
              onClick={handleReportClick}
            >
              <span className="btn-icon">🎉</span>
              Report Found Pet
            </Button>
          </div>
        )}
      </Nav>

      <div className="tab-content">
        {activeTab === 'found' && <FoundPetsList onReportClick={handleReportClick} />}
        {activeTab === 'report' && <ReportFoundPet onSuccess={handleReportSuccess} />}
      </div>
    </Container>
  )
}
