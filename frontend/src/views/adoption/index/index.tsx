import { useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useRequest } from 'ahooks'
import { adoptApi, type Pet, type Paginated } from '@/services/modules/adopt'
import PageHeroTitle from '@/components/page-hero-title'

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

  const params = useMemo(
    () => ({
      page,
      page_size: pageSize,
      ...(species ? { species } : {}),
      ...(sort ? { ordering: sort } : {}),
    }),
    [page, pageSize, species, sort]
  );

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
          direction="horizontal"
          gap={3}
          className="flex-wrap justify-content-between align-items-center"
        >
          <div className="fs-5">
            <strong className="fw-bolder">{count}</strong> Pets waiting to meet you
          </div>

          <Stack direction="horizontal" gap={2} className="flex-wrap">
            <Button type="button" variant="primary" className="fw-bold">
              <span className="me-2" aria-hidden>🐾</span>
              Find Your Perfect Match
            </Button>

            <Button type="button" variant="light" className="pf3-pill fw-semibold border">
              Longest Stay <span className="ms-1" aria-hidden>▾</span>
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

            <Form.Select
              aria-label="Species"
              value={species}
              onChange={(e) => setQuery('species', e.target.value || undefined)}
              className="pf3-select"
            >
              <option value="">All Species</option>
              <option value="dog">Dogs</option>
              <option value="cat">Cats</option>
            </Form.Select>
          </Stack>
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
    </div>
  )
}
