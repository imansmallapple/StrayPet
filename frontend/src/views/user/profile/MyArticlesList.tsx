// src/views/user/profile/MyArticlesList.tsx
import { useState } from 'react'
import { useRequest } from 'ahooks'
import { Card, Row, Col, Badge, Spinner, Alert, Pagination, Button } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { blogApi } from '@/services/modules/blog'

export default function MyArticlesList() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data, loading, error } = useRequest(
    () => blogApi.getMyArticles({ page, page_size: pageSize }),
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

  if (loading) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <div className="mt-3">加载中...</div>
        </Card.Body>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="shadow-sm">
        <Card.Body>
          <Alert variant="danger">加载失败，请稍后重试</Alert>
        </Card.Body>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="bi bi-file-earmark-text me-2"></i>
          我的文章
        </h5>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/blog/create')}
        >
          <i className="bi bi-plus-circle me-1"></i>
          写文章
        </Button>
      </Card.Header>
      <Card.Body>
        {articles.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-inbox fs-1 d-block mb-3"></i>
            <p>你还没有发布任何文章</p>
            <Button variant="outline-primary" onClick={() => navigate('/blog/create')}>
              开始写作
            </Button>
          </div>
        ) : (
          <>
            <Row>
              {articles.map((article) => (
                <Col key={article.id} xs={12} className="mb-3">
                  <Card className="h-100 article-card my-article-card position-relative">
                    <button
                      type="button"
                      className="article-delete-btn"
                      onClick={() => {
                        if (window.confirm('确定要删除这篇文章吗？')) {
                          navigate(`/blog/edit/${article.id}?delete=true`)
                        }
                      }}
                      title="删除文章"
                      aria-label="删除文章"
                    >
                      <i className="bi bi-trash3"></i>
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
                          {article.tags && article.tags.slice(0, 3).map((tag) => (
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
