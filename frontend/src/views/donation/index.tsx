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
import ListGroup from 'react-bootstrap/ListGroup'
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

// 地址结构，新增 country_code 只用于 Mapbox 过滤
interface AddressData {
  country: string
  region: string
  city: string
  street: string
  postal_code: string
  latitude?: number
  longitude?: number
  country_code?: string
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

  const [activeField, setActiveField] = useState<'country' | 'region' | 'city' | null>(null)
  const [species, setSpecies] = useState('dog')
  const [addressData, setAddressData] = useState<AddressData>({
    country: '',
    region: '',
    city: '',
    street: '',
    postal_code: '',
  })

  // per-field search & suggestion states so the suggestion list anchors to the correct input
  const [countrySearch, setCountrySearch] = useState('')
  const [regionSearch, setRegionSearch] = useState('')
  const [citySearch, setCitySearch] = useState('')

  const [countrySuggestions, setCountrySuggestions] = useState<any[]>([])
  const [regionSuggestions, setRegionSuggestions] = useState<any[]>([])
  const [citySuggestions, setCitySuggestions] = useState<any[]>([])

  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false)
  const [showRegionSuggestions, setShowRegionSuggestions] = useState(false)
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)

  const [countryActiveIndex, setCountryActiveIndex] = useState(-1)
  const [regionActiveIndex, setRegionActiveIndex] = useState(-1)
  const [cityActiveIndex, setCityActiveIndex] = useState(-1)

  const countrySuggestionsWrapper = useRef<HTMLDivElement | null>(null)
  const regionSuggestionsWrapper = useRef<HTMLDivElement | null>(null)
  const citySuggestionsWrapper = useRef<HTMLDivElement | null>(null)
  const countryInputRef = useRef<HTMLInputElement | null>(null)
  const regionInputRef = useRef<HTMLInputElement | null>(null)
  const cityInputRef = useRef<HTMLInputElement | null>(null)
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

  type AddressTextField = 'country' | 'region' | 'city' | 'street' | 'postal_code'
  const handleAddressChange = (field: AddressTextField, value: string) => {
    setAddressData(prev => ({ ...prev, [field]: value }))
  }

  // Mapbox autocomplete: separate search hooks for Country, Region, City
  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!token) return

    const handle = setTimeout(async () => {
      if (!countrySearch || countrySearch.length < 1) {
        setCountrySuggestions([])
        setShowCountrySuggestions(false)
        return
      }

      try {
        const q = encodeURIComponent(countrySearch)
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${token}&types=country&autocomplete=true&limit=6`
        const r = await fetch(url)
        const j = await r.json()
        const feats: any[] = j.features ?? []
        setCountrySuggestions(feats)
        setShowCountrySuggestions(feats.length > 0)
        setCountryActiveIndex(-1)
      } catch (_err) {
        setCountrySuggestions([])
        setShowCountrySuggestions(false)
      }
    }, 200)

    return () => clearTimeout(handle)
  }, [countrySearch])

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!token) return

    const handle = setTimeout(async () => {
      if (!regionSearch || regionSearch.length < 1) {
        setRegionSuggestions([])
        setShowRegionSuggestions(false)
        return
      }

      try {
        const countryParam = addressData.country_code
          ? `&country=${encodeURIComponent(addressData.country_code)}`
          : ''
        const q = encodeURIComponent(regionSearch)
        const url =
          `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
          `${q}.json?access_token=${token}` +
          `&types=region&autocomplete=true&limit=6${countryParam}`

        const r = await fetch(url)
        const j = await r.json()
        let feats: any[] = j.features ?? []

        // 如果用户在 Country 里填了名字（例如 "Poland"），
        // 即使没有 country_code，也用名字再本地过滤一下。
        if (addressData.country) {
          const wanted = addressData.country.trim().toLowerCase()
          feats = feats.filter(f => {
            const ctx = f.context ?? []
            const c = ctx.find(
              (x: any) => (x.id || '').startsWith('country.')
            )
            const name = (c?.text || '').trim().toLowerCase()
            const sc = (c?.short_code || '').trim().toLowerCase()
            return (name && name === wanted) || (sc && sc === wanted)
          })
        }

        setRegionSuggestions(feats)
        setShowRegionSuggestions(feats.length > 0)
        setRegionActiveIndex(-1)
      } catch (_err) {
        setRegionSuggestions([])
        setShowRegionSuggestions(false)
      }
    }, 200)

    return () => clearTimeout(handle)
  }, [regionSearch, addressData.country_code, addressData.country])


  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!token) return

    const handle = setTimeout(async () => {
      if (!citySearch || citySearch.length < 1) {
        setCitySuggestions([])
        setShowCitySuggestions(false)
        return
      }

      try {
        const countryParam = addressData.country_code
          ? `&country=${encodeURIComponent(addressData.country_code)}`
          : ''
        const q = encodeURIComponent(citySearch)
        const url =
          `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
          `${q}.json?access_token=${token}` +
          `&types=place,locality&autocomplete=true&limit=6${countryParam}`

        const r = await fetch(url)
        const j = await r.json()
        let feats: any[] = j.features ?? []

        // 先按 Country 名字过滤（如果有）
        if (addressData.country) {
          const wantedCountry = addressData.country.trim().toLowerCase()
          feats = feats.filter(f => {
            const ctx = f.context ?? []
            const c = ctx.find(
              (x: any) => (x.id || '').startsWith('country.')
            )
            const name = (c?.text || '').trim().toLowerCase()
            const sc = (c?.short_code || '').trim().toLowerCase()
            return (name && name === wantedCountry) || (sc && sc === wantedCountry)
          })
        }

        // 再按 Region 名字过滤（如果有）
        if (addressData.region) {
          const wantedRegion = addressData.region.trim().toLowerCase()
          feats = feats.filter(f => {
            const ctx = f.context ?? []
            const reg = ctx.find(
              (x: any) => (x.id || '').startsWith('region.')
            )?.text
            const regName = (reg || '').trim().toLowerCase()
            return !regName || regName === wantedRegion
          })
        }

        setCitySuggestions(feats)
        setShowCitySuggestions(feats.length > 0)
        setCityActiveIndex(-1)
      } catch (_err) {
        setCitySuggestions([])
        setShowCitySuggestions(false)
      }
    }, 200)

    return () => clearTimeout(handle)
  }, [citySearch, addressData.country_code, addressData.country, addressData.region])


  // click outside to close suggestions
  useEffect(() => {
    const handler = (ev: MouseEvent) => {
      const t = ev.target as Node
      const cwrap = countrySuggestionsWrapper.current
      const rwrap = regionSuggestionsWrapper.current
      const ciwrap = citySuggestionsWrapper.current
      if (cwrap && !cwrap.contains(t)) setShowCountrySuggestions(false)
      if (rwrap && !rwrap.contains(t)) setShowRegionSuggestions(false)
      if (ciwrap && !ciwrap.contains(t)) setShowCitySuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function fillAddressFromFeature(
    feature: any,
    field?: 'country' | 'region' | 'city'
  ) {
    if (!feature) return

    const ctx: any[] = feature.context ?? []
    const placeTypes: string[] = feature.place_type ?? []

    const countryCtx = ctx.find(c => (c.id || '').startsWith('country.'))
    const regionCtx = ctx.find(c => (c.id || '').startsWith('region.'))
    const placeCtx =
      ctx.find(c => (c.id || '').startsWith('place.')) ||
      ctx.find(c => (c.id || '').startsWith('locality.'))

    // 文本显示用完整名字（Poland），short_code 只用来过滤
    let country =
      countryCtx?.text ||
      countryCtx?.short_code ||
      ''

    const countryCode =
      (countryCtx?.short_code || '').toLowerCase() || undefined

    let region = regionCtx?.text || ''
    let city = placeCtx?.text || ''

    const postcodeCtx = ctx.find(c => (c.id || '').startsWith('postcode.'))
    const postcode = postcodeCtx?.text || ''

    const lon = feature.geometry?.coordinates?.[0]
    const lat = feature.geometry?.coordinates?.[1]

    // 顶层结果兜底
    if (!country && placeTypes.includes('country')) {
      country = feature.text || feature.place_name || country
    }
    if (!region && placeTypes.includes('region')) {
      region = feature.text || feature.place_name || region
    }
    if (!city && (placeTypes.includes('place') || placeTypes.includes('locality'))) {
      city = feature.text || feature.place_name || city
    }

    // 先在外面算好 usingField，外面和 setState 里都共用
    const usingField: 'country' | 'region' | 'city' | null =
      field ?? activeField

    setAddressData(prev => {
      const next: AddressData = { ...prev }

      // 只有真正 address 结果才会填 street
      if (feature.properties && feature.properties.address) {
        next.street = `${feature.properties.address} ${feature.text}`
      }

      // 保存国家代码（内部使用，输入框仍显示完整国家名）
      if (countryCode) {
        next.country_code = countryCode
      }

      // 根据 usingField 决定填哪些字段
      if (usingField === 'country') {
        if (country) next.country = country
      } else if (usingField === 'region') {
        if (region) next.region = region
        if (!next.country && country) next.country = country
      } else if (usingField === 'city') {
        if (city) next.city = city
        if (!next.region && region) next.region = region
        if (!next.country && country) next.country = country
      } else {
        // 没指定 field，就“有就填”
        if (country) next.country = country
        if (region) next.region = region
        if (city) next.city = city
      }

      if (postcode) next.postal_code = postcode
      if (typeof lat === 'number') next.latitude = lat
      if (typeof lon === 'number') next.longitude = lon

      return next
    })

    // 选中后清空对应搜索 & 下拉（⚠️ 不再用 addressSearch）
    if (usingField === 'country') {
      setCountrySearch('')
      setCountrySuggestions([])
      setShowCountrySuggestions(false)
      setCountryActiveIndex(-1)
      // 选完国家，引导用户输入 region
      setTimeout(() => regionInputRef.current?.focus(), 0)
    } else if (usingField === 'region') {
      setRegionSearch('')
      setRegionSuggestions([])
      setShowRegionSuggestions(false)
      setRegionActiveIndex(-1)
      // 选完 region，引导用户输入 city
      setTimeout(() => cityInputRef.current?.focus(), 0)
    } else if (usingField === 'city') {
      setCitySearch('')
      setCitySuggestions([])
      setShowCitySuggestions(false)
      setCityActiveIndex(-1)
    } else {
      // 兜底：清空所有
      setCountrySearch('')
      setRegionSearch('')
      setCitySearch('')
      setCountrySuggestions([])
      setRegionSuggestions([])
      setCitySuggestions([])
      setShowCountrySuggestions(false)
      setShowRegionSuggestions(false)
      setShowCitySuggestions(false)
      setCountryActiveIndex(-1)
      setRegionActiveIndex(-1)
      setCityActiveIndex(-1)
    }
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
      const sex_map: Record<SexOption, 'male' | 'female' | 'unknown'> = {
        he: 'male',
        she: 'female',
        unknown: 'unknown',
      }
      const age_map: Record<string, { y: number; m: number }> = {
        baby: { y: 0, m: 3 },
        very_young: { y: 0, m: 6 },
        young: { y: 1, m: 0 },
        adult: { y: 3, m: 0 },
        senior: { y: 7, m: 0 },
      }

      const mappedAge = age_map[form.age]
      const addressObj: any = {}
      if (addressData.country)      addressObj.country = addressData.country
      if (addressData.region)       addressObj.region = addressData.region
      if (addressData.city)         addressObj.city = addressData.city
      if (addressData.street)       addressObj.street = addressData.street
      if (addressData.postal_code)  addressObj.postal_code = addressData.postal_code
      if (typeof addressData.latitude  === 'number') addressObj.latitude  = addressData.latitude
      if (typeof addressData.longitude === 'number') addressObj.longitude = addressData.longitude
      if (addressData.country_code) addressObj.country_code = addressData.country_code

      const payload = {
        name: form.name,
        species: species || 'dog',
        breed: form.breed,
        sex: sex_map[form.sex] ?? 'male',
        age_years: mappedAge?.y ?? 0,
        age_months: mappedAge?.m ?? 0,
        description: form.description,
        address_data: Object.keys(addressObj).length ? addressObj : undefined,
        dewormed: !!form.traits['dewormed'],
        vaccinated: !!form.traits['vaccinated'],
        microchipped: !!form.traits['microchipped'],
        is_stray: !!form.traits['loves_cares'],
        contact_phone: contactPhone,
        photos,
      }

      console.warn('[donation] payload', payload)
      const fd = buildDonationFormData(payload)

      const res = await donationApi.create(fd)
      console.warn('[donation] backend result', res)

      setSuccess('Your pet has been submitted for adoption review.')

      setForm(prev => ({
        ...prev,
        name: '',
        description: '',
      }))
      setPhotos([])
      setSpecies('dog')
      setAddressData({
        country: '',
        region: '',
        city: '',
        street: '',
        postal_code: '',
      })
      setContactPhone('')
    } catch (err) {
      console.error(err)
      const errRes = (err as any)?.response?.data
      let msg = (err as any)?.message || 'Something went wrong while submitting the pet.'
      if (errRes) {
        if (typeof errRes === 'string') {
          msg = errRes
        } else if (errRes.detail) {
          msg = errRes.detail
        } else if (typeof errRes === 'object') {
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
                        <Form.Select value={species} onChange={e => setSpecies(e.target.value)}>
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
                          onChange={e => setContactPhone(e.target.value)}
                          placeholder="Phone number for the listing"
                        />
                      </Form.Group>
                    </Col>

                    {/* ---- Location Block ---- */}
                    <Col xs={12} className="mt-3">
                      <Form.Label>Location</Form.Label>

                      <Row className="g-2">
                        {/* Country */}
                        <Col xs={12} sm={6}>
                          <div
                            ref={countrySuggestionsWrapper}
                            style={{ position: 'relative' }}
                          >
                            <Form.Control
                              type="text"
                              placeholder="Country"
                              ref={countryInputRef}
                              value={addressData.country}
                              onChange={e => {
                                const v = e.target.value
                                handleAddressChange('country', v)
                                setActiveField('country')
                                setCountrySearch(v)
                                if (!v || v.length < 1) {
                                  setCountrySuggestions([])
                                  setShowCountrySuggestions(false)
                                }
                              }}
                              onFocus={() => {
                                setActiveField('country')
                                if (countrySearch && countrySuggestions.length > 0) {
                                  setShowCountrySuggestions(true)
                                }
                              }}
                              onKeyDown={(e) => {
                                if (!showCountrySuggestions || countrySuggestions.length === 0) return
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault()
                                  setCountryActiveIndex(i => Math.min(i + 1, countrySuggestions.length - 1))
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault()
                                  setCountryActiveIndex(i => Math.max(i - 1, 0))
                                } else if (e.key === 'Enter') {
                                  e.preventDefault()
                                  if (countryActiveIndex >= 0 && countryActiveIndex < countrySuggestions.length) {
                                    fillAddressFromFeature(countrySuggestions[countryActiveIndex], 'country')
                                  }
                                } else if (e.key === 'Escape') {
                                  setShowCountrySuggestions(false)
                                }
                              }}
                            />

                            {activeField === 'country' &&
                              showCountrySuggestions &&
                              countrySuggestions.length > 0 && (
                                <ListGroup
                                  className="position-absolute w-100 shadow-sm address-suggestions"
                                  style={{ top: 'calc(100% + 6px)', left: 0, zIndex: 999 }}
                                >
                                  {countrySuggestions.map((s, idx) => (
                                    <ListGroup.Item
                                      key={s.id}
                                      action
                                      onMouseDown={e => e.preventDefault()}
                                      onClick={() => fillAddressFromFeature(s, 'country')}
                                      active={idx === countryActiveIndex}
                                    >
                                      {s.place_name}
                                    </ListGroup.Item>
                                  ))}
                                </ListGroup>
                              )}
                          </div>
                        </Col>

                        {/* Region */}
                        <Col xs={12} sm={6}>
                          <div
                            ref={regionSuggestionsWrapper}
                            style={{ position: 'relative' }}
                          >
                            <Form.Control
                              type="text"
                              placeholder="Region"
                              ref={regionInputRef}
                              value={addressData.region}
                              onChange={e => {
                                const v = e.target.value
                                handleAddressChange('region', v)
                                setActiveField('region')
                                setRegionSearch(v)
                                if (!v || v.length < 1) {
                                  setRegionSuggestions([])
                                  setShowRegionSuggestions(false)
                                }
                              }}
                              onFocus={() => {
                                setActiveField('region')
                                if (regionSearch && regionSuggestions.length > 0) {
                                  setShowRegionSuggestions(true)
                                }
                              }}
                              onKeyDown={(e) => {
                                if (!showRegionSuggestions || regionSuggestions.length === 0) return
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault()
                                  setRegionActiveIndex(i => Math.min(i + 1, regionSuggestions.length - 1))
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault()
                                  setRegionActiveIndex(i => Math.max(i - 1, 0))
                                } else if (e.key === 'Enter') {
                                  e.preventDefault()
                                  if (regionActiveIndex >= 0 && regionActiveIndex < regionSuggestions.length) {
                                    fillAddressFromFeature(regionSuggestions[regionActiveIndex], 'region')
                                  }
                                } else if (e.key === 'Escape') {
                                  setShowRegionSuggestions(false)
                                }
                              }}
                            />

                            {activeField === 'region' &&
                              showRegionSuggestions &&
                              regionSuggestions.length > 0 && (
                                <ListGroup
                                  className="position-absolute w-100 shadow-sm address-suggestions"
                                  style={{ top: 'calc(100% + 6px)', left: 0, zIndex: 999 }}
                                >
                                  {regionSuggestions.map((s, idx) => (
                                    <ListGroup.Item
                                      key={s.id}
                                      action
                                      onMouseDown={e => e.preventDefault()}
                                      onClick={() => fillAddressFromFeature(s, 'region')}
                                      active={idx === regionActiveIndex}
                                    >
                                      {s.place_name}
                                    </ListGroup.Item>
                                  ))}
                                </ListGroup>
                              )}
                          </div>
                        </Col>

                        {/* City */}
                        <Col xs={12} sm={6} className="mt-2">
                          <div
                            ref={citySuggestionsWrapper}
                            style={{ position: 'relative' }}
                          >
                            <Form.Control
                              type="text"
                              placeholder="City"
                              ref={cityInputRef}
                              value={addressData.city}
                              onChange={e => {
                                const v = e.target.value
                                handleAddressChange('city', v)
                                setActiveField('city')
                                setCitySearch(v)
                                if (!v || v.length < 1) {
                                  setCitySuggestions([])
                                  setShowCitySuggestions(false)
                                }
                              }}
                              onFocus={() => {
                                setActiveField('city')
                                if (citySearch && citySuggestions.length > 0) {
                                  setShowCitySuggestions(true)
                                }
                              }}
                              onKeyDown={(e) => {
                                if (!showCitySuggestions || citySuggestions.length === 0) return
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault()
                                  setCityActiveIndex(i => Math.min(i + 1, citySuggestions.length - 1))
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault()
                                  setCityActiveIndex(i => Math.max(i - 1, 0))
                                } else if (e.key === 'Enter') {
                                  e.preventDefault()
                                  if (cityActiveIndex >= 0 && cityActiveIndex < citySuggestions.length) {
                                    fillAddressFromFeature(citySuggestions[cityActiveIndex], 'city')
                                  }
                                } else if (e.key === 'Escape') {
                                  setShowCitySuggestions(false)
                                }
                              }}
                            />

                            {activeField === 'city' &&
                              showCitySuggestions &&
                              citySuggestions.length > 0 && (
                                <ListGroup
                                  className="position-absolute w-100 shadow-sm address-suggestions"
                                  style={{ top: 'calc(100% + 6px)', left: 0, zIndex: 999 }}
                                >
                                  {citySuggestions.map((s, idx) => (
                                    <ListGroup.Item
                                      key={s.id}
                                      action
                                      onMouseDown={e => e.preventDefault()}
                                      onClick={() => fillAddressFromFeature(s, 'city')}
                                      active={idx === cityActiveIndex}
                                    >
                                      {s.place_name}
                                    </ListGroup.Item>
                                  ))}
                                </ListGroup>
                              )}
                          </div>
                        </Col>

                        {/* Postal */}
                        <Col xs={12} sm={6} className="mt-2">
                          <Form.Control
                            type="text"
                            placeholder="Postal code"
                            value={addressData.postal_code}
                            onChange={e =>
                              handleAddressChange('postal_code', e.target.value)
                            }
                          />
                        </Col>

                        {/* Street */}
                        <Col xs={12} className="mt-2">
                          <Form.Control
                            type="text"
                            placeholder="Street and building"
                            value={addressData.street}
                            onChange={e => handleAddressChange('street', e.target.value)}
                          />
                        </Col>

                        <Col xs={12} className="mt-2">
                          <Form.Text className="text-muted">
                            Tip: Start typing country / region / city and pick from suggestions; fields
                            will be filled automatically.
                          </Form.Text>
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
                  const input = document.getElementById(
                    'pet-photos-input',
                  ) as HTMLInputElement | null
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
