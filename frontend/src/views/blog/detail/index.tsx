
// DialogModal 组件和类型定义在最顶部，避免嵌套定义警告
import { useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useRequest } from 'ahooks'
import { Container, Row, Col, Card, Badge, Button, Form, Spinner, Alert, Modal } from 'react-bootstrap'
import { blogApi, type Comment } from '@/services/modules/blog'
import { useAuth } from '@/hooks/useAuth'
import SafeHtml from '@/components/SafeHtml'
import EmojiPicker from '@/components/EmojiPicker'
import './index.scss'

type DialogModalProps = {
  show: boolean
  onHide: () => void
  dialogComments: Comment[]
  dialogActiveId: number | null
  findParentUsername: (parentId: number) => string
  formatCommentDate: (dateStr: string) => string
}
const DialogModal = ({ show, onHide, dialogComments, dialogActiveId, findParentUsername, formatCommentDate }: DialogModalProps) => (
  <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
    <Modal.Header closeButton>
      <Modal.Title>对话列表</Modal.Title>
    </Modal.Header>
    <Modal.Body style={{ background: '#18191c', color: '#fff', minHeight: 200, maxHeight: 500, overflowY: 'auto' }}>
      {dialogComments.length === 0 ? (
        <div className="text-center text-muted">暂无对话</div>
      ) : (
        <div>
          {dialogComments.map((c) => (
            <div
              key={c.id}
              id={`dialog-comment-${c.id}`}
              style={{
                background: c.id === dialogActiveId ? '#232324' : 'transparent',
                borderRadius: 8,
                padding: '1rem',
                marginBottom: 12,
                color: '#fff',
                border: c.id === dialogActiveId ? '1px solid #667eea' : 'none',
                boxShadow: c.id === dialogActiveId ? '0 0 0 2px #667eea22' : 'none',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {c.user.username}
                {c.parent && (
                  <span style={{ color: '#aaa', fontWeight: 400, marginLeft: 8, fontSize: 13 }}>
                    回复
                    <span style={{ color: '#67e', marginLeft: 2 }}>@{findParentUsername(c.parent)}</span>
                  </span>
                )}
              </div>
              <div style={{ fontSize: 15, marginBottom: 6 }}>{c.content}</div>
              <div style={{ fontSize: 12, color: '#aaa' }}>
                {formatCommentDate(c.add_date)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal.Body>
  </Modal>
)

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAuthenticated = !!user
  const [commentContent, setCommentContent] = useState('')
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [replyToUsername, setReplyToUsername] = useState<string>('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [favoriting, setFavoriting] = useState(false)
  const [expandedComments, setExpandedComments] = useState<Set<number>>(() => new Set())
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 对话弹窗相关状态
  const [showDialogModal, setShowDialogModal] = useState(false)
  const [dialogComments, setDialogComments] = useState<Comment[]>([])
  const [dialogActiveId, setDialogActiveId] = useState<number | null>(null)
  // 查找一条评论的对话链（主评论到当前评论的链路）
  function findDialogChain(commentId: number): Comment[] {
    // 递归查找主评论和所有子评论
    function dfs(list: Comment[], targetId: number, path: Comment[]): boolean {
      for (const c of list) {
        if (c.id === targetId) {
          path.unshift(c)
          return true
        }
        if (c.replies && c.replies.length > 0) {
          if (dfs(c.replies, targetId, path)) {
            path.unshift(c)
            return true
          }
        }
      }
      return false
    }
    const path: Comment[] = []
    dfs(comments, commentId, path)
    return path
  }

  // 打开对话弹窗
  const handleShowDialog = (commentId: number) => {
    const dialogChain = findDialogChain(commentId)
    setDialogComments(dialogChain)
    setDialogActiveId(commentId)
    setShowDialogModal(true)
    setTimeout(() => {
      // 滚动到当前评论
      const el = document.getElementById(`dialog-comment-${commentId}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 200)
  }

  // 关闭对话弹窗
  const handleCloseDialog = () => {
    setShowDialogModal(false)
    setDialogComments([])
    setDialogActiveId(null)
  }

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
      setReplyToUsername('')
      refreshComments()
    } catch (error: any) {
      setSubmitError(error.response?.data?.detail || 'Failed to post comment')
    }
  }

  // 渲染评论表单组件
  const renderCommentForm = (isReply: boolean = false, parentId?: number) => {
    // 如果是回复表单但不是当前要回复的评论，不显示
    if (isReply && replyTo !== parentId) return null
    // 如果是主评论表单但当前在回复模式，不显示
    if (!isReply && replyTo) return null

    return (
      <div className={`comment-form ${isReply ? 'reply-form' : 'main-form'}`}>
        {!isReply && (
          <h5>
            <i className="bi bi-chat-left-text me-2"></i>
            Leave a Comment
          </h5>
        )}
        {isReply && (
          <Alert variant="info" dismissible onClose={handleCancelReply} className="mb-2">
            <i className="bi bi-reply me-2"></i>
            Replying to <strong>@{replyToUsername}</strong>
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
              ref={textareaRef}
              as="textarea"
              rows={isReply ? 3 : 4}
              placeholder="Write your comment... You can use emojis! 😊"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              required
              className="comment-textarea"
              autoFocus={isReply}
            />
          </Form.Group>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex gap-2">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              <span className="text-muted small align-self-center">
                Click to add emoji
              </span>
            </div>
            <div className="d-flex gap-2">
              {isReply && (
                <Button
                  type="button"
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleCancelReply}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Cancel
                </Button>
              )}
              <Button 
                type="submit" 
                variant="primary" 
                {...(isReply && { size: 'sm' as const })}
              >
                <i className="bi bi-send me-2"></i>
                {isReply ? 'Post Reply' : 'Post Comment'}
              </Button>
            </div>
          </div>
        </Form>
      </div>
    )
  }

  const handleReply = (commentId: number, username: string) => {
    setReplyTo(commentId)
    setReplyToUsername(username)
    // 不需要滚动，回复表单会显示在评论下方
  }

  const handleCancelReply = () => {
    setReplyTo(null)
    setReplyToUsername('')
    setCommentContent('')
  }

  const toggleReplies = (commentId: number) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }

  // 扁平化所有回复到同一层级
  const flattenReplies = (comment: Comment): { reply: Comment; parentUsername: string }[] => {
    if (!comment.replies || comment.replies.length === 0) return []
    const flattened: { reply: Comment; parentUsername: string }[] = []
    comment.replies.forEach((reply) => {
      flattened.push({ reply, parentUsername: comment.user.username })
      // 递归获取子回复，但保持扁平结构
      const childReplies = flattenReplies(reply)
      flattened.push(...childReplies)
    })
    return flattened
  }

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = commentContent
      const newText = text.substring(0, start) + emoji + text.substring(end)
      setCommentContent(newText)
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length
        textarea.focus()
      }, 0)
    } else {
      setCommentContent(commentContent + emoji)
    }
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

  const formatCommentDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    
    // 计算时间差（毫秒）
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    // 获取时间部分（小时:分钟）
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
    
    // 今天
    if (diffDays === 0) {
      return `Today, ${timeStr}`
    }
    
    // 昨天
    if (diffDays === 1) {
      return `Yesterday, ${timeStr}`
    }
    
    // 近一周内（2-6天前）
    if (diffDays >= 2 && diffDays <= 6) {
      return `${diffDays} days ago`
    }
    
    // 一周以上，显示具体日期
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  // 渲染单个评论（主评论或回复）
  const renderSingleComment = (comment: Comment, parentUsername?: string, hasContext: boolean = false, parentId?: number, showDialogBtn: boolean = true) => {
    const isReply = !!parentUsername

    return (
      <div key={comment.id} className="comment-item" id={`comment-${comment.id}`}>
        <div className="comment-avatar">
          <i className="bi bi-person-circle"></i>
        </div>
        <div className="comment-body">
          <div className="comment-header">
            <div className="comment-author">
              <strong>{comment.user.username}</strong>
              {isReply && parentUsername && (
                <span className="reply-to">
                  {' '}回复 <span className="reply-target">@{parentUsername}</span>
                </span>
              )}
            </div>
            <span className="comment-date">{formatCommentDate(comment.add_date)}</span>
          </div>
          <div className="comment-content">{comment.content}</div>
          <div className="comment-actions">
            {isAuthenticated && (
              <Button
                variant="link"
                size="sm"
                className="reply-btn"
                onClick={() => handleReply(comment.id, comment.user.username)}
              >
                <i className="bi bi-reply me-1"></i>
                回复
              </Button>
            )}
            {hasContext && parentId && showDialogBtn && (
              <span
                className="view-context-btn"
                onClick={() => handleShowDialog(comment.id)}
              >
                查看对话
              </span>
            )}
          </div>
          
          {/* 回复表单 - 显示在当前评论下方 */}
          {isAuthenticated && replyTo === comment.id && (
            <div className="reply-form-container mt-3">
              {renderCommentForm(true, comment.id)}
            </div>
          )}
        </div>
      </div>
    )
  }

  // 渲染主评论及其所有扁平化的回复
  const renderCommentThread = (comment: Comment) => {
    const allReplies = flattenReplies(comment)
    const replyCount = allReplies.length
    const isExpanded = expandedComments.has(comment.id)
    const shouldCollapse = replyCount >= 3 && !isExpanded

    return (
      <div key={comment.id} id={`comment-${comment.id}`} className="comment-thread">
        {/* 主评论 */}
        {renderSingleComment(comment, undefined, false, undefined, true)}

        {/* 回复区域 */}
        {replyCount > 0 && (
          <div className="replies-container">
            {shouldCollapse ? (
              <div className="replies-toggle" onClick={() => toggleReplies(comment.id)}>
                <i className="bi bi-chevron-down me-1"></i>
                共 {replyCount} 条回复
                <i className="bi bi-chevron-right ms-1"></i>
              </div>
            ) : (
              <>
                {replyCount >= 3 && (
                  <div className="replies-toggle expanded" onClick={() => toggleReplies(comment.id)}>
                    <i className="bi bi-chevron-up me-1"></i>
                    收起回复
                  </div>
                )}
                <div className="flat-replies">
                  {allReplies.map(({ reply, parentUsername }) => {
                    // 检查是否需要显示"查看对话"
                    // 只要这条回复有父评论，就显示"查看对话"（用于查看完整对话链）
                    const hasContext = !!reply.parent
                    return renderSingleComment(reply, parentUsername, hasContext, reply.parent ?? undefined, true)
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    )
  }



  // 查找父评论用户名
  function findParentUsername(parentId: number): string {
    function dfs(list: Comment[]): string | null {
      for (const c of list) {
        if (c.id === parentId) return c.user.username
        if (c.replies && c.replies.length > 0) {
          const res = dfs(c.replies)
          if (res) return res
        }
      }
      return null
    }
    return dfs(comments) || ''
  }

  return (
    <div className="blog-detail-page">
      {/* 对话弹窗 */}
      <DialogModal
        show={showDialogModal}
        onHide={handleCloseDialog}
        dialogComments={dialogComments}
        dialogActiveId={dialogActiveId}
        findParentUsername={findParentUsername}
        formatCommentDate={formatCommentDate}
      />
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
                {/* Comment Form - 只在非回复模式显示 */}
                {isAuthenticated ? (
                  <div className="mb-4">
                    {renderCommentForm(false)}
                  </div>
                ) : (
                  <div className="mb-4">
                    <Alert variant="info">
                      Please <Link to="/login">log in</Link> to leave a comment.
                    </Alert>
                  </div>
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
                    {comments.map((comment) => renderCommentThread(comment))}
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
