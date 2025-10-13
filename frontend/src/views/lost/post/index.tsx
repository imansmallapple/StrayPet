import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { lostApi, buildLostFormData } from '@/services/modules/lost'

export default function LostPost() {
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)

  // —— 基础信息 ——
  const [petName, setPetName] = useState('')
  const [species, setSpecies] = useState('')
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [lostAt, setLostAt] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)

  // —— 地址输入字段 ——
  const [country, setCountry] = useState('')
  const [region, setRegion] = useState('')
  const [city, setCity] = useState('')
  const [street, setStreet] = useState('')
  const [building, setBuilding] = useState('')
  const [postal, setPostal] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      if (!species || !lostAt) throw new Error('必填项未填写')

      // ✅ 新增 address_data 结构
      const address_data = {
        country: country || null,
        region: region || null,
        city: city || null,
        street,
        building_number: building,
        postal_code: postal,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
      }

      const payload = {
        pet_name: petName,
        species,
        sex,
        lost_time: new Date(lostAt).toISOString(),
        description,
        photo: photo ?? undefined,
        address_data, // ✅ 直接传完整地址对象
      }

      const fd = buildLostFormData(payload as any)
      setLoading(true)
      await lostApi.create(fd)
      alert('发布成功')
      nav('/lost')
    } catch (err: any) {
      alert(err?.message || '提交失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '24px auto', padding: 16 }}>
      <h2>发布走失信息</h2>

      <form onSubmit={onSubmit} style={{ display:'grid', gap:12 }}>
        <label>宠物名称<input value={petName} onChange={e=>setPetName(e.target.value)} /></label>
        <label>物种（必填）<input value={species} onChange={e=>setSpecies(e.target.value)} required /></label>
        <label>性别
          <select value={sex} onChange={e=>setSex(e.target.value as any)}>
            <option value="male">公</option>
            <option value="female">母</option>
          </select>
        </label>
        <label>走失时间<input type="datetime-local" value={lostAt} onChange={e=>setLostAt(e.target.value)} /></label>

        {/* —— 地址部分 —— */}
        <fieldset style={{border:'1px solid #ccc',padding:12,borderRadius:8}}>
          <legend>地址信息</legend>
          <label>国家<input value={country} onChange={e=>setCountry(e.target.value)} /></label>
          <label>省/州<input value={region} onChange={e=>setRegion(e.target.value)} /></label>
          <label>城市<input value={city} onChange={e=>setCity(e.target.value)} /></label>
          <label>街道<input value={street} onChange={e=>setStreet(e.target.value)} /></label>
          <label>楼号<input value={building} onChange={e=>setBuilding(e.target.value)} /></label>
          <label>邮编<input value={postal} onChange={e=>setPostal(e.target.value)} /></label>
          <label>经度<input value={lng} onChange={e=>setLng(e.target.value)} /></label>
          <label>纬度<input value={lat} onChange={e=>setLat(e.target.value)} /></label>
        </fieldset>

        <label>描述<textarea value={description} onChange={e=>setDescription(e.target.value)} /></label>
        <label>照片<input type="file" accept="image/*" onChange={e=>setPhoto(e.target.files?.[0]||null)} /></label>

        <button type="submit" disabled={loading}>{loading?'提交中…':'提交'}</button>
      </form>
    </div>
  )
}
