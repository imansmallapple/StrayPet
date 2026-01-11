import { authApi, type UserMe as ApiUserMe } from '@/services/modules/auth'
import { useEffect, useState } from 'react'
import { Container, Row, Col, Spinner, Alert, Card } from 'react-bootstrap'
import { useParams } from 'react-router-dom'
import ProfileInfo from './profile/ProfileInfo'
import './profile/index.scss'

/**
 * 用户个人资料卡页面（用于展示给其他用户看）
 */
export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>()
  const [userData, setUserData] = useState<ApiUserMe | null>(null)
  const [currentUser, setCurrentUser] = useState<ApiUserMe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        // 获取当前登录用户信息
        const { data: current } = await authApi.getProfile()
        if (!alive) return
        setCurrentUser(current)

        // 获取要显示的用户信息
        if (!userId) {
          setError('User ID does not exist')
          return
        }

        const userId_num = Number(userId)
        // 如果 userId 等于当前用户 ID，显示当前用户信息
        let data
        if (userId_num === current.id) {
          data = current
        } else {
          // 否则获取其他用户的公开资料
          const { data: userData } = await authApi.getUserProfile(userId_num)
          data = userData
        }
        if (!alive) return
        setUserData(data)
      } catch (e: any) {
        setError(e?.response?.data?.detail || 'Failed to load user information')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [userId])

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <div className="mt-3">Loading...</div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    )
  }

  if (!userData) return null

  const isOtherUser = currentUser && userData.id !== currentUser.id

  return (
    <Container className="py-5">
      <Row>
        <Col md={8} className="mx-auto">
          <Card className="profile-card shadow">
            <Card.Body className="p-4">
              <ProfileInfo 
                me={userData} 
                isOtherUserProfile={isOtherUser || false} 
                currentUser={currentUser} 
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
