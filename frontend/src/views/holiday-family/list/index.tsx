import { useEffect, useState } from 'react'
import { Container, Card, Spinner, Alert, Badge, Table, Button } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { holidayFamilyApi } from '@/services/modules/holiday-family'
import './index.scss'

interface HolidayFamilyApplication {
  id: number
  full_name: string
  email: string
  phone: string
  country: string
  state: string
  city: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export default function HolidayFamilyList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [applications, setApplications] = useState<HolidayFamilyApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // 检查是否是admin
    if (!user?.is_staff) {
      navigate('/holiday-family')
      return
    }

    loadApplications()
  }, [user, navigate])

  const loadApplications = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await holidayFamilyApi.getList()
      setApplications(data?.results || data || [])
    } catch (err: any) {
      console.error('Failed to load applications:', err)
      setError(err?.response?.data?.detail || 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning">Pending</Badge>
      case 'approved':
        return <Badge bg="success">Approved</Badge>
      case 'rejected':
        return <Badge bg="danger">Rejected</Badge>
      default:
        return <Badge bg="secondary">Unknown</Badge>
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  if (!user?.is_staff) {
    return null
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <Container className="py-4">
        <div className="mb-4">
          <h2>Holiday Family Applications</h2>
          <p className="text-muted">Manage and review all Holiday Family applications</p>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <div className="mt-3">Loading applications...</div>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : applications.length === 0 ? (
          <Card className="shadow-sm">
            <Card.Body className="text-center py-5 text-muted">
              <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
              <div className="mt-3">No applications found</div>
            </Card.Body>
          </Card>
        ) : (
          <Card className="shadow-sm">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th style={{ width: '15%' }}>Name</th>
                      <th style={{ width: '15%' }}>Email</th>
                      <th style={{ width: '10%' }}>Phone</th>
                      <th style={{ width: '20%' }}>Location</th>
                      <th style={{ width: '10%' }}>Status</th>
                      <th style={{ width: '15%' }}>Applied</th>
                      <th style={{ width: '15%' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id}>
                        <td>
                          <strong>{app.full_name}</strong>
                        </td>
                        <td>{app.email}</td>
                        <td>{app.phone}</td>
                        <td>
                          <small className="text-muted">
                            {app.city}, {app.state}
                          </small>
                        </td>
                        <td>{getStatusBadge(app.status)}</td>
                        <td>
                          <small className="text-muted">{formatDate(app.created_at)}</small>
                        </td>
                        <td>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => navigate(`/holiday-family/detail/${app.id}`)}
                          >
                            <i className="bi bi-eye me-1"></i>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        )}
      </Container>
    </div>
  )
}
