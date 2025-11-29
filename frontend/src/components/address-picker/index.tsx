import { useEffect, useMemo, useState } from 'react'
import { addressApi, type Country, type Region, type City, type Address } from '@/services/modules/address'

type Props = {
  value?: number | ''                 // 当前选中的地址 id
  onChange: (id: number | '') => void
  allowCreate?: boolean               // 是否允许“新建地址”
  fallbackSimpleInput?: boolean       // 仅展示“输入地址ID”（当你还没后端地址 API 时先用它）
}

export default function AddressPicker({
  value = '',
  onChange,
  allowCreate = true,
  fallbackSimpleInput = false,
}: Props) {
  // ！！！Hooks 必须无条件调用（不要在上面 return）
  const [countries, setCountries] = useState<Country[]>([])
  const [regions,   setRegions]   = useState<Region[]>([])
  const [cities,    setCities]    = useState<City[]>([])
  const [loading,   setLoading]   = useState(false)
  const [err,       setErr]       = useState('')

  const [countryId, setCountryId] = useState<number | ''>('')
  const [regionId,  setRegionId]  = useState<number | ''>('')
  const [cityId,    setCityId]    = useState<number | ''>('')

  const [street,   setStreet]   = useState('')
  const [building, setBuilding] = useState('')
  const [postal,   setPostal]   = useState('')

  // 拉国家
  useEffect(() => {
    if (fallbackSimpleInput) return
    let alive = true
    ;(async () => {
      try {
        const { data } = await addressApi.listCountries()
        if (!alive) return
        setCountries(data)
      } catch {
        setErr('获取国家列表失败')
      }
    })()
    return () => { alive = false }
  }, [fallbackSimpleInput])

  // 选了国家 → 拉省州
  useEffect(() => {
    if (fallbackSimpleInput) return
    if (!countryId) {
      return
    }
    let alive = true
    ;(async () => {
      try {
        const { data } = await addressApi.listRegions(Number(countryId))
        if (!alive) return
        setRegions(data)
        setRegionId(''); setCities([]); setCityId('')
      } catch {
        setErr('获取省/州失败')
      }
    })()
    return () => { alive = false }
  }, [countryId, fallbackSimpleInput])

  // 选了省州 → 拉城市
  useEffect(() => {
    if (fallbackSimpleInput) return
    if (!regionId) {
      return
    }
    let alive = true
    ;(async () => {
      try {
        const { data } = await addressApi.listCities(Number(regionId))
        if (!alive) return
        setCities(data)
        setCityId('')
      } catch {
        setErr('获取城市失败')
      }
    })()
    return () => { alive = false }
  }, [regionId, fallbackSimpleInput])

  async function createAddress() {
    try {
      setLoading(true)
      const payload: Partial<Address> = {
        country: countryId ? Number(countryId) : null,
        region:  regionId  ? Number(regionId)  : null,
        city:    cityId    ? Number(cityId)    : null,
        street:  street || null,
        building_number: building || null,
        postal_code: postal || null,
      }
      const { data } = await addressApi.createAddress(payload)
      onChange(data.id)
    } catch (e: any) {
      const r = e?.response?.data
      const first = r && typeof r === 'object' ? Object.entries(r)[0] : null
      alert(first ? `${first[0]}: ${Array.isArray(first[1]) ? first[1][0] : String(first[1])}` : '创建地址失败')
    } finally {
      setLoading(false)
    }
  }

  const summary = useMemo(() => {
    if (fallbackSimpleInput) return ''
    const c = countries.find(x => x.id === countryId)
    const r = regions.find(x => x.id === regionId)
    const c2 = cities.find(x => x.id === cityId)
    return [c?.name, r?.name, c2?.name, street, building, postal].filter(Boolean).join(', ')
  }, [fallbackSimpleInput, countries, regions, cities, countryId, regionId, cityId, street, building, postal])

  // ——— 渲染 ———

  // fallback：只显示一个数字输入（不会提前 return，hooks 顺序仍旧不变）
  const FallbackInput = (
    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
      <input
        type="number"
        min={1}
        step={1}
        placeholder="输入已有地址的数值 ID"
        value={value}
        onChange={e => onChange(e.target.value ? Number(e.target.value) : '')}
        style={{ width: 220 }}
      />
      <small style={{ color:'#64748b' }}>到后台“地址”创建后，把 ID 粘贴到这里</small>
    </div>
  )

  // 完整模式：级联 + 明细 + 新建
  const FullPicker = (
    <div style={{ border:'1px solid #e2e8f0', borderRadius:12, padding:12 }}>
      {err && <div style={{ color:'#b00020', marginBottom:8 }}>{err}</div>}

      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
        <label style={{ color:'#64748b' }}>地址ID：</label>
        <input
          type="number"
          min={1}
          step={1}
          value={value}
          onChange={e => onChange(e.target.value ? Number(e.target.value) : '')}
          placeholder="已有地址ID（可直接粘贴）"
          style={{ width: 220 }}
        />
        {summary && <span style={{ color:'#64748b' }}>当前：{summary}</span>}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
        <select value={countryId} onChange={e => setCountryId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">Country</option>
          {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={regionId} onChange={e => setRegionId(e.target.value ? Number(e.target.value) : '')} disabled={!countryId}>
          <option value="">Region</option>
          {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>

        <select value={cityId} onChange={e => setCityId(e.target.value ? Number(e.target.value) : '')} disabled={!regionId}>
          <option value="">City</option>
          {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:8, marginTop:8 }}>
        <input value={street}   onChange={e => setStreet(e.target.value)}   placeholder="Street" />
        <input value={building} onChange={e => setBuilding(e.target.value)} placeholder="Building No." />
        <input value={postal}   onChange={e => setPostal(e.target.value)}   placeholder="Postal Code" />
      </div>

      {allowCreate && (
        <div style={{ marginTop:8 }}>
          <button type="button" onClick={createAddress} disabled={loading}>
            {loading ? '创建中…' : '新建地址并使用'}
          </button>
        </div>
      )}
    </div>
  )

  return fallbackSimpleInput ? FallbackInput : FullPicker
}
