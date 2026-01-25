// src/views/holiday-family/apply/index.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { holidayFamilyApi } from '@/services/modules/holiday-family'
import './index.scss'

interface ApplicationForm {
  fullName: string
  email: string
  phone: string
  country: string
  state: string
  city: string
  postalCode: string
  streetAddress: string
  petCount: number
  petTypes: {
    dogs: boolean
    cats: boolean
    rabbits: boolean
    others: boolean
    othersText: string
  }
  motivation: string
  introduction: string
  idDocument: File | null
  familyPhotos: File[]
  termsAgreed: boolean
}

export default function HolidayFamilyApply() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState<ApplicationForm>({
    fullName: '',
    email: user?.email || '',
    phone: '',
    country: '',
    state: '',
    city: '',
    postalCode: '',
    streetAddress: '',
    petCount: 0,
    petTypes: {
      dogs: false,
      cats: false,
      rabbits: false,
      others: false,
      othersText: '',
    },
    motivation: '',
    introduction: '',
    idDocument: null,
    familyPhotos: [],
    termsAgreed: false,
  })

  // Debug: Monitor error state changes
  useEffect(() => {
    if (error) {
      console.error('Error state updated:', error)
    }
  }, [error])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    if (name.startsWith('petTypes_')) {
      const petType = name.replace('petTypes_', '')
      setForm(prev => ({
        ...prev,
        petTypes: {
          ...prev.petTypes,
          [petType]: type === 'checkbox' ? checked : value,
        } as ApplicationForm['petTypes'],
      }))
    } else {
      setForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : name === 'petCount' ? parseInt(value) || 0 : value,
      }))
    }
    
    // 清除错误状态当用户开始编辑
    if (error) {
      setError(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const files = e.target.files
    if (!files) return

    if (fieldName === 'idDocument') {
      setForm(prev => ({
        ...prev,
        idDocument: files[0] || null,
      }))
    } else if (fieldName === 'familyPhotos') {
      setForm(prev => ({
        ...prev,
        familyPhotos: Array.from(files),
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    console.error('✓ handleSubmit triggered')
    e.preventDefault()
    setSuccess(false)

    // 验证必填字段
    if (!form.fullName.trim()) {
      console.error('✓ Validation failed: fullName is empty')
      setError('Please enter your full name')
      return
    }
    if (!form.email.trim()) {
      setError('Please enter your email')
      return
    }
    if (!form.phone.trim()) {
      setError('Please enter your phone number')
      return
    }
    if (!form.country.trim()) {
      setError('Please enter your country')
      return
    }
    if (!form.state.trim()) {
      setError('Please enter your state/region')
      return
    }
    if (!form.city.trim()) {
      setError('Please enter your city')
      return
    }
    if (!form.streetAddress.trim()) {
      setError('Please enter your street address')
      return
    }
    if (!form.motivation.trim()) {
      setError('Please tell us why you want to be a Holiday Family')
      return
    }
    if (!form.introduction.trim()) {
      setError('Please tell us about yourself in the Introduction section')
      return
    }

    const hasAnyPetType = form.petTypes.dogs || form.petTypes.cats || form.petTypes.rabbits || form.petTypes.othersText.trim() !== ''
    if (!hasAnyPetType) {
      setError('Please select at least one pet type')
      return
    }

    if (!form.idDocument) {
      setError('Please upload your ID document')
      return
    }

    if (form.familyPhotos.length === 0) {
      setError('Please upload at least one photo of your home environment')
      return
    }

    if (!form.termsAgreed) {
      setError('Please agree to the terms and conditions')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await holidayFamilyApi.apply(form)
      setSuccess(true)
      setTimeout(() => {
        navigate('/holiday-family')
      }, 2000)
    } catch (err: any) {
      // 处理后端返回的特定错误信息
      if (err.response?.data?.error) {
        setError(err.response.data.error)
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to submit application')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="holiday-family-apply-container">
        <div className="auth-required">
          <h2>Login Required</h2>
          <p>Please log in to apply for Holiday Family.</p>
          <button type="button" onClick={() => navigate('/auth/login')} className="login-btn">
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="page-header">
        <h1>🎄 Apply to be a Holiday Family</h1>
        <p className="subtitle">Help pets have a memorable holiday season with your family</p>
        <div className="page-header-underline"></div>
      </div>

      <div className="holiday-family-apply-container">
        {success ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Application Submitted Successfully!</h2>
            <p>Thank you for applying to be a Holiday Family. Our admin team will review your application and contact you soon.</p>
            <p>You will be redirected shortly...</p>
          </div>
        ) : (
          <form className="apply-form" onSubmit={handleSubmit}>
            {error && (
              <div className="error-message" id="error-message-box">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Personal Information Section */}
            <div className="form-section">
              <h3>Personal Information</h3>

              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  className=""
                  value={form.fullName}
                  onChange={handleInputChange}
                  placeholder="e.g., Joanna Jan"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className=""
                    value={form.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className=""
                    value={form.phone}
                    onChange={handleInputChange}
                    placeholder="+48 12 345 67 89"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div className="form-section">
              <h3>Your Address</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="country">Country *</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={form.country}
                    onChange={handleInputChange}
                    placeholder="e.g., Poland"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="state">State/Region *</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={form.state}
                    onChange={handleInputChange}
                    placeholder="e.g., Mazovia"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={handleInputChange}
                    placeholder="e.g., Warsaw"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="streetAddress">Street *</label>
                  <input
                    type="text"
                    id="streetAddress"
                    name="streetAddress"
                    value={form.streetAddress}
                    onChange={handleInputChange}
                    placeholder="e.g., ul. Nowy Świat 10"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="postalCode">Postal Code</label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={form.postalCode}
                    onChange={handleInputChange}
                    placeholder="e.g., 00-001"
                  />
                </div>
              </div>
            </div>

            {/* Pet Information Section */}
            <div className="form-section">
              <h3>Pet Experience</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Type of Pets you can take care *</label>
                  <div className="pet-types-container" >
                    <div className="checkbox-options">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="petTypes_dogs"
                          checked={form.petTypes.dogs}
                          onChange={handleInputChange}
                        />
                        Dogs
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="petTypes_cats"
                          checked={form.petTypes.cats}
                          onChange={handleInputChange}
                        />
                        Cats
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="petTypes_rabbits"
                          checked={form.petTypes.rabbits}
                          onChange={handleInputChange}
                        />
                        Rabbits
                      </label>
                    </div>
                    <div className="others-section">
                      <label htmlFor="petTypes_othersText" className="others-label">Others</label>
                      <input
                        type="text"
                        id="petTypes_othersText"
                        name="petTypes_othersText"
                        value={form.petTypes.othersText}
                        onChange={handleInputChange}
                        placeholder="e.g., Hamster, Guinea pig"
                        className="others-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="petCount">Number of Pets You Currently Own *</label>
                  <select
                    id="petCount"
                    name="petCount"
                    value={form.petCount}
                    onChange={handleInputChange}
                  >
                    <option value="0">0 - I don't have pets</option>
                    <option value="1">1 pet</option>
                    <option value="2">2 pets</option>
                    <option value="3">3 pets</option>
                    <option value="4">4 pets</option>
                    <option value="5">5+ pets</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Motivation Section */}
            <div className="form-section">
              <h3>Your Story</h3>

              <div className="form-group">
                <label htmlFor="motivation">
                  Why do you want to be a Holiday Family? *
                </label>
                <p className="help-text">Tell us about your pet experience, your family, and why you'd like to provide a temporary home for a pet during the holidays...</p>
                <textarea
                  id="motivation"
                  name="motivation"
                  value={form.motivation}
                  onChange={handleInputChange}
                  rows={6}
                  required
                />
                <div className="char-count">{form.motivation.length} / 1000</div>
              </div>

              <div className="form-group">
                <label htmlFor="introduction">
                  Tell us about yourself *
                </label>
                <p className="help-text">Share a bit about yourself, your family, your home, and what makes you a great Holiday Family. What are your hobbies? Do you have any special arrangements or considerations we should know about?</p>
                <textarea
                  id="introduction"
                  name="introduction"
                  value={form.introduction}
                  onChange={handleInputChange}
                  rows={6}
                  required
                />
                <div className="char-count">{form.introduction.length} / 1000</div>
              </div>
            </div>

            {/* Family Photos Upload Section */}
            <div className="form-section">
              <h3>Home Environment</h3>

              <div className="form-group">
                <label htmlFor="familyPhotos" className="form-label">Upload Home/Family Photos *</label>
                <p className="help-text">Please upload at least one photo of your home environment where the pet will stay (living room, bedroom, outdoor space, etc.)</p>
                <div className="file-upload-label" onClick={() => document.getElementById('familyPhotos')?.click()}>
                  <span className="upload-icon">📁</span>
                  <span className="upload-text">{form.familyPhotos.length > 0 ? `${form.familyPhotos.length} file(s) selected` : 'Click or drag files to upload'}</span>
                </div>
                <input
                  type="file"
                  id="familyPhotos"
                  name="familyPhotos"
                  className="file-input-hidden"
                  onChange={(e) => handleFileChange(e, 'familyPhotos')}
                  accept="image/*"
                  multiple
                  required
                />
                {form.familyPhotos.length > 0 && (
                  <div className="file-list">
                    <p>{form.familyPhotos.length} file(s) selected:</p>
                    <ul>
                      {form.familyPhotos.map((file) => (
                        <li key={`${file.name}-${file.size}`}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* ID Document Upload Section */}
            <div className="form-section">
              <h3>Verification Documents</h3>

              <div className="form-group">
                <label htmlFor="idDocument" className="form-label">Upload Your ID Document *</label>
                <p className="help-text">Please upload a clear photo or scan of your ID (passport, driver's license, or national ID)</p>
                <div className="file-upload-label" onClick={() => document.getElementById('idDocument')?.click()}>
                  <span className="upload-icon">📄</span>
                  <span className="upload-text">{form.idDocument ? 'File selected' : 'Click or drag file to upload'}</span>
                </div>
                <input
                  type="file"
                  id="idDocument"
                  name="idDocument"
                  className="file-input-hidden"
                  onChange={(e) => handleFileChange(e, 'idDocument')}
                  accept="image/*,.pdf"
                  required
                />
                {form.idDocument && (
                  <div className="file-name">Selected: {form.idDocument.name}</div>
                )}
              </div>
            </div>

            {/* Terms Agreement Section */}
            <div className="form-section">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="termsAgreed"
                  name="termsAgreed"
                  checked={form.termsAgreed}
                  onChange={handleInputChange}
                />
                <label htmlFor="termsAgreed">
                  I agree to the Holiday Family terms and conditions and understand my responsibilities *
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate('/holiday-family')}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
