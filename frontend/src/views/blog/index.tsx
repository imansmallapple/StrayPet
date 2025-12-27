// src/views/blog/index.tsx
import { useState } from 'react'
import { useRequest } from 'ahooks'
import { Container, Row, Col, Card, Badge, Form, Spinner, Pagination, InputGroup, Button } from 'react-bootstrap'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { blogApi } from '@/services/modules/blog'
import { useAuth } from '@/hooks/useAuth'
import './index.scss'

export default function BlogList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const category = searchParams.get('category') || ''
  const tag = searchParams.get('tag') || ''
  const search = searchParams.get('search') || ''
  const ordering = searchParams.get('ordering') || '-add_date'
  
  const [searchInput, setSearchInput] = useState(search)

  // 加载文章列表
  const { data: articlesData, loading: articlesLoading } = useRequest(
    () => {
      const params: {
        page: number
        page_size: number
        category?: number
        tags?: number
        search?: string
        ordering: string
      } = {
        page,
        page_size: 10,
        ordering,
      }
      if (category) params.category = Number(category)
      if (tag) params.tags = Number(tag)
      if (search) params.search = search
      return blogApi.listArticles(params)
    },
    {
      refreshDeps: [page, category, tag, search, ordering],
    }
  )

  // 加载分类列表
  const { data: categoriesData } = useRequest(() => blogApi.listCategories())

  // 加载热门标签列表（按使用频率排序）
  const { data: tagsData } = useRequest(() => blogApi.getPopularTags())

  // 加载归档
  const { data: archiveData } = useRequest(() => blogApi.getArchive())

  const articles = articlesData?.data.results || []
  const totalCount = articlesData?.data.count || 0
  const totalPages = Math.ceil(totalCount / 10)
  const categories = categoriesData?.data || []
  const tags = tagsData?.data || []
  const archives = archiveData?.data || []

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(newPage))
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCategoryChange = (categoryId: string) => {
    const params = new URLSearchParams(searchParams)
    if (categoryId) {
      params.set('category', categoryId)
    } else {
      params.delete('category')
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const handleTagClick = (tagId: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('tag', String(tagId))
    params.set('page', '1')
    setSearchParams(params)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (searchInput) {
      params.set('search', searchInput)
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const handleOrderingChange = (newOrdering: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('ordering', newOrdering)
    params.set('page', '1')
    setSearchParams(params)
  }

  const clearFilters = () => {
    setSearchInput('')
    setSearchParams({})
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[month - 1]
  }

  return (
    <div className="blog-list-page">
      <div className="blog-header">
        <Container>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1>Pet Care Blog</h1>
              <p>Tips, stories, and advice for pet lovers</p>
            </div>
            {user && (
              <Button
                variant="light"
                size="lg"
                onClick={() => navigate('/blog/create')}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Write Article
              </Button>
            )}
          </div>
        </Container>
      </div>

      <Container className="mt-4">
        <Row>
          {/* Main Content */}
          <Col lg={8}>
            {/* Search and Sort */}
            <Card className="mb-4">
              <Card.Body>
                <Row className="g-3">
                  <Col md={8}>
                    <Form onSubmit={handleSearch}>
                      <InputGroup>
                        <Form.Control
                          type="text"
                          placeholder="Search articles..."
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <Button type="submit" variant="primary">
                          <i className="bi bi-search"></i>
                        </Button>
                      </InputGroup>
                    </Form>
                  </Col>
                  <Col md={4}>
                    <Form.Select
                      value={ordering}
                      onChange={(e) => handleOrderingChange(e.target.value)}
                    >
                      <option value="-add_date">Latest First</option>
                      <option value="add_date">Oldest First</option>
                      <option value="-count">Most Viewed</option>
                    </Form.Select>
                  </Col>
                </Row>
                {(category || tag || search) && (
                  <div className="mt-3">
                    <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
                      <i className="bi bi-x-circle me-1"></i>
                      Clear Filters
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Articles List */}
            {articlesLoading ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status" />
              </div>
            ) : articles.length === 0 ? (
              <Card>
                <Card.Body className="text-center py-5">
                  <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                  <p className="mt-3 text-muted">No articles found</p>
                </Card.Body>
              </Card>
            ) : (
              <>
                {articles.map((article) => (
                  <Card key={article.id} className="mb-4 article-card">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Link to={`/blog/${article.id}`} className="article-title-link">
                          <h4>{article.title}</h4>
                        </Link>
                      </div>
                      <div className="article-meta mb-3 d-flex align-items-center">
                        {article.author && (
                          <div className="author-info me-3 d-flex align-items-center gap-2" style={{ fontSize: '0.9rem', cursor: 'pointer' }} onClick={() => navigate(`/user/profile/${article.author?.id}`)}>
                            <div 
                              className="author-avatar"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: '#667eea',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                overflow: 'hidden',
                                flexShrink: 0
                              }}
                            >
                              {article.author.avatar ? (
                                <img 
                                  src={article.author.avatar} 
                                  alt={article.author.username}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                article.author.username.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span style={{ color: '#667eea' }}>{article.author.username}</span>
                          </div>
                        )}
                        <span className="me-3">
                          <i className="bi bi-calendar3 me-1"></i>
                          {formatDate(article.add_date)}
                        </span>
                        <span className="me-3">
                          <i className="bi bi-eye me-1"></i>
                          {article.count || 0} views
                        </span>
                      </div>
                      <p className="article-description">{article.description}</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="article-tags">
                          {article.tags.map((tag) => (
                            <Badge key={tag} bg="secondary" className="me-1">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Link to={`/blog/${article.id}`} className="read-more">
                          Read More <i className="bi bi-arrow-right"></i>
                        </Link>
                      </div>
                    </Card.Body>
                  </Card>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mb-4">
                    <Pagination>
                      <Pagination.First onClick={() => handlePageChange(1)} disabled={page === 1} />
                      <Pagination.Prev onClick={() => handlePageChange(page - 1)} disabled={page === 1} />
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (page <= 3) {
                          pageNum = i + 1
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = page - 2 + i
                        }
                        return (
                          <Pagination.Item
                            key={pageNum}
                            active={pageNum === page}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Pagination.Item>
                        )
                      })}

                      <Pagination.Next onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} />
                      <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={page === totalPages} />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </Col>

          {/* Sidebar */}
          <Col lg={4}>
            {/* Categories */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="bi bi-folder me-2"></i>
                  Categories
                </h5>
              </Card.Header>
              <Card.Body>
                <Form.Select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {Array.isArray(categories) && categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Form.Select>
              </Card.Body>
            </Card>

            {/* Hashtag Usage Tip */}
            {user && (
              <Card className="mb-4 border-info">
                <Card.Body className="bg-light">
                  <div className="d-flex align-items-start">
                    <i className="bi bi-lightbulb text-info me-2 fs-5"></i>
                    <div>
                      <h6 className="mb-2 text-info">💡 Hashtag Tips</h6>
                      <p className="mb-2 small">
                        Use <code>#hashtag</code> in your articles to automatically create tags!
                      </p>
                      <p className="mb-0 small text-muted">
                        Example: <code>#猫咪护理</code> <code>#宠物训练</code>
                      </p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Tags */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="bi bi-tags me-2"></i>
                  Popular Tags
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="tag-cloud">
                  {Array.isArray(tags) && tags.length > 0 ? (
                    tags.map((tagItem) => (
                      <Badge
                        key={tagItem.id}
                        bg="light"
                        text="dark"
                        className="me-2 mb-2 tag-badge"
                        role="button"
                        onClick={() => handleTagClick(tagItem.id)}
                        title={`${tagItem.article_count || 0} articles`}
                      >
                        #{tagItem.name}
                        {tagItem.article_count && tagItem.article_count > 0 && (
                          <span className="ms-1 text-muted small">({tagItem.article_count})</span>
                        )}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted small mb-0">
                      <i className="bi bi-info-circle me-1"></i>
                      No tags yet. Create articles with #hashtags to see popular tags here!
                    </p>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Archives */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="bi bi-archive me-2"></i>
                  Archives
                </h5>
              </Card.Header>
              <Card.Body>
                {archives.length === 0 ? (
                  <p className="text-muted mb-0">No archives yet</p>
                ) : (
                  <div className="archive-list">
                    {archives.map((archive) => (
                      <Link
                        key={`${archive.year}-${archive.month}`}
                        to={`/blog/archive/${archive.year}/${archive.month}`}
                        className="archive-item"
                      >
                        <span>{getMonthName(archive.month)} {archive.year}</span>
                        <Badge bg="secondary">{archive.count}</Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}
