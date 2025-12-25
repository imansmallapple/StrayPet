// src/views/blog/create/index.tsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRequest } from 'ahooks'
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap'
import { blogApi } from '@/services/modules/blog'
import { useAuth } from '@/hooks/useAuth'
import '@opentiny/fluent-editor/style.css'
import FluentEditor from '@opentiny/fluent-editor'
import './index.scss'

export default function CreateEditArticle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // FluentEditor 实例 refs
  const editorContainerRef = useRef<HTMLDivElement | null>(null)
  const fluentRef = useRef<any | null>(null)

  // 加载分类
  const { data: categoriesData } = useRequest(() => blogApi.listCategories())

  const categories = categoriesData?.data || []

  // 检查是否登录
  useEffect(() => {
    if (!user) {
      navigate('/auth/login')
    }
  }, [user, navigate])

  // 初始化 FluentEditor（只跑一次）
  useEffect(() => {
    if (!editorContainerRef.current) return

    const instance = new (FluentEditor as any)(editorContainerRef.current, {
      theme: 'snow',
      modules: {
        file: {
          upload: async (file: File) => {
            try {
              const response = await blogApi.uploadImage(file)
              return response.data.url
            } catch (error) {
              console.error('Image upload failed:', error)
              setError('Image upload failed. Please try again.')
              throw error
            }
          },
        },
        'emoji-toolbar': true,
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote', 'code-block'],
          [{ header: 1 }, { header: 2 }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }],
          [{ size: ['small', false, 'large', 'huge'] }],
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          ['link', 'image', 'video'],
          ['emoji'],
          ['clean'],
        ],
      },
      placeholder: 'Write your article content here...',
    })

    fluentRef.current = instance

    // 初始内容
    if (formData.content) {
      if (instance.clipboard?.dangerouslyPasteHTML) {
        instance.clipboard.dangerouslyPasteHTML(formData.content)
      } else if (instance.root) {
        instance.root.innerHTML = formData.content
      }
    }

    // 内容变化 -> 同步到 form.content
    const handler = () => {
      const root: HTMLElement | null = instance.root ?? null
      const html = root?.innerHTML ?? ''
      setFormData(prev => ({ ...prev, content: html }))
    }

    if (instance.on) {
      instance.on('text-change', handler)
    }

    return () => {
      if (instance.off) {
        instance.off('text-change', handler)
      }
      fluentRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Please fill in title and content')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const payload: {
        title: string
        description?: string
        content: string
        category?: number
      } = {
        title: formData.title.trim(),
        content: formData.content.trim(),
      }

      if (formData.description.trim()) {
        payload.description = formData.description.trim()
      }

      if (formData.category) {
        payload.category = Number(formData.category)
      }

      if (isEdit) {
        await blogApi.updateArticle(Number(id), payload)
      } else {
        await blogApi.createArticle(payload)
      }

      navigate('/blog')
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to ${isEdit ? 'update' : 'create'} article`)
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="create-article-page">
      <div className="page-header">
        <Container>
          <h1>{isEdit ? 'Edit Article' : 'Create New Article'}</h1>
          <p>Share your pet care knowledge with the community</p>
        </Container>
      </div>

      <Container className="mt-4 mb-5">
        <Card>
          <Card.Body>
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              {/* Hashtag Usage Info */}
              <Alert variant="info" className="mb-4">
                <div className="d-flex align-items-start">
                  <i className="bi bi-info-circle me-2 fs-5"></i>
                  <div>
                    <Alert.Heading className="h6 mb-2">💡 How to Use Hashtags</Alert.Heading>
                    <p className="mb-2 small">
                      Add hashtags in your content to automatically create and tag topics. Simply type <code>#</code> followed by your tag name.
                    </p>
                    <p className="mb-0 small">
                      <strong>Examples:</strong> <code>#猫咪护理</code> <code>#PetTraining</code> <code>#领养指南</code>
                    </p>
                  </div>
                </div>
              </Alert>

              <Form.Group className="mb-3">
                <Form.Label>Title <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter article title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Brief description of your article"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
                <Form.Text className="text-muted">
                  If not provided, it will be auto-generated from the content
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Content <span className="text-danger">*</span></Form.Label>
                <div className="blog-rich-editor">
                  <div className="blog-editor-wrapper" ref={editorContainerRef} />
                </div>
                <Form.Text className="text-muted">
                  Use the rich text editor to format your content. 
                  You can add <strong>images</strong> 📷, <strong>emojis</strong> 😊, and <strong>rich formatting</strong>.
                  {' '}<strong>Tip: Use #hashtag in your content to automatically create and tag topics!</strong>
                  {' '}For example: #猫咪护理 #宠物训练
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Category (Optional)</Form.Label>
                <Form.Select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  <option value="">Select a category (or leave blank for '未分类')</option>
                  {Array.isArray(categories) && categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  If not selected, the article will be categorized as '未分类'
                </Form.Text>
              </Form.Group>

              <div className="d-flex gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      {isEdit ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <i className={`bi bi-${isEdit ? 'pencil' : 'plus-circle'} me-2`}></i>
                      {isEdit ? 'Update Article' : 'Create Article'}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={() => navigate('/blog')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  )
}
