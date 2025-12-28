import { useState, useEffect, useRef } from 'react'
import { Modal, Form, Button, Row, Col } from 'react-bootstrap'
import { authApi } from '@/services/modules/auth'

interface FilterPreferencesModalProps {
  show: boolean
  onHide: () => void
  onApply: (filters: any) => void
  currentFilters?: {
    species?: string
    size?: string
    sex?: string
    age_min?: number | string
    age_max?: number | string
    [key: string]: any // for pet traits (vaccinated, sterilized, etc)
  }
}

// 添加样式确保复选框的checked状态可见
const checkboxStyles = `
  input[type="checkbox"] {
    cursor: pointer;
    width: 18px;
    height: 18px;
    accent-color: #0d6efd;
  }
  input[type="checkbox"]:checked {
    background-color: #0d6efd;
    border-color: #0d6efd;
  }
  label {
    cursor: pointer;
    margin-bottom: 0;
  }
`

export default function FilterPreferencesModal({ show, onHide, onApply, currentFilters }: FilterPreferencesModalProps) {
  const [preferences, setPreferences] = useState({
    preferred_species: '',
    preferred_size: '',
    preferred_age_min: '',
    preferred_age_max: '',
    preferred_gender: '',
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
  const loadedRef = useRef(false)
  const preferencesRef = useRef(preferences)  // 使用ref来跟踪最新的preferences值

  // 当preferences状态改变时，同步更新ref
  useEffect(() => {
    preferencesRef.current = preferences
  }, [preferences])
  
  useEffect(() => {
    if (!show) {
      // Modal关闭时重置flag，这样下次打开时会重新加载最新的过滤条件
      loadedRef.current = false
      return
    }
    
    if (loadedRef.current) return

    // 初始化preferences：只显示当前URL中应用的过滤条件，不加载保存的偏好
    const emptyPreferences = {
      preferred_species: '',
      preferred_size: '',
      preferred_age_min: '',
      preferred_age_max: '',
      preferred_gender: '',
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
    }
    
    // 只应用URL中的currentFilters，不加载API的保存偏好
    const newPreferences = { ...emptyPreferences }
    if (currentFilters) {
      if (currentFilters.species) newPreferences.preferred_species = currentFilters.species
      if (currentFilters.size) newPreferences.preferred_size = currentFilters.size
      if (currentFilters.sex) newPreferences.preferred_gender = currentFilters.sex
      if (currentFilters.age_min) newPreferences.preferred_age_min = String(currentFilters.age_min)
      if (currentFilters.age_max) newPreferences.preferred_age_max = String(currentFilters.age_max)
      
      // 对于宠物特性，只在URL中有'true'值时才设置为true
      const petTraits = ['vaccinated', 'sterilized', 'dewormed', 'child_friendly', 'trained', 
                         'loves_play', 'loves_walks', 'good_with_dogs', 'good_with_cats', 
                         'affectionate', 'needs_attention']
      petTraits.forEach(trait => {
        const traitKey = `prefer_${trait}` as keyof typeof newPreferences
        if (currentFilters[trait] === true) {
          (newPreferences[traitKey] as boolean) = true
        }
      })
    }
    
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setPreferences(newPreferences)
    console.warn('[Modal] Filter preferences initialized:', JSON.stringify(newPreferences, null, 2))
    loadedRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  const handleApply = async () => {
    // 使用ref中的最新值，而不是state，以避免异步状态更新问题
    const currentPreferences = preferencesRef.current
    const filters: any = {}
    
    // 显式传递所有筛选字段，这样handleApplyFilters能知道用户选择了什么
    filters.species = currentPreferences.preferred_species || undefined
    filters.size = currentPreferences.preferred_size || undefined
    filters.sex = currentPreferences.preferred_gender || undefined
    filters.age_min = currentPreferences.preferred_age_min ? Number(currentPreferences.preferred_age_min) : undefined
    filters.age_max = currentPreferences.preferred_age_max ? Number(currentPreferences.preferred_age_max) : undefined
    
    // 添加宠物特性偏好过滤（只在为true时才设置，否则设为false以表示"不勾选"）
    filters.vaccinated = currentPreferences.prefer_vaccinated ? true : false
    filters.sterilized = currentPreferences.prefer_sterilized ? true : false
    filters.dewormed = currentPreferences.prefer_dewormed ? true : false
    filters.child_friendly = currentPreferences.prefer_child_friendly ? true : false
    filters.trained = currentPreferences.prefer_trained ? true : false
    filters.loves_play = currentPreferences.prefer_loves_play ? true : false
    filters.loves_walks = currentPreferences.prefer_loves_walks ? true : false
    filters.good_with_dogs = currentPreferences.prefer_good_with_dogs ? true : false
    filters.good_with_cats = currentPreferences.prefer_good_with_cats ? true : false
    filters.affectionate = currentPreferences.prefer_affectionate ? true : false
    filters.needs_attention = currentPreferences.prefer_needs_attention ? true : false

    console.warn('[Modal] preferences state:', currentPreferences)
    
    // 保存用户的宠物特性偏好到个人资料
    try {
      const payload: any = {
        prefer_vaccinated: currentPreferences.prefer_vaccinated,
        prefer_sterilized: currentPreferences.prefer_sterilized,
        prefer_dewormed: currentPreferences.prefer_dewormed,
        prefer_child_friendly: currentPreferences.prefer_child_friendly,
        prefer_trained: currentPreferences.prefer_trained,
        prefer_loves_play: currentPreferences.prefer_loves_play,
        prefer_loves_walks: currentPreferences.prefer_loves_walks,
        prefer_good_with_dogs: currentPreferences.prefer_good_with_dogs,
        prefer_good_with_cats: currentPreferences.prefer_good_with_cats,
        prefer_affectionate: currentPreferences.prefer_affectionate,
        prefer_needs_attention: currentPreferences.prefer_needs_attention
      }
      
      if (currentPreferences.preferred_species) payload.preferred_species = currentPreferences.preferred_species
      if (currentPreferences.preferred_size) payload.preferred_size = currentPreferences.preferred_size
      if (currentPreferences.preferred_gender) payload.preferred_gender = currentPreferences.preferred_gender
      if (currentPreferences.preferred_age_min) payload.preferred_age_min = Number(currentPreferences.preferred_age_min)
      if (currentPreferences.preferred_age_max) payload.preferred_age_max = Number(currentPreferences.preferred_age_max)
      
      console.warn('[Modal] Sending updateProfile payload:', payload)
      const result = await authApi.updateProfile(payload)
      console.warn('[Modal] updateProfile response:', result)
    } catch (e: any) {
      // 偏好保存失败不影响筛选应用
      console.error('[Modal] Failed to save preferences:', e.message)
    }

    onApply(filters)
    loadedRef.current = false  // 重置loaded标志，下次打开时重新加载最新的用户偏好
    onHide()
  }

  return (
    <>
      <style>{checkboxStyles}</style>
      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-sliders me-2"></i>
            筛选您的理想宠物
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold mb-3">宠物特性偏好</Form.Label>
              
              <div className="ms-2">
                <div className="mb-2">
                  <input 
                    type="checkbox"
                    id="prefer_vaccinated"
                    checked={preferences.prefer_vaccinated}
                    onChange={(e) => {
                      setPreferences({...preferences, prefer_vaccinated: e.target.checked})
                    }}
                  />
                  <label htmlFor="prefer_vaccinated" className="ms-2">已接种疫苗</label>
                </div>
                
                <div className="mb-2">
                  <input 
                    type="checkbox"
                    id="prefer_sterilized"
                    checked={preferences.prefer_sterilized}
                    onChange={(e) => {
                      console.warn('[Modal] prefer_sterilized checkbox changed to:', e.target.checked)
                      setPreferences({...preferences, prefer_sterilized: e.target.checked})
                    }}
                  />
                  <label htmlFor="prefer_sterilized" className="ms-2">已绝育/已去势</label>
                </div>

                <div className="mb-2">
                  <input 
                    type="checkbox"
                    id="prefer_dewormed"
                    checked={preferences.prefer_dewormed}
                    onChange={(e) => {
                      console.warn('[Modal] prefer_dewormed checkbox changed to:', e.target.checked)
                      setPreferences({...preferences, prefer_dewormed: e.target.checked})
                    }}
                  />
                  <label htmlFor="prefer_dewormed" className="ms-2">已驱虫</label>
                </div>

                <div className="mb-2">
                  <input 
                    type="checkbox"
                    id="prefer_child_friendly"
                    checked={preferences.prefer_child_friendly}
                    onChange={(e) => {
                      console.warn('[Modal] prefer_child_friendly checkbox changed to:', e.target.checked)
                      setPreferences({...preferences, prefer_child_friendly: e.target.checked})
                    }}
                  />
                  <label htmlFor="prefer_child_friendly" className="ms-2">适合儿童</label>
                </div>

                <div className="mb-2">
                  <input 
                    type="checkbox"
                    id="prefer_trained"
                    checked={preferences.prefer_trained}
                    onChange={(e) => {
                      console.warn('[Modal] prefer_trained checkbox changed to:', e.target.checked)
                      setPreferences({...preferences, prefer_trained: e.target.checked})
                    }}
                  />
                  <label htmlFor="prefer_trained" className="ms-2">家庭训练</label>
                </div>

                <div className="mb-2">
                  <input 
                    type="checkbox"
                    id="prefer_loves_play"
                    checked={preferences.prefer_loves_play}
                    onChange={(e) => {
                      console.warn('[Modal] prefer_loves_play checkbox changed to:', e.target.checked)
                      setPreferences({...preferences, prefer_loves_play: e.target.checked})
                    }}
                  />
                  <label htmlFor="prefer_loves_play" className="ms-2">喜欢玩耍</label>
                </div>

                <div className="mb-2">
                  <input 
                    type="checkbox"
                    id="prefer_loves_walks"
                    checked={preferences.prefer_loves_walks}
                    onChange={(e) => {
                      console.warn('[Modal] prefer_loves_walks checkbox changed to:', e.target.checked)
                      setPreferences({...preferences, prefer_loves_walks: e.target.checked})
                    }}
                  />
                  <label htmlFor="prefer_loves_walks" className="ms-2">喜欢散步</label>
                </div>

                <div className="mb-2">
                  <input 
                    type="checkbox"
                    id="prefer_good_with_dogs"
                    checked={preferences.prefer_good_with_dogs}
                    onChange={(e) => {
                      console.warn('[Modal] prefer_good_with_dogs checkbox changed to:', e.target.checked)
                      setPreferences({...preferences, prefer_good_with_dogs: e.target.checked})
                    }}
                  />
                  <label htmlFor="prefer_good_with_dogs" className="ms-2">与其他狗相处友善</label>
                </div>

                <div className="mb-2">
                  <input 
                    type="checkbox"
                    id="prefer_good_with_cats"
                    checked={preferences.prefer_good_with_cats}
                    onChange={(e) => {
                      console.warn('[Modal] prefer_good_with_cats checkbox changed to:', e.target.checked)
                      setPreferences({...preferences, prefer_good_with_cats: e.target.checked})
                    }}
                  />
                  <label htmlFor="prefer_good_with_cats" className="ms-2">与猫相处友善</label>
                </div>

                <div className="mb-2">
                  <input 
                    type="checkbox"
                    id="prefer_affectionate"
                    checked={preferences.prefer_affectionate}
                    onChange={(e) => {
                      console.warn('[Modal] prefer_affectionate checkbox changed to:', e.target.checked)
                      setPreferences({...preferences, prefer_affectionate: e.target.checked})
                    }}
                  />
                  <label htmlFor="prefer_affectionate" className="ms-2">富有感情的</label>
                </div>

                <div className="mb-2">
                  <input 
                    type="checkbox"
                    id="prefer_needs_attention"
                    checked={preferences.prefer_needs_attention}
                    onChange={(e) => {
                      console.warn('[Modal] prefer_needs_attention checkbox changed to:', e.target.checked)
                      setPreferences({...preferences, prefer_needs_attention: e.target.checked})
                    }}
                  />
                  <label htmlFor="prefer_needs_attention" className="ms-2">需要陪伴/关注</label>
                </div>
              </div>
            </Form.Group>


          </form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          取消
        </Button>
        <Button variant="primary" onClick={handleApply}>
          应用筛选
        </Button>
      </Modal.Footer>
      </Modal>
    </>
  )
}
