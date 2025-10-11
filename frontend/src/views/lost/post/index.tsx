// src/views/lost/post/index.tsx
import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { lostApi, type LostCreatePayload } from '@/services/modules/lost'

export default function LostReport() {
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)

  function buildPayload(f: FormData): LostCreatePayload {
    const name = String(f.get('name') || '').trim()
    const species = String(f.get('species') || '').trim()
    const breed = String(f.get('breed') || '').trim()
    const color = String(f.get('color') || '').trim()
    const description = String(f.get('description') || '').trim()
    const address = String(f.get('address') || '').trim()
    const sex = (String(f.get('sex') || 'U') as 'M'|'F'|'U')
    const ageStr = String(f.get('age_months') || '').trim()

    if (!name) throw new Error('请填写名称')

    const payload: LostCreatePayload = { name }

    if (species) payload.species = species
    if (breed) payload.breed = breed
    if (color) payload.color = color
    if (description) payload.description = description
    if (address) payload.address = address
    if (sex) payload.sex = sex
    if (ageStr !== '') {
      const n = Number(ageStr)
      if (!Number.isNaN(n)) payload.age_months = n        // ✅ 只在为 number 时设置
    }

    return payload
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      setLoading(true)
      const f = new FormData(e.currentTarget)
      const body = buildPayload(f)
      await lostApi.create(body)
      alert('提交成功')
      nav('/lost')
    } catch (e: any) {
      alert(e?.message || e?.response?.data?.detail || '提交失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin:'24px auto', padding:16 }}>
      <h2>上报走失</h2>
      <form onSubmit={onSubmit} style={{ display:'grid', gap:12, marginTop:12 }}>
        <input name="name" placeholder="名称（必填）" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <input name="species" placeholder="物种（如：Dog/Cat）" />
          <input name="breed" placeholder="品种（可选）" />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <input name="color" placeholder="颜色（可选）" />
          <input name="age_months" type="number" min={0} placeholder="月龄（可选）" />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <select name="sex" defaultValue="U">
            <option value="U">性别未知</option>
            <option value="M">公</option>
            <option value="F">母</option>
          </select>
          <input name="address" placeholder="走失位置（可选）" />
        </div>
        <textarea name="description" placeholder="描述（可选）" rows={5} />
        <button type="submit" disabled={loading}>
          {loading ? '提交中…' : '提交'}
        </button>
      </form>
    </div>
  )
}
