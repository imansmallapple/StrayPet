// src/views/user/profile/FavoriteArticlesList.tsx
import { useState } from 'react'
import { useRequest } from 'ahooks'
import { Card, Row, Col, Badge, Spinner, Alert, Pagination } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { blogApi } from '@/services/modules/blog'

export default function FavoriteArticlesList() {
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data, loading, error, refresh } = useRequest(
    () => blogApi.getFavoriteArticles({ page, page_size: pageSize }),
    {
      refreshDeps: [page],
    }
  )

  const articles = data?.data.results || []
  const totalCount = data?.data.count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleUnfavorite = async (articleId: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to unfavorite this article?')) return

    try {
      await blogApi.unfavoriteArticle(articleId)
      refresh()
    } catch (_err) {
      alert('Failed to unfavorite, please try again')
    }
  }

  if (loading) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <div className="mt-3">Loading...</div>
        </Card.Body>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="shadow-sm">
        <Card.Body>
          <Alert variant="danger">Failed to load, please try again</Alert>
        </Card.Body>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <h5 className="mb-0">
          <i className="bi bi-bookmark-star-fill me-2"></i>
          Favorite Articles
        </h5>
      </Card.Header>
      <Card.Body>
        {articles.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-bookmark fs-1 d-block mb-3"></i>
            <p>You have not favorited any articles yet</p>
            <Link to="/blog" className="btn btn-outline-primary">
              Discover great articles
            </Link>
          </div>
        ) : (
          <>
            <Row>
              {articles.map((article) => (
                <Col key={article.id} xs={12} className="mb-3">
                  <Card className="h-100 article-card favorite-article-card position-relative">
                    <button
                      type="button"
                      className="article-unfav-btn"
                      onClick={(e) => handleUnfavorite(article.id, e)}
                      title="Unfavorite"
                      aria-label="Unfavorite article"
                    >
                      <i className="bi bi-bookmark-x-fill"></i>
                    </button>
                    <Card.Body>
                      <div className="mb-2">
                        <Link
                          to={`/blog/${article.id}`}
                          className="text-decoration-none"
                        >
                          <h6 className="mb-1 article-title">{article.title}</h6>
                        </Link>
                      </div>
                      
                      <p className="text-muted small mb-2 article-description">
                        {article.description}
                      </p>

                      <div className="d-flex justify-content-between align-items-center">
                        <div className="tags-wrapper">
                          {article.author_username && (
                            <Badge bg="secondary" className="me-2">
                              <i className="bi bi-person me-1"></i>
                              {article.author_username}
                            </Badge>
                          )}
                          {article.tags && article.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              bg="light"
                              text="dark"
                              className="me-1"
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="d-flex gap-3">
                          <small className="text-muted">
                            {formatDate(article.add_date)}
                          </small>
                          <small className="text-muted">
                            <i className="bi bi-eye me-1"></i>
                            {article.count || 0}
                          </small>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <Pagination>
                  <Pagination.First onClick={() => setPage(1)} disabled={page === 1} />
                  <Pagination.Prev onClick={() => setPage(page - 1)} disabled={page === 1} />
                  {[...Array(totalPages)].map((_, idx) => {
                    const pageNum = idx + 1
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    ) {
                      return (
                        <Pagination.Item
                          key={pageNum}
                          active={pageNum === page}
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Pagination.Item>
                      )
                    } else if (pageNum === page - 2 || pageNum === page + 2) {
                      return <Pagination.Ellipsis key={pageNum} disabled />
                    }
                    return null
                  })}
                  <Pagination.Next
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  />
                  <Pagination.Last
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                  />
                </Pagination>
              </div>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  )
}
