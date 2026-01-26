import { authApi, type UserMe as ApiUserMe } from '@/services/modules/auth'
import { useEffect, useState } from 'react'
import { Container, Row, Col, Spinner, Alert, Card } from 'react-bootstrap'
import { useParams, useNavigate } from 'react-router-dom'
import ProfileInfo from './profile/ProfileInfo'
import './profile/index.scss'

/**
 * 用户公开资料页面（用于展示其他用户的信息）
 * 与个人资料页面 Profile.tsx 分离，防止userId混乱
 */
export default function ViewUserProfile() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
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

        // Validate userId
        if (!userId) {
          setError('User ID does not exist')
          setLoading(false)
          return
        }

        const userId_num = Number(userId)
        
        // 如果查看的是自己，重定向到个人资料页
        if (userId_num === current.id) {
          navigate('/user/profile')
          return
        }

        // 获取其他用户的公开资料
        const { data: userData } = await authApi.getUserProfile(userId_num)
        if (!alive) return
        
        console.warn('User data received:', userData)
        console.warn('Avatar from API:', userData.avatar)
        console.warn('Avatar type:', typeof userData.avatar)
        console.warn('is_holiday_family_certified from API:', (userData as any).is_holiday_family_certified)
        console.warn('Full userData keys:', Object.keys(userData))
        
        // 处理avatar URL - 转换相对路径为绝对URL
        if (userData.avatar && typeof userData.avatar === 'string' && userData.avatar.startsWith('/')) {
          userData.avatar = `http://localhost:8000${userData.avatar}`
          console.warn('Converted avatar URL to:', userData.avatar)
        }
        
        setUserData(userData)
      } catch (e: any) {
        if (alive) {
          setError(e?.response?.data?.detail || 'Failed to load user information')
        }
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => { alive = false }
  }, [userId, navigate])

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

  if (!userData) {
    return (
      <Container className="py-5">
        <Alert variant="warning">User information not found</Alert>
      </Container>
    )
  }

  return (
    <Container className="py-5 profile-wrapper">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="profile-container">
            <Card.Body className="p-0">
              {/* 传递 isOtherUserProfile=true 以禁用编辑功能 */}
              <ProfileInfo 
                me={userData} 
                isOtherUserProfile={true}
                currentUser={currentUser}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
