import { useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useRequest } from 'ahooks'
import { adoptApi, type Pet, type Paginated } from '@/services/modules/adopt'
import PageHeroTitle from '@/components/page-hero-title'
import FilterPreferencesModal from '../components/FilterPreferencesModal'

import {
  Container, Row, Col,
  Card, Button, Form, Stack,
  Pagination, Placeholder,
} from 'react-bootstrap'

import './index.scss'

type PageToken =
  | { kind: 'page'; value: number; key: string }
  | { kind: 'ellipsis'; key: string }

export default function Adopt() {
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || 1)
  const pageSize = Number(sp.get('page_size') || 24)
  const species = sp.get('species') || ''
  const sort = sp.get('sort') || 'longest_stay'
  
  const [favStates, setFavStates] = useState<Record<number, boolean>>({})
  const [favLoading, setFavLoading] = useState<Record<number, boolean>>({})
  const [showFilterModal, setShowFilterModal] = useState(false)
  
  // 获取所有宠物特性过滤参数
  const petTraits = useMemo(() => ['vaccinated', 'sterilized', 'dewormed', 'child_friendly', 'trained', 
                                   'loves_play', 'loves_walks', 'good_with_dogs', 'good_with_cats', 
                                   'affectionate', 'needs_attention'], [])
  
  const params = useMemo(() => {
    const traitParams: Record<string, string | boolean> = {}
    petTraits.forEach(trait => {
      const val = sp.get(trait)
      if (val === 'true') traitParams[trait] = true
    })
    
    return {
      page,
      page_size: pageSize,
      ...(species ? { species } : {}),
      ...(sort ? { ordering: sort } : {}),
      ...traitParams,
    }
  }, [page, pageSize, species, sort, sp, petTraits]);

  const { data, loading } = useRequest(
    () => adoptApi.list(params).then(res => res.data as Paginated<Pet>),
    { refreshDeps: [params] }
  )

  const list = data?.results ?? []
  const count = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(count / pageSize))
  // ✅ 生成唯一的 skeleton key（避免用 index）
  const skeletonKeys = useMemo(
    () => Array.from({ length: 8 }, () =>
      (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`)
    ),
    []
  )

  const setQuery = (key: string, val?: string) => {
    if (val) sp.set(key, val); else sp.delete(key)
    sp.set('page', '1')
    setSp(sp)
  }

  const goPage = (n: number) => {
    const safe = Math.min(Math.max(1, n), totalPages)
    sp.set('page', String(safe))
    setSp(sp, { replace: true })
  }

  const around = (center: number, radius = 2): PageToken[] => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(n => Math.abs(n - center) <= radius || n === 1 || n === totalPages)

    const tokens: PageToken[] = []
    for (let i = 0; i < pages.length; i++) {
      const n = pages[i]
      if (i === 0) { tokens.push({ kind: 'page', value: n, key: `p-${n}` }); continue }
      const prev = pages[i - 1]
      if (n - prev === 1) tokens.push({ kind: 'page', value: n, key: `p-${n}` })
      else {
        tokens.push({ kind: 'ellipsis', key: `el-${prev}-${n}` })
        tokens.push({ kind: 'page', value: n, key: `p-${n}` })
      }
    }
    return tokens
  }

  const ageText = (p: Pet) => {
    if (p.age_years || p.age_months) {
      const yy = p.age_years ? `${p.age_years}y` : ''
      const mm = p.age_months ? `${p.age_months}m` : ''
      return [yy, mm].filter(Boolean).join(' ')
    }
    return 'Age N/A'
  }

  const handleToggleFav = async (pet: Pet, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Prevent double-click
    if (favLoading[pet.id]) return
    
    const currentState = favStates[pet.id] ?? pet.is_favorited ?? false
    const newState = !currentState
    
    // Optimistic update
    setFavLoading(prev => ({ ...prev, [pet.id]: true }))
    setFavStates(prev => ({ ...prev, [pet.id]: newState }))
    
    try {
      const result = newState 
        ? await adoptApi.favorite(pet.id) 
        : await adoptApi.unfavorite(pet.id)
      
      // Update from server response
      setFavStates(prev => ({ ...prev, [pet.id]: result.data.favorited }))
    }
    catch (err: any) {
      console.error('Toggle favorite failed:', err)
      console.error('Error response:', err?.response)
      console.error('Error data:', err?.response?.data)
      console.error('Error status:', err?.response?.status)
      
      // Revert on error
      setFavStates(prev => ({ ...prev, [pet.id]: currentState }))
      if (err?.response?.status === 401) {
        alert('请先登录后再收藏')
      } else {
        const errorMsg = err?.response?.data?.detail || err?.response?.data?.error || '收藏操作失败'
        alert(`${errorMsg}\n\n请打开浏览器控制台(F12)查看详细错误信息`)
      }
    }
    finally {
      setFavLoading(prev => ({ ...prev, [pet.id]: false }))
    }
  }

  const handleApplyFilters = (filters: any) => {
    // 创建新的URLSearchParams，保留现有的非筛选参数
    const newSp = new URLSearchParams(sp)
    
    // 应用筛选条件到URL参数（只更新Modal传来的字段）
    if (filters.species !== undefined) {
      if (filters.species) newSp.set('species', filters.species)
      else newSp.delete('species')
    }
    
    if (filters.size !== undefined) {
      if (filters.size) newSp.set('size', filters.size)
      else newSp.delete('size')
    }
    
    if (filters.sex !== undefined) {
      if (filters.sex) newSp.set('sex', filters.sex)
      else newSp.delete('sex')
    }
    
    if (filters.age_min !== undefined) {
      if (filters.age_min) newSp.set('age_min', String(filters.age_min))
      else newSp.delete('age_min')
    }
    
    if (filters.age_max !== undefined) {
      if (filters.age_max) newSp.set('age_max', String(filters.age_max))
      else newSp.delete('age_max')
    }
    
    // 添加宠物特性过滤参数（布尔值字段）
    const petTraits = ['vaccinated', 'sterilized', 'dewormed', 'child_friendly', 'trained', 
                       'loves_play', 'loves_walks', 'good_with_dogs', 'good_with_cats', 
                       'affectionate', 'needs_attention']
    petTraits.forEach(trait => {
      if (filters[trait] !== undefined) {
        if (filters[trait] === true) newSp.set(trait, 'true')
        else newSp.delete(trait)
      }
    })
    
    // 重置到第一页
    newSp.set('page', '1')
    setSp(newSp)
  }

  const appliedFilters = useMemo(() => {
    const filters: { key: string; label: string }[] = []
    
    const speciesMap: Record<string, string> = { dog: '狗', cat: '猫', other: '其他' }
    const sizeMap: Record<string, string> = { small: '小型', medium: '中型', large: '大型' }
    const genderMap: Record<string, string> = { male: '公', female: '母' }
    
    const speciesVal = sp.get('species')
    if (speciesVal) filters.push({ key: 'species', label: `物种: ${speciesMap[speciesVal] || speciesVal}` })
    
    const sizeVal = sp.get('size')
    if (sizeVal) filters.push({ key: 'size', label: `大小: ${sizeMap[sizeVal] || sizeVal}` })
    
    const sexVal = sp.get('sex')
    if (sexVal) filters.push({ key: 'sex', label: `性别: ${genderMap[sexVal] || sexVal}` })
    
    const ageMinVal = sp.get('age_min')
    const ageMaxVal = sp.get('age_max')
    if (ageMinVal || ageMaxVal) {
      const ageLabel = `年龄: ${ageMinVal || '0'}-${ageMaxVal || '99'}个月`
      filters.push({ key: 'age', label: ageLabel })
    }
    
    const traitLabels: Record<string, string> = {
      vaccinated: '已接种疫苗',
      sterilized: '已绝育/已去势',
      dewormed: '已驱虫',
      child_friendly: '适合儿童',
      trained: '家庭训练',
      loves_play: '喜欢玩耍',
      loves_walks: '喜欢散步',
      good_with_dogs: '与其他狗相处友善',
      good_with_cats: '与猫相处友善',
      affectionate: '富有感情的',
      needs_attention: '需要陪伴/关注'
    }
    
    petTraits.forEach(trait => {
      if (sp.get(trait) === 'true') {
        filters.push({ key: trait, label: traitLabels[trait] || trait })
      }
    })
    
    return filters
  }, [sp, petTraits])

  const removeFilter = (key: string) => {
    if (key === 'age') {
      sp.delete('age_min')
      sp.delete('age_max')
    } else {
      sp.delete(key)
    }
    sp.set('page', '1')
    setSp(sp)
  }

  return (
    <div>
      {/* 顶部大标题 + 黄线 */}
      <PageHeroTitle
        title="Pet Search"
        subtitle="Find your best friend!"
      />

      {/* 白色工具条 */}
      <Container className="pf3-toolbar bg-white rounded-4 shadow-sm py-3 px-3 my-3">
        <Stack
          direction="vertical"
          gap={3}
          className="mb-0"
        >
          <Stack
            direction="horizontal"
            gap={3}
            className="flex-wrap justify-content-between align-items-center"
          >
            <div className="fs-5">
              <strong className="fw-bolder">{count}</strong> Pets waiting to meet you
            </div>

            <Stack direction="horizontal" gap={2} className="flex-wrap">
              <Button 
                type="button" 
                variant="primary" 
                className="fw-bold"
                onClick={() => setShowFilterModal(true)}
              >
                <span className="me-2" aria-hidden>🐾</span>
                Find Your Perfect Match
              </Button>

              <Form.Select
                aria-label="Sort"
                value={sort}
                onChange={(e) => setQuery('sort', e.target.value)}
                className="pf3-select"
              >
                <option value="longest_stay">Longest Stay</option>
                <option value="-add_date">Newest</option>
                <option value="name">Name A–Z</option>
              </Form.Select>
            </Stack>
          </Stack>

          {/* 显示已应用的过滤条件 */}
          {appliedFilters.length > 0 && (
            <Stack direction="horizontal" gap={2} className="flex-wrap">
              {appliedFilters.map(filter => (
                <div 
                  key={filter.key}
                  className="badge bg-info d-flex align-items-center gap-2"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
                >
                  {filter.label}
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => removeFilter(filter.key)}
                    style={{ width: '1rem', height: '1rem' }}
                  />
                </div>
              ))}
            </Stack>
          )}
        </Stack>
      </Container>

      {/* 网格 */}
      <Container className="pb-4">
        {loading ? (
          <Row className="g-4">
            {skeletonKeys.map(k => (
              <Col key={k} xs={12} sm={6} md={4} lg={3}>
                <Card className="h-100 border-0 shadow-sm rounded-4">
                  <Placeholder as={Card.Img} animation="wave" style={{ height: 220 }} />
                  <Card.Body>
                    <Placeholder as={Card.Title} animation="wave" className="w-75 rounded-2">
                      Loading
                    </Placeholder>
                    <Placeholder animation="wave" className="w-50 d-block mt-2 rounded-2"> </Placeholder>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <>
            <Row className="g-4">
              {list.map((pet) => {
                const isFav = favStates[pet.id] ?? pet.is_favorited ?? false
                return (
                  <Col key={pet.id} xs={12} sm={6} md={4} lg={3}>
                    <Card className="pf3-card h-100 border-0 shadow-lg rounded-4">
                      <button
                        type="button"
                        className={`pf3-fav-btn ${isFav ? 'is-on' : ''}`}
                        disabled={favLoading[pet.id]}
                        onClick={(e) => handleToggleFav(pet, e)}
                        aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <span className="pf3-fav-icon">
                          {favLoading[pet.id] ? '⋯' : (isFav ? '★' : '☆')}
                        </span>
                      </button>
                      <Link to={`/adopt/${pet.id}`} className="text-decoration-none">
                        <Card.Img
                          variant="top"
                          src={pet.photo || '/images/pet-placeholder.jpg'}
                          alt={pet.name}
                          style={{ objectFit: 'cover', height: 220 }}
                        />
                        <Card.Body>
                          <Card.Title className="pf3-name text-primary fw-bolder">
                            {pet.name}
                          </Card.Title>
                          <div className="text-secondary fw-semibold">A{String(pet.id).padStart(6, '0')}</div>
                          <div className="small text-muted mt-1 d-flex justify-content-between align-items-center">
                            <div className="d-inline-block">
                              {(pet.species ?? 'Pet').toString()} • {ageText(pet)}
                            </div>
                            <div className="pf3-location text-truncate ms-2 d-inline-block" style={{ maxWidth: '40%' }} title={pet.address_display || pet.city || ''}>
                              {((pet.address_display && pet.address_display !== '-' && pet.address_display !== '—') ? pet.address_display : pet.city) || ''}
                            </div>
                          </div>
                        </Card.Body>
                      </Link>
                    </Card>
                  </Col>
                )
              })}
            </Row>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <Pagination className="mb-0">
                  <Pagination.Prev
                    onClick={() => goPage(page - 1)}
                    disabled={page <= 1}
                  />
                  {around(page).map(t =>
                    t.kind === 'ellipsis'
                      ? <Pagination.Ellipsis key={t.key} disabled />
                      : (
                        <Pagination.Item
                          key={t.key}
                          active={t.value === page}
                          onClick={() => goPage(t.value)}
                        >
                          {t.value}
                        </Pagination.Item>
                      )
                  )}
                  <Pagination.Next
                    onClick={() => goPage(page + 1)}
                    disabled={page >= totalPages}
                  />
                </Pagination>
              </div>
            )}
          </>
        )}
      </Container>

      {/* 筛选偏好模态框 */}
      <FilterPreferencesModal 
        show={showFilterModal}
        onHide={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        currentFilters={useMemo(() => {
          const filters: Record<string, any> = {}
          if (sp.get('species')) filters.species = sp.get('species')
          if (sp.get('size')) filters.size = sp.get('size')
          if (sp.get('sex')) filters.sex = sp.get('sex')
          const ageMin = sp.get('age_min')
          if (ageMin) filters.age_min = Number(ageMin)
          const ageMax = sp.get('age_max')
          if (ageMax) filters.age_max = Number(ageMax)
          
          // 添加宠物特性过滤字段
          const petTraits = ['vaccinated', 'sterilized', 'dewormed', 'child_friendly', 'trained', 
                             'loves_play', 'loves_walks', 'good_with_dogs', 'good_with_cats', 
                             'affectionate', 'needs_attention']
          petTraits.forEach(trait => {
            if (sp.get(trait) === 'true') filters[trait] = true
          })
          return filters
        }, [sp])}
      />
    </div>
  )
}
