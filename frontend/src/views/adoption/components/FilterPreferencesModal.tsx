import { useState, useEffect } from 'react'
import { Modal, Form, Button, Row, Col } from 'react-bootstrap'
import { authApi } from '@/services/modules/auth'

interface FilterPreferencesModalProps {
  show: boolean
  onHide: () => void
  onApply: (filters: any) => void
}

export default function FilterPreferencesModal({ show, onHide, onApply }: FilterPreferencesModalProps) {
  const [preferences, setPreferences] = useState({
    preferred_species: '',
    preferred_size: '',
    preferred_age_min: '',
    preferred_age_max: '',
    preferred_gender: '',
    has_experience: false,
    living_situation: '',
    has_yard: false,
    other_pets: '',
    additional_notes: '',
    // 宠物特性偏好
    prefer_vaccinated: false,
    prefer_sterilized: false,
    prefer_dewormed: false,
    prefer_child_friendly: false,
    prefer_trained: false,
    prefer_loves_play: false,
    prefer_loves_walks: false,
    prefer_good_with_dogs: false,
    prefer_good_with_cats: false,
    prefer_affectionate: false,
    prefer_needs_attention: false
  })
  const [loading, setLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  // 第一次打开Modal时加载用户的偏好设置
  useEffect(() => {
    if (!show || hasLoaded) return

    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        
        const { data } = await authApi.getProfile()
        if (!alive) return
        setPreferences({
          preferred_species: data.preferred_species || '',
          preferred_size: data.preferred_size || '',
          preferred_age_min: data.preferred_age_min?.toString() || '',
          preferred_age_max: data.preferred_age_max?.toString() || '',
          preferred_gender: data.preferred_gender || '',
          has_experience: data.has_experience || false,
          living_situation: data.living_situation || '',
          has_yard: data.has_yard || false,
          other_pets: data.other_pets || '',
          additional_notes: data.additional_notes || '',
          prefer_vaccinated: data.prefer_vaccinated || false,
          prefer_sterilized: data.prefer_sterilized || false,
          prefer_dewormed: data.prefer_dewormed || false,
          prefer_child_friendly: data.prefer_child_friendly || false,
          prefer_trained: data.prefer_trained || false,
          prefer_loves_play: data.prefer_loves_play || false,
          prefer_loves_walks: data.prefer_loves_walks || false,
          prefer_good_with_dogs: data.prefer_good_with_dogs || false,
          prefer_good_with_cats: data.prefer_good_with_cats || false,
          prefer_affectionate: data.prefer_affectionate || false,
          prefer_needs_attention: data.prefer_needs_attention || false
        })
        setHasLoaded(true)
      } catch (_e: any) {
        if (alive) {
          console.error('Failed to load preferences:', _e)
          console.error('Error status:', _e?.response?.status)
          console.error('Error data:', _e?.response?.data)
          const errorDetail = typeof _e?.response?.data === 'string' ? _e.response.data : JSON.stringify(_e?.response?.data) || _e?.message
          console.error('Error details:', errorDetail)
        }
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [show, hasLoaded])

  const handleApply = async () => {
    const filters: any = {}
    
    if (preferences.preferred_species) filters.species = preferences.preferred_species
    if (preferences.preferred_size) filters.size = preferences.preferred_size
    if (preferences.preferred_gender) filters.sex = preferences.preferred_gender
    if (preferences.preferred_age_min) filters.age_min = Number(preferences.preferred_age_min)
    if (preferences.preferred_age_max) filters.age_max = Number(preferences.preferred_age_max)
    
    // 添加宠物特性偏好过滤
    if (preferences.prefer_vaccinated) filters.vaccinated = true
    if (preferences.prefer_sterilized) filters.sterilized = true
    if (preferences.prefer_dewormed) filters.dewormed = true
    if (preferences.prefer_child_friendly) filters.child_friendly = true
    if (preferences.prefer_trained) filters.trained = true
    if (preferences.prefer_loves_play) filters.loves_play = true
    if (preferences.prefer_loves_walks) filters.loves_walks = true
    if (preferences.prefer_good_with_dogs) filters.good_with_dogs = true
    if (preferences.prefer_good_with_cats) filters.good_with_cats = true
    if (preferences.prefer_affectionate) filters.affectionate = true
    if (preferences.prefer_needs_attention) filters.needs_attention = true

    // 保存用户的偏好设置到个人资料
    try {
      const payload: any = {
        has_experience: preferences.has_experience,
        has_yard: preferences.has_yard,
        prefer_vaccinated: preferences.prefer_vaccinated,
        prefer_sterilized: preferences.prefer_sterilized,
        prefer_dewormed: preferences.prefer_dewormed,
        prefer_child_friendly: preferences.prefer_child_friendly,
        prefer_trained: preferences.prefer_trained,
        prefer_loves_play: preferences.prefer_loves_play,
        prefer_loves_walks: preferences.prefer_loves_walks,
        prefer_good_with_dogs: preferences.prefer_good_with_dogs,
        prefer_good_with_cats: preferences.prefer_good_with_cats,
        prefer_affectionate: preferences.prefer_affectionate,
        prefer_needs_attention: preferences.prefer_needs_attention
      }
      
      if (preferences.preferred_species) payload.preferred_species = preferences.preferred_species
      if (preferences.preferred_size) payload.preferred_size = preferences.preferred_size
      if (preferences.preferred_gender) payload.preferred_gender = preferences.preferred_gender
      if (preferences.living_situation) payload.living_situation = preferences.living_situation
      if (preferences.other_pets) payload.other_pets = preferences.other_pets
      if (preferences.additional_notes) payload.additional_notes = preferences.additional_notes
      if (preferences.preferred_age_min) payload.preferred_age_min = Number(preferences.preferred_age_min)
      if (preferences.preferred_age_max) payload.preferred_age_max = Number(preferences.preferred_age_max)
      
      await authApi.updateProfile(payload)
    } catch (_e: any) {
      // 偏好保存失败不影响筛选应用
    }

    onApply(filters)
    setHasLoaded(false)  // 重置loaded标志，下次打开时重新加载最新的用户偏好
    onHide()
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-sliders me-2"></i>
          筛选您的理想宠物
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">加载中…</span>
            </div>
            <div className="mt-3">加载中…</div>
          </div>
        ) : (
          <form>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>偏好物种</Form.Label>
                  <Form.Select 
                    value={preferences.preferred_species}
                    onChange={(e) => setPreferences({...preferences, preferred_species: e.target.value})}
                  >
                    <option value="">不限</option>
                    <option value="dog">狗</option>
                    <option value="cat">猫</option>
                    <option value="other">其他</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>偏好大小</Form.Label>
                  <Form.Select 
                    value={preferences.preferred_size}
                    onChange={(e) => setPreferences({...preferences, preferred_size: e.target.value})}
                  >
                    <option value="">不限</option>
                    <option value="small">小型</option>
                    <option value="medium">中型</option>
                    <option value="large">大型</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>最小年龄（月）</Form.Label>
                  <Form.Control 
                    type="number"
                    value={preferences.preferred_age_min}
                    onChange={(e) => setPreferences({...preferences, preferred_age_min: e.target.value})}
                    placeholder="例如: 6"
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>最大年龄（月）</Form.Label>
                  <Form.Control 
                    type="number"
                    value={preferences.preferred_age_max}
                    onChange={(e) => setPreferences({...preferences, preferred_age_max: e.target.value})}
                    placeholder="例如: 24"
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>偏好性别</Form.Label>
                  <Form.Select 
                    value={preferences.preferred_gender}
                    onChange={(e) => setPreferences({...preferences, preferred_gender: e.target.value})}
                  >
                    <option value="">不限</option>
                    <option value="male">公</option>
                    <option value="female">母</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>居住环境</Form.Label>
                  <Form.Select 
                    value={preferences.living_situation}
                    onChange={(e) => setPreferences({...preferences, living_situation: e.target.value})}
                  >
                    <option value="">请选择</option>
                    <option value="apartment">公寓</option>
                    <option value="house">独栋房屋</option>
                    <option value="townhouse">联排别墅</option>
                    <option value="farm">农场</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Check 
                    type="checkbox"
                    id="has_experience"
                    label="我有养宠物的经验"
                    checked={preferences.has_experience}
                    onChange={(e) => setPreferences({...preferences, has_experience: e.target.checked})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Check 
                    type="checkbox"
                    id="has_yard"
                    label="我家有院子"
                    checked={preferences.has_yard}
                    onChange={(e) => setPreferences({...preferences, has_yard: e.target.checked})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold mb-3">宠物特性偏好</Form.Label>
              
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Check 
                      type="checkbox"
                      id="prefer_vaccinated"
                      label="已接种疫苗"
                      checked={preferences.prefer_vaccinated}
                      onChange={(e) => setPreferences({...preferences, prefer_vaccinated: e.target.checked})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Check 
                      type="checkbox"
                      id="prefer_sterilized"
                      label="已绝育/已去势"
                      checked={preferences.prefer_sterilized}
                      onChange={(e) => setPreferences({...preferences, prefer_sterilized: e.target.checked})}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Check 
                      type="checkbox"
                      id="prefer_dewormed"
                      label="已驱虫"
                      checked={preferences.prefer_dewormed}
                      onChange={(e) => setPreferences({...preferences, prefer_dewormed: e.target.checked})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Check 
                      type="checkbox"
                      id="prefer_child_friendly"
                      label="适合儿童"
                      checked={preferences.prefer_child_friendly}
                      onChange={(e) => setPreferences({...preferences, prefer_child_friendly: e.target.checked})}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Check 
                      type="checkbox"
                      id="prefer_trained"
                      label="家庭训练"
                      checked={preferences.prefer_trained}
                      onChange={(e) => setPreferences({...preferences, prefer_trained: e.target.checked})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Check 
                      type="checkbox"
                      id="prefer_loves_play"
                      label="喜欢玩耍"
                      checked={preferences.prefer_loves_play}
                      onChange={(e) => setPreferences({...preferences, prefer_loves_play: e.target.checked})}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Check 
                      type="checkbox"
                      id="prefer_loves_walks"
                      label="喜欢散步"
                      checked={preferences.prefer_loves_walks}
                      onChange={(e) => setPreferences({...preferences, prefer_loves_walks: e.target.checked})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Check 
                      type="checkbox"
                      id="prefer_good_with_dogs"
                      label="与其他狗相处友善"
                      checked={preferences.prefer_good_with_dogs}
                      onChange={(e) => setPreferences({...preferences, prefer_good_with_dogs: e.target.checked})}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Check 
                      type="checkbox"
                      id="prefer_good_with_cats"
                      label="与猫相处友善"
                      checked={preferences.prefer_good_with_cats}
                      onChange={(e) => setPreferences({...preferences, prefer_good_with_cats: e.target.checked})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Check 
                      type="checkbox"
                      id="prefer_affectionate"
                      label="富有感情的"
                      checked={preferences.prefer_affectionate}
                      onChange={(e) => setPreferences({...preferences, prefer_affectionate: e.target.checked})}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Check 
                      type="checkbox"
                      id="prefer_needs_attention"
                      label="需要陪伴/关注"
                      checked={preferences.prefer_needs_attention}
                      onChange={(e) => setPreferences({...preferences, prefer_needs_attention: e.target.checked})}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>家中其他宠物</Form.Label>
              <Form.Control 
                type="text"
                value={preferences.other_pets}
                onChange={(e) => setPreferences({...preferences, other_pets: e.target.value})}
                placeholder="例如: 一只猫，两只狗"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>其他备注</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={preferences.additional_notes}
                onChange={(e) => setPreferences({...preferences, additional_notes: e.target.value})}
                placeholder="其他想说明的偏好或要求..."
              />
            </Form.Group>
          </form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          取消
        </Button>
        <Button variant="primary" onClick={handleApply} disabled={loading}>
          应用筛选
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
