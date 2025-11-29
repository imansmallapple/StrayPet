// src/views/donation/index.tsx
import {
  useState,
  useMemo,
  useEffect,
  useRef,
  type FormEvent,
  type DragEvent,
} from 'react'
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Badge,
} from 'react-bootstrap'

import '@opentiny/fluent-editor/style.css'
import FluentEditor from '@opentiny/fluent-editor'

import './index.scss'
import { donationApi, buildDonationFormData } from '@/services/modules/donation'

type AgeOption = 'baby' | 'very_young' | 'young' | 'adult' | 'senior'
type SizeOption = 'small' | 'medium' | 'large'
type ActivityOption = 'couch' | 'normal' | 'active'
type SexOption = 'he' | 'she' | 'unknown'

interface TraitDef {
  key: string
  label: string
}

const TRAITS: TraitDef[] = [
  { key: 'sterilized', label: 'sterilization/castration' },
  { key: 'vaccinated', label: 'vaccination' },
  { key: 'dewormed', label: 'dewormed' },
  { key: 'microchipped', label: 'microchipped' },
  { key: 'child_friendly', label: 'Child-friendly' },
  { key: 'trained', label: 'Trained' },
  { key: 'loves_play', label: 'loves to play' },
  { key: 'loves_walks', label: 'loves walks' },
  { key: 'accepts_dogs', label: 'accepts dogs' },
  { key: 'accepts_cats', label: 'accepts cats' },
  { key: 'loves_cares', label: 'loves caresses' },
  { key: 'hates_shelter', label: 'he tolerates staying in the shelter very badly' },
]

interface FormState {
  city: string
  name: string
  /** 富文本 HTML 字符串 */
  description: string
  sex: SexOption
  age: AgeOption
  size: SizeOption
  activity: ActivityOption
  breed: string
  traits: Record<string, boolean>
}

