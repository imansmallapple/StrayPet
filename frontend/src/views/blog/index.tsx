// src/views/blog/index.tsx
import { useState } from 'react'
import { useRequest } from 'ahooks'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { blogApi } from '@/services/modules/blog'
import { useAuth } from '@/hooks/useAuth'
import PageHeroTitle from '@/components/page-hero-title'
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
      <PageHeroTitle title="Pet Care Blog" subtitle="Tips, stories, and advice for pet lovers" />
      
      <div className="blog-container">
        <div className="blog-main-content">
          {/* Search and Sort Section */}
          <div className="search-sort-section">
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-wrapper">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="search-btn">Search</button>
              </div>
            </form>
            
            <select
              value={ordering}
              onChange={(e) => handleOrderingChange(e.target.value)}
              className="sort-select"
            >
              <option value="-add_date">Latest</option>
              <option value="add_date">Oldest</option>
              <option value="-count">Most Viewed</option>
            </select>
          </div>

          {(category || tag || search) && (
            <div className="clear-filters">
              <button type="button" onClick={clearFilters} className="clear-btn">
                <i className="bi bi-x-circle"></i>
                Clear Filters
              </button>
            </div>
          )}

          {/* Articles List */}
          {articlesLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading articles...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="empty-alert">
              <i className="bi bi-inbox"></i>
              <p>No articles found</p>
            </div>
          ) : (
            <>
              <div className="articles-list">
                {articles.map((article) => (
                  <article key={article.id} className="article-card">
                    <div className="article-header">
                      <Link to={`/blog/${article.id}`} className="article-title-link">
                        <h3 className="article-title">{article.title}</h3>
                      </Link>
                    </div>
                    
                    <div className="article-meta">
                      {article.author && (
                        <div className="author-info" onClick={() => navigate(`/user/profile/${article.author?.id}`)}>
                          <div 
                            className="author-avatar"
                            style={{
                              backgroundImage: article.author.avatar ? `url(${article.author.avatar})` : 'none'
                            }}
                          >
                            {!article.author.avatar && article.author.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="author-name">{article.author.username}</span>
                        </div>
                      )}
                      <span className="meta-item">
                        <i className="bi bi-calendar3"></i>
                        {formatDate(article.add_date)}
                      </span>
                      <span className="meta-item">
                        <i className="bi bi-eye"></i>
                        {article.count || 0} views
                      </span>
                    </div>
                    
                    <p className="article-description">{article.description}</p>
                    
                    <div className="article-footer">
                      <div className="article-tags">
                        {article.tags.map((tag) => (
                          <span key={tag} className="tag-badge">{tag}</span>
                        ))}
                      </div>
                      <Link to={`/blog/${article.id}`} className="read-more">
                        Read More
                      </Link>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-section">
                  <button
                    type="button"
                    className="pagination-btn"
                    disabled={page === 1}
                    onClick={() => handlePageChange(1)}
                  >
                    First
                  </button>
                  <button
                    type="button"
                    className="pagination-btn"
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    Prev
                  </button>
                  
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
                      <button
                        key={pageNum}
                        type="button"
                        className={`pagination-btn ${pageNum === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    )
                  })}

                  <button
                    type="button"
                    className="pagination-btn"
                    disabled={page === totalPages}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    className="pagination-btn"
                    disabled={page === totalPages}
                    onClick={() => handlePageChange(totalPages)}
                  >
                    Last
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="blog-sidebar">
          {/* Categories */}
          <section className="sidebar-widget">
            <h3 className="widget-title">
              <i className="bi bi-folder"></i>
              Categories
            </h3>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="category-select"
            >
              <option value="">All Categories</option>
              {Array.isArray(categories) && categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </section>

          {/* Hashtag Tip */}
          {user && (
            <section className="sidebar-widget hashtag-tip">
              <div className="tip-content">
                <i className="bi bi-lightbulb"></i>
                <div>
                  <h4>💡 Hashtag Tips</h4>
                  <p>Use <code>#hashtag</code> in your articles to automatically create tags!</p>
                  <p className="example">Example: <code>#PetCare</code> <code>#Training</code></p>
                </div>
              </div>
            </section>
          )}

          {/* Tags */}
          <section className="sidebar-widget">
            <h3 className="widget-title">
              <i className="bi bi-tags"></i>
              Popular Tags
            </h3>
            <div className="tag-cloud">
              {Array.isArray(tags) && tags.length > 0 ? (
                tags.map((tagItem) => (
                  <span
                    key={tagItem.id}
                    className="tag-badge-clickable"
                    role="button"
                    onClick={() => handleTagClick(tagItem.id)}
                    title={`${tagItem.article_count || 0} articles`}
                  >
                    #{tagItem.name}
                    {tagItem.article_count && tagItem.article_count > 0 && (
                      <span className="tag-count">({tagItem.article_count})</span>
                    )}
                  </span>
                ))
              ) : (
                <p className="no-tags">
                  <i className="bi bi-info-circle"></i>
                  No tags yet. Create articles with #hashtags!
                </p>
              )}
            </div>
          </section>

          {/* Archives */}
          <section className="sidebar-widget">
            <h3 className="widget-title">
              <i className="bi bi-archive"></i>
              Archives
            </h3>
            {archives.length === 0 ? (
              <p className="no-archives">No archives yet</p>
            ) : (
              <div className="archive-list">
                {archives.map((archive) => (
                  <Link
                    key={`${archive.year}-${archive.month}`}
                    to={`/blog/archive/${archive.year}/${archive.month}`}
                    className="archive-item"
                  >
                    <span>{getMonthName(archive.month)} {archive.year}</span>
                    <span className="archive-count">{archive.count}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Write Article Button */}
          {user && (
            <section className="sidebar-widget write-article-section">
              <button
                type="button"
                className="write-article-btn"
                onClick={() => navigate('/blog/create')}
              >
                <i className="bi bi-plus-circle"></i>
                Write Article
              </button>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
