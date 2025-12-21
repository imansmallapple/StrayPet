// src/views/blog/archive/index.tsx
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useRequest } from 'ahooks'
import { Container, Card, Badge, Spinner, Pagination, Button } from 'react-bootstrap'
import { blogApi } from '@/services/modules/blog'
import { useState } from 'react'
import './index.scss'

export default function BlogArchive() {
  const { year, month } = useParams<{ year: string; month: string }>()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data: articlesData, loading } = useRequest(
    () => blogApi.getArchiveDetail(Number(year), Number(month), {
      page,
      page_size: pageSize,
    }),
    {
      ready: !!year && !!month,
      refreshDeps: [year, month, page],
    }
  )

  const articles = articlesData?.data.results || []
  const totalCount = articlesData?.data.count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  const getMonthName = (monthNum: string) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return months[Number(monthNum) - 1]
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!year || !month) {
    return (
      <Container className="py-5 text-center">
        <p>Invalid archive date</p>
      </Container>
    )
  }

  return (
    <div className="blog-archive-page">
      <div className="archive-header">
        <Container>
          <Button
            variant="link"
            className="back-button"
            onClick={() => navigate('/blog')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Blog
          </Button>
          <h1>
            <i className="bi bi-archive me-3"></i>
            {getMonthName(month)} {year}
          </h1>
          <p>{totalCount} article{totalCount !== 1 ? 's' : ''} in this archive</p>
        </Container>
      </div>

      <Container className="mt-4">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" />
          </div>
        ) : articles.length === 0 ? (
          <Card>
            <Card.Body className="text-center py-5">
              <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
              <p className="mt-3 text-muted">No articles found in this archive</p>
            </Card.Body>
          </Card>
        ) : (
          <>
            {articles.map((article) => (
              <Card key={article.id} className="mb-3 article-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <Link to={`/blog/${article.id}`} className="article-title-link">
                        <h4>{article.title}</h4>
                      </Link>
                      <div className="article-meta mb-2">
                        <span className="me-3">
                          <i className="bi bi-calendar3 me-1"></i>
                          {formatDate(article.add_date)}
                        </span>
                        <span className="me-3">
                          <i className="bi bi-eye me-1"></i>
                          {article.count || 0} views
                        </span>
                      </div>
                      <p className="article-description mb-2">{article.description}</p>
                      <div className="article-tags">
                        {article.tags.map((tag) => (
                          <Badge key={tag} bg="secondary" className="me-1">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Link to={`/blog/${article.id}`} className="btn btn-outline-primary ms-3">
                      Read
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4 mb-4">
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
      </Container>
    </div>
  )
}