export default function DonationCreate() {
  const [form, setForm] = useState<FormState>({
    city: '',
    name: '',
    description: '',
    sex: 'he',
    age: 'very_young',
    size: 'small',
    activity: 'couch',
    breed: 'Hybrid',
    traits: {},
  })

  const [species, setSpecies] = useState('dog')
  const [addressData, setAddressData] = useState({ country: '', region: '', city: '', street: '', postal_code: '' })
  const [contactPhone, setContactPhone] = useState('')

  const [photos, setPhotos] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // FluentEditor 实例 refs
  const editorContainerRef = useRef<HTMLDivElement | null>(null)
  const fluentRef = useRef<any | null>(null)

  // 初始化 FluentEditor（只跑一次）
  useEffect(() => {
    if (!editorContainerRef.current) return

    const instance = new (FluentEditor as any)(editorContainerRef.current, {
      theme: 'snow',
      modules: {
        // 不启用 syntax，避免要求 highlight.js
        file: true,
        'emoji-toolbar': true,
      },
    })

    fluentRef.current = instance

    // 初始内容
    if (form.description) {
      if (instance.clipboard?.dangerouslyPasteHTML) {
        instance.clipboard.dangerouslyPasteHTML(form.description)
      } else if (instance.root) {
        instance.root.innerHTML = form.description
      }
    }

    // 内容变化 -> 同步到 form.description
    const handler = () => {
      const root: HTMLElement | null = instance.root ?? null
      const html = root?.innerHTML ?? ''
      setForm(prev => ({ ...prev, description: html }))
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

  // 当外部把 description 重置时，同步到编辑器
  useEffect(() => {
    const instance = fluentRef.current
    if (!instance) return

    const root: HTMLElement | null = instance.root ?? null
    const current = root?.innerHTML ?? ''
    if (current !== form.description) {
      if (instance.clipboard?.dangerouslyPasteHTML) {
        instance.clipboard.dangerouslyPasteHTML(form.description || '')
      } else if (root) {
        root.innerHTML = form.description || ''
      }
    }
  }, [form.description])

  // ---------- 照片预览 ----------
  const photoPreviews = useMemo(
    () => photos.map(f => URL.createObjectURL(f)),
    [photos],
  )

  useEffect(() => {
    return () => {
      photoPreviews.forEach(url => URL.revokeObjectURL(url))
    }
  }, [photoPreviews])

  const handleChange = (
    field: keyof FormState,
    value: string | SexOption | AgeOption | SizeOption | ActivityOption,
  ) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddressChange = (field: keyof typeof addressData, value: string) => {
    setAddressData(prev => ({ ...prev, [field]: value }))
  }

  const handleTraitChange = (key: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      traits: {
        ...prev.traits,
        [key]: checked,
      },
    }))
  }

  const handlePhotoSelect = (files: FileList | null) => {
    if (!files || !files.length) return
    setPhotos(prev => [...prev, ...Array.from(files)])
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const files = e.dataTransfer.files
    handlePhotoSelect(files)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!addressData.city.trim()) {
      setError('Please fill in the city where the pet is located.')
      return
    }
    if (!form.name.trim()) {
      setError('Please fill in the pet name.')
      return
    }
    if (!photos.length) {
      setError('Please add at least one photo.')
      return
    }

    setSubmitting(true)
    try {
      // 将前端表单字段映射为后端期望的字段（最小实现）
      // species & address data from UI
      // choices: dog/cat/other
      const sex_map: Record<SexOption, 'male' | 'female' | 'unknown'> = { he: 'male', she: 'female', unknown: 'unknown' }
      const age_map: Record<string, { y: number; m: number }> = {
        baby: { y: 0, m: 3 },
        very_young: { y: 0, m: 6 },
        young: { y: 1, m: 0 },
        adult: { y: 3, m: 0 },
        senior: { y: 7, m: 0 },
      }

      const mappedAge = age_map[form.age]
      const addressObj: any = {}
      if (addressData.country) addressObj.country = addressData.country
      if (addressData.region) addressObj.region = addressData.region
      if (addressData.city) addressObj.city = addressData.city
      if (addressData.street) addressObj.street = addressData.street
      if (addressData.postal_code) addressObj.postal_code = addressData.postal_code

      const payload = {
        name: form.name,
        species: species || 'dog',
        breed: form.breed,
        sex: sex_map[form.sex] ?? 'male',
        age_years: mappedAge?.y ?? 0,
        age_months: mappedAge?.m ?? 0,
        description: form.description,
        address_data: Object.keys(addressObj).length ? addressObj : undefined,
        // address: undefined, // TODO: 支持创建/选择地址（当前仅用于演示）
        dewormed: !!form.traits['dewormed'],
        vaccinated: !!form.traits['vaccinated'],
        microchipped: !!form.traits['microchipped'],
        is_stray: !!form.traits['loves_cares'], // example mapping: adjust as UI requires
        contact_phone: contactPhone,
        photos,
      }

      console.warn('[donation] payload', payload)
      const fd = buildDonationFormData(payload)

      // 调用后端
      const res = await donationApi.create(fd)
      console.warn('[donation] backend result', res)

      setSuccess('Your pet has been submitted for adoption review.')

      setForm(prev => ({
        ...prev,
        name: '',
        description: '',
      }))
      setPhotos([])
      // reset simple fields
      setSpecies('dog')
      setAddressData({ country: '', region: '', city: '', street: '', postal_code: '' })
      setContactPhone('')
    } catch (err) {
      console.error(err)
      // 显示更具体的后端错误信息（axios）
      const errRes = (err as any)?.response?.data
      let msg = (err as any)?.message || 'Something went wrong while submitting the pet.'
      if (errRes) {
        if (typeof errRes === 'string') {
          msg = errRes
        } else if (errRes.detail) {
          msg = errRes.detail
        } else if (typeof errRes === 'object') {
          // Join field errors
          const parts: string[] = []
          for (const k of Object.keys(errRes)) {
            const val = errRes[k]
            if (Array.isArray(val)) {
              parts.push(`${k}: ${val.join('; ')}`)
            } else if (typeof val === 'string') {
              parts.push(`${k}: ${val}`)
            }
          }
          if (parts.length) msg = parts.join(' | ')
        }
      }
      setError(String(msg))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="donation-page">
      <Container>
        <h1 className="donation-title">Create an adoption listing</h1>

        <Form onSubmit={handleSubmit} noValidate>
          {error && (
            <Alert variant="warning" className="mb-3">
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" className="mb-3">
              {success}
            </Alert>
          )}

          {/* 主信息卡片 */}
          <Card className="donation-section mb-4">
            <Card.Header className="donation-section-header">
              <span className="icon">−</span>
              <span className="text">Main information</span>
            </Card.Header>
            <Card.Body>
              <Row className="g-4">
                {/* 左侧：城市 + 描述 */}
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="city">
                    <Form.Label>
                      City <span className="muted">(in which city is the pet located?)</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Warszawa"
                      value={form.city}
                      onChange={e => handleChange('city', e.target.value)}
                    />
                  </Form.Group>

                  <Alert variant="warning" className="donation-hint">
                    Please do not include phone numbers in advertisements. The phone number will be
                    visible next to the pet.
                  </Alert>

                  <Form.Group className="mt-3" controlId="description">
                    <Form.Label>Pet description</Form.Label>
                    <div className="donation-editor-wrapper">
                      {/* FluentEditor 挂载点 */}
                      <div ref={editorContainerRef} />
                    </div>
                  </Form.Group>
                </Col>

                {/* 右侧：名字 + 各种 select + traits */}
                <Col md={6}>
                  <Row className="g-3">
                    <Col xs={12}>
                      <Form.Group controlId="name">
                        <Form.Label>Pet name</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="How is the pet called?"
                          value={form.name}
                          onChange={e => handleChange('name', e.target.value)}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group controlId="sex">
                        <Form.Label>Sex</Form.Label>
                        <Form.Select
                          value={form.sex}
                          onChange={e => handleChange('sex', e.target.value as SexOption)}
                        >
                          <option value="he">He</option>
                          <option value="she">She</option>
                          <option value="unknown">Unknown</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group controlId="age">
                        <Form.Label>Age</Form.Label>
                        <Form.Select
                          value={form.age}
                          onChange={e => handleChange('age', e.target.value as AgeOption)}
                        >
                          <option value="baby">Baby</option>
                          <option value="very_young">Very young</option>
                          <option value="young">Young</option>
                          <option value="adult">Adult</option>
                          <option value="senior">Senior</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group controlId="size">
                        <Form.Label>Size</Form.Label>
                        <Form.Select
                          value={form.size}
                          onChange={e => handleChange('size', e.target.value as SizeOption)}
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group controlId="activity">
                        <Form.Label>Activity</Form.Label>
                        <Form.Select
                          value={form.activity}
                          onChange={e => handleChange('activity', e.target.value as ActivityOption)}
                        >
                          <option value="couch">Couch Potatoes</option>
                          <option value="normal">Normal</option>
                          <option value="active">Very active</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col xs={12} className="mt-3">
                      <Form.Group controlId="species">
                        <Form.Label>Species</Form.Label>
                        <Form.Select value={species} onChange={(e) => setSpecies(e.target.value)}>
                          <option value="dog">Dog</option>
                          <option value="cat">Cat</option>
                          <option value="other">Other</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col xs={12}>
                      <Form.Group controlId="breed">
                        <Form.Label>Race or in the form of a race</Form.Label>
                        <Form.Control
                          type="text"
                          value={form.breed}
                          onChange={e => handleChange('breed', e.target.value)}
                          placeholder="Hybrid, German Shepherd, ..."
                          />
                        </Form.Group>
                      </Col>
                    <Col xs={12} className="mt-3">
                      <Form.Group controlId="contactPhone">
                        <Form.Label>Contact phone</Form.Label>
                        <Form.Control
                          type="text"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="Phone number for the listing"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} className="mt-3">
                      <Form.Label>Address</Form.Label>
                      <Row className="g-2">
                        <Col xs={12} sm={6}>
                          <Form.Control type="text" placeholder="Country" value={addressData.country} onChange={(e) => handleAddressChange('country', e.target.value)} />
                        </Col>
                        <Col xs={12} sm={6}>
                          <Form.Control type="text" placeholder="Region" value={addressData.region} onChange={(e) => handleAddressChange('region', e.target.value)} />
                        </Col>
                        <Col xs={12} sm={6} className="mt-2">
                          <Form.Control type="text" placeholder="City" value={addressData.city} onChange={(e) => handleAddressChange('city', e.target.value)} />
                        </Col>
                        <Col xs={12} sm={6} className="mt-2">
                          <Form.Control type="text" placeholder="Postal code" value={addressData.postal_code} onChange={(e) => handleAddressChange('postal_code', e.target.value)} />
                        </Col>
                        <Col xs={12} className="mt-2">
                          <Form.Control type="text" placeholder="Street and building" value={addressData.street} onChange={(e) => handleAddressChange('street', e.target.value)} />
                        </Col>
                      </Row>
                    </Col>
                  </Row>

                  <hr className="donation-traits-sep" />

                  <div className="donation-traits-grid">
                    {TRAITS.map(t => (
                      <Form.Check
                        key={t.key}
                        type="checkbox"
                        id={`trait-${t.key}`}
                        label={t.label}
                        className="donation-trait-item"
                        checked={!!form.traits[t.key]}
                        onChange={e => handleTraitChange(t.key, e.target.checked)}
                      />
                    ))}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* 照片上传区域 */}
          <Card className="donation-section">
            <Card.Header className="donation-section-header">
              <span className="icon">−</span>
              <span className="text">Photos</span>
            </Card.Header>
            <Card.Body>
              <div
                className="donation-photo-dropzone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => {
                  const input = document.getElementById('pet-photos-input') as HTMLInputElement | null
                  input?.click()
                }}
              >
                <input
                  id="pet-photos-input"
                  type="file"
                  accept="image/*"
                  multiple
                  className="d-none"
                  onChange={e => handlePhotoSelect(e.target.files)}
                />
                <div className="icon-wrapper">📷</div>
                <div className="title">Click to add a photo</div>
                <div className="subtitle">
                  You must add at least one photo.
                  <br />
                  The first photo will be the pet&apos;s profile picture.
                </div>
                <div className="hint">
                  Minimum image size is:{' '}
                  <Badge bg="light" text="secondary">
                    700x350
                  </Badge>
                </div>
              </div>

              {photoPreviews.length > 0 && (
                <div className="donation-photo-preview-grid mt-3">
                  {photoPreviews.map((url, idx) => (
                    <div className="photo-preview-item" key={url}>
                      <img src={url} alt={`preview-${idx}`} />
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-end mt-4">
            <Button
              type="submit"
              variant="success"
              size="lg"
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit pet for adoption'}
            </Button>
          </div>
        </Form>
      </Container>
    </div>
  )
}
