// src/views/user/profile/MyArticlesList.tsx
import { useState } from 'react'
import { useRequest } from 'ahooks'
import { Link, useNavigate } from 'react-router-dom'
import { blogApi } from '@/services/modules/blog'
import Pagination from '@/components/Pagination'
import './MyArticlesList.scss'

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
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="my-articles-container">
        <div className="my-articles-loading">
          <div className="spinner"></div>
          <p>Loading articles...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="my-articles-container">
        <div className="my-articles-error">
          <i className="bi bi-exclamation-triangle"></i>
          <p>Failed to load articles, please try again</p>
        </div>
      </div>
    )
  }

  return (
    <div className="my-articles-container">
      <div className="my-articles-header">
        <div>
          <h5 className="mb-0">
            <i className="bi bi-file-earmark-text me-2"></i>
            My Articles
          </h5>
          <small className="text-muted">{totalCount} articles published</small>
        </div>
        <button
          type="button"
          className="btn-write-article"
          onClick={() => navigate('/blog/create')}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Write Article
        </button>
      </div>

      {articles.length === 0 ? (
        <div className="my-articles-empty">
          <i className="bi bi-inbox"></i>
          <h6>No articles yet</h6>
          <p>Start sharing your thoughts with the community</p>
        </div>
      ) : (
        <>
          <div className="my-articles-list">
            {articles.map((article) => (
              <article key={article.id} className="article-item">
                <div className="article-delete-btn-wrapper">
                  <button
                    type="button"
                    className="article-delete-btn"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this article?')) {
                        navigate(`/blog/edit/${article.id}?delete=true`)
                      }
                    }}
                    title="Delete article"
                    aria-label="Delete article"
                  >
                    <i className="bi bi-trash3"></i>
                  </button>
                </div>

                <div className="article-main-content">
                  <div className="article-header-section">
                    <Link
                      to={`/blog/${article.id}`}
                      className="article-title-link"
                    >
                      <h6 className="article-title">{article.title}</h6>
                    </Link>
                    <div className="article-meta-info">
                      <span className="meta-item">
                        <i className="bi bi-calendar3"></i>
                        {formatDate(article.add_date)}
                      </span>
                      <span className="meta-item">
                        <i className="bi bi-eye"></i>
                        {article.count || 0} views
                      </span>
                    </div>
                  </div>
                  
                  <p className="article-description">
                    {article.description}
                  </p>

                  <div className="article-footer-section">
                    <div className="tags-section">
                      {article.tags && article.tags.length > 0 && (
                        <div className="tags-wrapper">
                          {article.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="tag-badge">
                              #{tag}
                            </span>
                          ))}
                          {article.tags.length > 3 && (
                            <span className="tag-more">+{article.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <Link
                      to={`/blog/${article.id}`}
                      className="read-more-link"
                    >
                      Read More
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              showFirstLast
            />
          )}
        </>
      )}
    </div>
  )
}
