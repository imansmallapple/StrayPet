
// DialogModal 组件和类型定义在最顶部，避免嵌套定义警告
import { useState, useRef, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useRequest } from 'ahooks'
import { blogApi, type Comment } from '@/services/modules/blog'
import { useAuth } from '@/hooks/useAuth'
import SafeHtml from '@/components/SafeHtml'
import EmojiPicker from '@/components/EmojiPicker'
import PageHeroTitle from '@/components/page-hero-title'
import './index.scss'

type DialogModalProps = {
  show: boolean
  onHide: () => void
  dialogComments: Comment[]
  dialogActiveId: number | null
  findParentUsername: (parentId: number) => string
  formatCommentDate: (dateStr: string) => string
}
const DialogModal = ({ show, onHide, dialogComments, dialogActiveId, findParentUsername, formatCommentDate }: DialogModalProps) => {
  if (!show) return null
  return (
    <div className="dialog-modal-overlay" onClick={onHide}>
      <div className="dialog-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-modal-header">
          <h3>对话列表</h3>
          <button className="dialog-modal-close" onClick={onHide} type="button">
            <i className="bi bi-x"></i>
          </button>
        </div>
        <div className="dialog-modal-body">
      {dialogComments.length === 0 ? (
        <div className="text-center text-muted">暂无对话</div>
      ) : (
        <div>
          {dialogComments.map((c, index) => (
            <div
              key={c.id}
              id={`dialog-comment-${c.id}`}
              className={`dialog-comment ${c.id === dialogActiveId ? 'active' : ''}`}
            >
              <div className="dialog-comment-header">
                <div className="dialog-comment-avatar">
                  {c.user.avatar ? (
                    <img 
                      src={c.user.avatar} 
                      alt={c.user.username}
                    />
                  ) : (
                    c.user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="dialog-comment-info">
                  <div className="dialog-comment-username">
                    {c.user.username}
                    {c.parent && index > 0 && (
                      <span className="dialog-comment-reply">
                        reply <span className="dialog-reply-target">@{findParentUsername(c.parent)}</span>
                      </span>
                    )}
                  </div>
                  <div className="dialog-comment-date">{formatCommentDate(c.add_date)}</div>
                </div>
              </div>
              <div className="dialog-comment-body">{c.content}</div>
            </div>
          ))}
        </div>
      )}
        </div>
      </div>
    </div>
  )
}

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAuthenticated = !!user
  const [commentContent, setCommentContent] = useState('')
  const [replyTo, setReplyTo] = useState<number | null>(null)
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
    // 找到评论对象本身
    function findComment(list: Comment[], targetId: number): Comment | null {
      for (const c of list) {
        if (c.id === targetId) return c
        if (c.replies && c.replies.length > 0) {
          const found = findComment(c.replies, targetId)
          if (found) return found
        }
      }
      return null
    }

    // 沿着 parent 链往上走，但停止在对主评论的直接回复
    function findChainRoot(comment: Comment): Comment {
      if (!comment.parent) {
        // 这是主评论本身，不应该返回
        return comment
      }
      const parentComment = findComment(comments, comment.parent)
      if (!parentComment) {
        return comment
      }
      
      // 如果父评论没有parent，说明父评论是主评论，当前评论就是链的起点
      if (!parentComment.parent) {
        return comment
      }
      
      // 否则继续往上
      return findChainRoot(parentComment)
    }

    // 从根开始，递归收集所有后代直到目标
    function collectToTarget(comment: Comment, targetId: number, result: Comment[]): boolean {
      result.push(comment)
      
      if (comment.id === targetId) {
        return true
      }

      if (comment.replies && comment.replies.length > 0) {
        for (const reply of comment.replies) {
          if (collectToTarget(reply, targetId, result)) {
            return true
          }
        }
      }

      result.pop()
      return false
    }

    const targetComment = findComment(comments, commentId)
    if (!targetComment) return []

    // 找到对话链的起点
    const rootComment = findChainRoot(targetComment)

    // 从起点收集到目标的对话链
    const result: Comment[] = []
    collectToTarget(rootComment, commentId, result)

    return result
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
  const { data: articleData, loading: articleLoading } = useRequest(
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
  const comments = useMemo(() => commentsData?.data.results || [], [commentsData])

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

  // 处理锚点跳转到指定评论
  useEffect(() => {
    if (!commentsLoading && comments.length > 0) {
      const hash = window.location.hash
      if (hash.startsWith('#comment-')) {
        const commentId = hash.replace('#comment-', '')
        const timer = setTimeout(() => {
          const element = document.getElementById(`comment-${commentId}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 300)
        return () => clearTimeout(timer)
      }
    }
    return undefined
  }, [commentsLoading, comments])

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
        {submitError && (
          <div className="alert alert-danger" role="alert">
            {submitError}
            <button 
              type="button" 
              className="alert-close"
              onClick={() => setSubmitError(null)}
            >
              <i className="bi bi-x"></i>
            </button>
          </div>
        )}
        <form onSubmit={handleSubmitComment}>
          <div className="form-group">
            <textarea
              ref={textareaRef}
              rows={isReply ? 3 : 4}
              placeholder="Write your comment... You can use emojis! 😊"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              required
              className="comment-textarea"
              autoFocus={isReply}
            ></textarea>
          </div>
          <div className="form-footer">
            <div className="emoji-section">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              <span className="emoji-hint">
                Click to add emoji
              </span>
            </div>
            <div className="button-group">
              {isReply && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancelReply}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Cancel
                </button>
              )}
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                <i className="bi bi-send me-2"></i>
                {isReply ? 'Post Reply' : 'Post Comment'}
              </button>
            </div>
          </div>
        </form>
      </div>
    )
  }

  const handleReply = (commentId: number, _username: string) => {
    setReplyTo(commentId)
    // 不需要滚动，回复表单会显示在评论下方
  }

  const handleCancelReply = () => {
    setReplyTo(null)
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
      // 只更新is_favorited状态，不刷新整个文章
      if (articleData) {
        articleData.data.is_favorited = !articleData.data.is_favorited
      }
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
      <div className="error-container">
        <p>Invalid article ID</p>
      </div>
    )
  }

  if (articleLoading || !article) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
      </div>
    )
  }

  // 渲染单个评论（主评论或回复）
  const renderSingleComment = (comment: Comment, parentUsername?: string, hasContext: boolean = false, parentId?: number, showDialogBtn: boolean = true) => {
    const isReply = !!parentUsername

    return (
      <div key={comment.id} className="comment-item" id={`comment-${comment.id}`}>
        <div 
          className="comment-avatar"
          onClick={() => navigate(`/user/profile/${comment.user.id}`)}
          style={{ cursor: 'pointer' }}
          title="Click to view user profile"
        >
          {comment.user.avatar ? (
            <img 
              src={comment.user.avatar} 
              alt={comment.user.username}
              style={{ 
                width: '100%', 
                height: '100%', 
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: '#667eea',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '18px'
            }}>
              {comment.user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="comment-body">
          <div className="comment-header">
            <div className="comment-author-line">
              <strong 
                onClick={() => navigate(`/user/profile/${comment.user.id}`)}
                style={{ cursor: 'pointer', color: '#667eea' }}
                title="Click to view user profile"
              >
                {comment.user.username}
              </strong>
              {isReply && parentUsername && (
                <span className="reply-to">
                  {' '}reply <span className="reply-target">@{parentUsername}</span>
                </span>
              )}
            </div>
            <div className="comment-meta-line">
              <span className="comment-date">{formatCommentDate(comment.add_date)}</span>
              {isAuthenticated && (
                <span
                  className="reply-btn"
                  onClick={() => handleReply(comment.id, comment.user.username)}
                >
                  Reply
                </span>
              )}
            </div>
          </div>
          <div className="comment-content">{comment.content}</div>
          <div className="comment-actions">
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
    // 如果回复数 > 2，默认只显示前2条，需要展开
    const shouldCollapse = replyCount > 2 && !isExpanded
    const visibleReplies = shouldCollapse ? allReplies.slice(0, 2) : allReplies

    return (
      <div key={comment.id} id={`comment-${comment.id}`} className="comment-thread">
        {/* 主评论 */}
        {renderSingleComment(comment, undefined, false, undefined, true)}

        {/* 回复区域 */}
        {replyCount > 0 && (
          <div className="replies-container">
            <div className="flat-replies">
              {visibleReplies.map(({ reply, parentUsername }) => {
                // 如果回复是直接回复主评论（parentUsername === 主评论作者），则不显示回复信息和查看对话
                const shouldShowReply = parentUsername !== comment.user.username
                // 检查是否需要显示"查看对话" - 只有当回复链不是直接回复主评论时才显示
                const hasContext = !!reply.parent && shouldShowReply
                return renderSingleComment(reply, shouldShowReply ? parentUsername : undefined, hasContext, reply.parent ?? undefined, true)
              })}
            </div>
            {shouldCollapse && (
              <div className="replies-toggle" onClick={() => toggleReplies(comment.id)}>
                <i className="bi bi-chevron-down me-1"></i>
                {replyCount} repl{replyCount > 1 ? 'ies' : 'y'}
                <i className="bi bi-chevron-right ms-1"></i>
              </div>
            )}
            {isExpanded && replyCount > 2 && (
              <div className="replies-toggle expanded" onClick={() => toggleReplies(comment.id)}>
                <i className="bi bi-chevron-up me-1"></i>
                Collapse Replies
              </div>
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
      <div className="blog-detail-header">
        <button 
          className="back-button"
          onClick={() => navigate('/blog')}
          type="button"
        >
          Back
        </button>
        <PageHeroTitle title={article.title} />
      </div>

      <div className="blog-detail-container">
        <div className="blog-detail-main">
          <article className="article-content-card">
            <button 
              className={`favorite-btn ${article.is_favorited ? 'favorited' : ''}`}
              onClick={handleToggleFavorite}
              disabled={favoriting}
              type="button"
            >
              <i className={`bi bi-${article.is_favorited ? 'bookmark-fill' : 'bookmark'}`}></i>
              {article.is_favorited ? 'Saved' : 'Save'}
            </button>
            <SafeHtml html={article.content} />
          </article>

          {/* Article Meta and Tags */}
          <div className="article-meta-section">
            {article.author && (
              <div className="author-info-card">
                <div className="author-avatar">
                  {article.author.avatar ? (
                    <img 
                      src={article.author.avatar} 
                      alt={article.author.username}
                    />
                  ) : (
                    <span>{article.author.username.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="author-details">
                  <button 
                    className="author-link"
                    onClick={() => navigate(`/user/profile/${article.author?.id}`)}
                    type="button"
                  >
                    {article.author.username}
                  </button>
                </div>
              </div>
            )}
            
            <div className="article-stats">
              <span className="stat-item">
                <i className="bi bi-calendar3"></i>
                {formatDate(article.add_date)}
              </span>
              <span className="stat-item">
                <i className="bi bi-eye"></i>
                {article.count || 0} views
              </span>
            </div>

            <div className="article-tags">
              {article.tags.map((tag) => (
                <span key={tag} className="tag-badge">{tag}</span>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <section className="comments-section">
            <h3 className="comments-title">
              <i className="bi bi-chat-dots"></i>
              Comments ({comments.length})
            </h3>

            {/* Loading State */}
            {commentsLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
              </div>
            ) : comments.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-chat"></i>
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : null}

            {/* Comment Form - 只在非回复模式显示 */}
            {isAuthenticated ? (
              <div className="comment-form-wrapper">
                {renderCommentForm(false)}
              </div>
            ) : (
              <div className="login-prompt">
                <p>Please <Link to="/login">log in</Link> to leave a comment.</p>
              </div>
            )}

            {/* Comments List */}
            {!commentsLoading && comments.length > 0 && (
              <div className="comments-list">
                {comments.map((comment) => renderCommentThread(comment))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        {article.toc && (
          <aside className="blog-detail-sidebar">
            <div className="toc-card">
              <h4 className="toc-title">
                <i className="bi bi-list-ul"></i>
                Table of Contents
              </h4>
              <div className="toc-content">
                <SafeHtml html={article.toc} />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
