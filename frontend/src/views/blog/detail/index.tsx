// src/views/blog/detail/index.tsx
import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useRequest } from 'ahooks'
import { Container, Row, Col, Card, Badge, Button, Form, Spinner, Alert } from 'react-bootstrap'
import { blogApi, type Comment } from '@/services/modules/blog'
import { useAuth } from '@/hooks/useAuth'
import SafeHtml from '@/components/SafeHtml'
import './index.scss'

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAuthenticated = !!user
  const [commentContent, setCommentContent] = useState('')
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [favoriting, setFavoriting] = useState(false)

  // 加载文章详情
  const { data: articleData, loading: articleLoading, refresh: refreshArticle } = useRequest(
    () => blogApi.getArticle(Number(id)),
    {
      ready: !!id,
      refreshDeps: [id],
    }
  )

  // 加载评论
  const { data: commentsData, loading: commentsLoading, refresh: refreshComments } = useRequest(
    () => blogApi.getComments(Number(id), { page_size: 100 }),
    {
      ready: !!id,
      refreshDeps: [id],
    }
  )

  const article = articleData?.data
  const comments = commentsData?.data.results || []

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentContent.trim()) return

    try {
      setSubmitError(null)
      const commentData: { content: string; parent?: number } = {
        content: commentContent.trim(),
      }
      if (replyTo) {
        commentData.parent = replyTo
      }
      await blogApi.addComment(Number(id), commentData)
      setCommentContent('')
      setReplyTo(null)
      refreshComments()
    } catch (error: any) {
      setSubmitError(error.response?.data?.detail || 'Failed to post comment')
    }
  }

  const handleReply = (commentId: number) => {
    setReplyTo(commentId)
    document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/auth/login')
      return
    }

    try {
      setFavoriting(true)
      if (article?.is_favorited) {
        await blogApi.unfavoriteArticle(Number(id))
      } else {
        await blogApi.favoriteArticle(Number(id))
      }
      refreshArticle()
    } catch (_error) {
      alert('操作失败，请稍后重试')
    } finally {
      setFavoriting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (!id) {
    return (
      <Container className="py-5 text-center">
        <p>Invalid article ID</p>
      </Container>
    )
  }

  if (articleLoading || !article) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    )
  }

  const renderComment = (comment: Comment) => (
    <div key={comment.id} className="comment-item">
      <div className="comment-header">
        <div className="comment-author">
          <i className="bi bi-person-circle me-2"></i>
          <strong>{comment.user.username}</strong>
        </div>
        <div className="comment-date">
          {formatDate(comment.add_date)}
        </div>
      </div>
      <div className="comment-content">
        {comment.content}
      </div>
      <div className="comment-actions">
        {isAuthenticated && (
          <Button
            variant="link"
            size="sm"
            onClick={() => handleReply(comment.id)}
          >
            <i className="bi bi-reply me-1"></i>
            Reply
          </Button>
        )}
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map(renderComment)}
        </div>
      )}
    </div>
  )

  return (
    <div className="blog-detail-page">
      <div className="article-header">
        <Container>
          <Button
            variant="link"
            className="back-button"
            onClick={() => navigate('/blog')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Blog
          </Button>
          <h1>{article.title}</h1>
          <div className="article-meta">
            <span className="me-3">
              <i className="bi bi-calendar3 me-1"></i>
              {formatDate(article.add_date)}
            </span>
            <span className="me-3">
              <i className="bi bi-eye me-1"></i>
              {article.count || 0} views
            </span>
            {article.author_username && (
              <span className="me-3">
                <i className="bi bi-person me-1"></i>
                {article.author_username}
              </span>
            )}
            <Button
              variant={article.is_favorited ? "danger" : "outline-danger"}
              size="sm"
              onClick={handleToggleFavorite}
              disabled={favoriting}
              className="ms-2"
            >
              <i className={`bi bi-${article.is_favorited ? 'bookmark-fill' : 'bookmark'} me-1`}></i>
              {article.is_favorited ? '已收藏' : '收藏'}
            </Button>
          </div>
          <div className="article-tags mt-3">
            {article.tags.map((tag) => (
              <Badge key={tag} bg="light" text="dark" className="me-2">
                {tag}
              </Badge>
            ))}
          </div>
        </Container>
      </div>

      <Container className="mt-4">
        <Row>
          <Col lg={9}>
            <Card className="article-content-card mb-4">
              <Card.Body>
                <SafeHtml html={article.content} />
              </Card.Body>
            </Card>

            {/* Comments Section */}
            <Card className="comments-section">
              <Card.Header>
                <h4 className="mb-0">
                  <i className="bi bi-chat-dots me-2"></i>
                  Comments ({comments.length})
                </h4>
              </Card.Header>
              <Card.Body>
                {/* Comment Form */}
                {isAuthenticated ? (
                  <div id="comment-form" className="comment-form mb-4">
                    <h5>{replyTo ? 'Reply to Comment' : 'Leave a Comment'}</h5>
                    {replyTo && (
                      <Alert variant="info" dismissible onClose={() => setReplyTo(null)}>
                        Replying to comment #{replyTo}
                      </Alert>
                    )}
                    {submitError && (
                      <Alert variant="danger" dismissible onClose={() => setSubmitError(null)}>
                        {submitError}
                      </Alert>
                    )}
                    <Form onSubmit={handleSubmitComment}>
                      <Form.Group className="mb-3">
                        <Form.Control
                          as="textarea"
                          rows={4}
                          placeholder="Write your comment..."
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          required
                        />
                      </Form.Group>
                      <div className="d-flex gap-2">
                        <Button type="submit" variant="primary">
                          <i className="bi bi-send me-2"></i>
                          Post Comment
                        </Button>
                        {replyTo && (
                          <Button
                            type="button"
                            variant="outline-secondary"
                            onClick={() => setReplyTo(null)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </Form>
                  </div>
                ) : (
                  <Alert variant="info">
                    Please <Link to="/login">log in</Link> to leave a comment.
                  </Alert>
                )}

                {/* Comments List */}
                {commentsLoading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-chat" style={{ fontSize: '2rem' }}></i>
                    <p className="mt-2">No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  <div className="comments-list">
                    {comments.map(renderComment)}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Sidebar */}
          <Col lg={3}>
            {article.toc && (
              <Card className="toc-card sticky-top" style={{ top: '1rem' }}>
                <Card.Header>
                  <h6 className="mb-0">
                    <i className="bi bi-list-ul me-2"></i>
                    Table of Contents
                  </h6>
                </Card.Header>
                <Card.Body className="toc-content">
                  <SafeHtml html={article.toc} />
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  )
}
