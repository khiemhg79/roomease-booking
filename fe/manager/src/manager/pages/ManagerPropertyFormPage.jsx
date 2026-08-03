import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { managerApi } from '@/api/manager/managerApi'
import { apiMessage } from '@/api/http'
import ErrorAlert from '@/shared/components/ErrorAlert'
import Loading from '@/shared/components/Loading'

const EMPTY_FORM = {
  name: '',
  propertyType: 'HOTEL',
  description: '',
  addressLine: '',
  ward: '',
  district: '',
  city: '',
  province: '',
  country: 'Việt Nam',
  postalCode: '',
  latitude: '',
  longitude: '',
  starRating: 3,
  checkInFrom: '14:00',
  checkInUntil: '',
  checkOutFrom: '',
  checkOutUntil: '12:00',
  featured: false,
  imageUrls: '',
  amenityCodes: [],
  policy: {
    childrenAllowed: true,
    petsPolicy: 'NOT_ALLOWED',
    smokingPolicy: 'NON_SMOKING',
    partiesAllowed: false,
    quietHoursFrom: '',
    quietHoursUntil: '',
    ageRestriction: '',
    extraBedPolicy: '',
    importantInformation: '',
  },
}

const PROPERTY_TYPES = [
  ['HOTEL', 'Khách sạn'],
  ['APARTMENT', 'Căn hộ'],
  ['RESORT', 'Khu nghỉ dưỡng'],
  ['VILLA', 'Biệt thự'],
  ['HOSTEL', 'Hostel'],
  ['HOMESTAY', 'Homestay'],
]

function fromProperty(property) {
  return {
    name: property.name || '',
    propertyType: property.propertyType || 'HOTEL',
    description: property.description || '',
    addressLine: property.addressLine || '',
    ward: property.ward || '',
    district: property.district || '',
    city: property.city || '',
    province: property.province || '',
    country: property.country || 'Việt Nam',
    postalCode: property.postalCode || '',
    latitude: property.latitude ?? '',
    longitude: property.longitude ?? '',
    starRating: property.starRating ?? 0,
    checkInFrom: property.checkInFrom?.slice(0, 5) || '14:00',
    checkInUntil: property.checkInUntil?.slice(0, 5) || '',
    checkOutFrom: property.checkOutFrom?.slice(0, 5) || '',
    checkOutUntil: property.checkOutUntil?.slice(0, 5) || '12:00',
    featured: Boolean(property.featured),
    imageUrls: (property.images || []).sort((a, b) => a.sortOrder - b.sortOrder).map((image) => image.imageUrl).join('\n'),
    amenityCodes: property.amenityCodes || [],
    policy: {
      childrenAllowed: property.policy?.childrenAllowed ?? true,
      petsPolicy: property.policy?.petsPolicy || 'NOT_ALLOWED',
      smokingPolicy: property.policy?.smokingPolicy || 'NON_SMOKING',
      partiesAllowed: property.policy?.partiesAllowed ?? false,
      quietHoursFrom: property.policy?.quietHoursFrom?.slice(0, 5) || '',
      quietHoursUntil: property.policy?.quietHoursUntil?.slice(0, 5) || '',
      ageRestriction: property.policy?.ageRestriction ?? '',
      extraBedPolicy: property.policy?.extraBedPolicy || '',
      importantInformation: property.policy?.importantInformation || '',
    },
  }
}

export default function ManagerPropertyFormPage() {
  const { propertyId } = useParams()
  const editing = Boolean(propertyId)
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [amenities, setAmenities] = useState([])
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      managerApi.amenities(),
      editing ? managerApi.property(propertyId) : Promise.resolve(null),
    ]).then(([amenityData, property]) => {
      if (!active) return
      setAmenities(amenityData || [])
      if (property) setForm(fromProperty(property))
    }).catch((requestError) => {
      if (active) setError(apiMessage(requestError))
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [editing, propertyId])

  const amenitiesByCategory = useMemo(() => amenities.reduce((result, amenity) => {
    const category = amenity.category || 'OTHER'
    result[category] = [...(result[category] || []), amenity]
    return result
  }, {}), [amenities])

  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }))
  const setPolicy = (name, value) => setForm((current) => ({
    ...current,
    policy: { ...current.policy, [name]: value },
  }))

  const toggleAmenity = (code) => setForm((current) => ({
    ...current,
    amenityCodes: current.amenityCodes.includes(code)
      ? current.amenityCodes.filter((item) => item !== code)
      : [...current.amenityCodes, code],
  }))

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    const imageUrls = form.imageUrls.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)
    const payload = {
      name: form.name,
      propertyType: form.propertyType,
      description: form.description || null,
      addressLine: form.addressLine,
      ward: form.ward || null,
      district: form.district || null,
      city: form.city,
      province: form.province || null,
      country: form.country,
      postalCode: form.postalCode || null,
      latitude: form.latitude === '' ? null : Number(form.latitude),
      longitude: form.longitude === '' ? null : Number(form.longitude),
      starRating: Number(form.starRating),
      checkInFrom: form.checkInFrom || null,
      checkInUntil: form.checkInUntil || null,
      checkOutFrom: form.checkOutFrom || null,
      checkOutUntil: form.checkOutUntil || null,
      featured: form.featured,
      images: imageUrls.map((imageUrl, index) => ({
        imageUrl,
        altText: form.name,
        sortOrder: index,
        cover: index === 0,
      })),
      amenityCodes: form.amenityCodes,
      policy: {
        ...form.policy,
        quietHoursFrom: form.policy.quietHoursFrom || null,
        quietHoursUntil: form.policy.quietHoursUntil || null,
        ageRestriction: form.policy.ageRestriction === '' ? null : Number(form.policy.ageRestriction),
        extraBedPolicy: form.policy.extraBedPolicy || null,
        importantInformation: form.policy.importantInformation || null,
      },
    }

    try {
      const saved = editing
        ? await managerApi.updateProperty(propertyId, payload)
        : await managerApi.createProperty(payload)
      navigate(`/manager/properties/${saved.id}/rooms`, {
        replace: true,
        state: { notice: editing ? 'Đã cập nhật chỗ nghỉ.' : 'Đã tạo chỗ nghỉ. Tiếp theo hãy thêm loại phòng.' },
      })
    } catch (requestError) {
      setError(apiMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  return (
    <main className="manager-page">
      <header className="manager-page-header">
        <div>
          <p className="manager-kicker">Thiết lập chỗ nghỉ</p>
          <h1>{editing ? 'Chỉnh sửa chỗ nghỉ' : 'Thêm chỗ nghỉ mới'}</h1>
          <p>Thông tin này được hiển thị trên trang tìm kiếm và trang chi tiết của khách.</p>
        </div>
        <Link className="btn btn-ghost dark" to="/manager/properties">← Quay lại</Link>
      </header>

      <ErrorAlert message={error} />

      <form className="manager-form" onSubmit={submit}>
        <section className="manager-form-section">
          <div className="manager-form-section-heading">
            <span>1</span>
            <div><h2>Thông tin cơ bản</h2><p>Tên, loại hình và mô tả chỗ nghỉ.</p></div>
          </div>
          <div className="manager-form-grid">
            <label className="manager-field manager-field-wide">Tên chỗ nghỉ
              <input value={form.name} onChange={(e) => setField('name', e.target.value)} maxLength={200} required />
            </label>
            <label className="manager-field">Loại hình
              <select value={form.propertyType} onChange={(e) => setField('propertyType', e.target.value)}>
                {PROPERTY_TYPES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
            <label className="manager-field">Xếp hạng sao
              <select value={form.starRating} onChange={(e) => setField('starRating', e.target.value)}>
                {[0, 1, 2, 3, 4, 5].map((star) => <option value={star} key={star}>{star} sao</option>)}
              </select>
            </label>
            <label className="manager-field manager-field-full">Mô tả
              <textarea rows="7" value={form.description} onChange={(e) => setField('description', e.target.value)} maxLength={10000} />
            </label>
            <label className="manager-check manager-field-full">
              <input type="checkbox" checked={form.featured} onChange={(e) => setField('featured', e.target.checked)} />
              Đánh dấu là chỗ nghỉ nổi bật trên trang chủ
            </label>
          </div>
        </section>

        <section className="manager-form-section">
          <div className="manager-form-section-heading">
            <span>2</span>
            <div><h2>Địa chỉ</h2><p>Giúp khách xác định chính xác vị trí chỗ nghỉ.</p></div>
          </div>
          <div className="manager-form-grid">
            <label className="manager-field manager-field-full">Địa chỉ
              <input value={form.addressLine} onChange={(e) => setField('addressLine', e.target.value)} required />
            </label>
            <label className="manager-field">Phường/xã
              <input value={form.ward} onChange={(e) => setField('ward', e.target.value)} />
            </label>
            <label className="manager-field">Quận/huyện
              <input value={form.district} onChange={(e) => setField('district', e.target.value)} />
            </label>
            <label className="manager-field">Thành phố
              <input value={form.city} onChange={(e) => setField('city', e.target.value)} required />
            </label>
            <label className="manager-field">Tỉnh/thành
              <input value={form.province} onChange={(e) => setField('province', e.target.value)} />
            </label>
            <label className="manager-field">Quốc gia
              <input value={form.country} onChange={(e) => setField('country', e.target.value)} required />
            </label>
            <label className="manager-field">Mã bưu chính
              <input value={form.postalCode} onChange={(e) => setField('postalCode', e.target.value)} />
            </label>
            <label className="manager-field">Vĩ độ
              <input type="number" step="0.0000001" value={form.latitude} onChange={(e) => setField('latitude', e.target.value)} />
            </label>
            <label className="manager-field">Kinh độ
              <input type="number" step="0.0000001" value={form.longitude} onChange={(e) => setField('longitude', e.target.value)} />
            </label>
          </div>
        </section>

        <section className="manager-form-section">
          <div className="manager-form-section-heading">
            <span>3</span>
            <div><h2>Giờ nhận và trả phòng</h2><p>Thiết lập khung giờ phục vụ khách.</p></div>
          </div>
          <div className="manager-form-grid manager-form-grid-four">
            <label className="manager-field">Nhận phòng từ
              <input type="time" value={form.checkInFrom} onChange={(e) => setField('checkInFrom', e.target.value)} required />
            </label>
            <label className="manager-field">Nhận phòng đến
              <input type="time" value={form.checkInUntil} onChange={(e) => setField('checkInUntil', e.target.value)} />
            </label>
            <label className="manager-field">Trả phòng từ
              <input type="time" value={form.checkOutFrom} onChange={(e) => setField('checkOutFrom', e.target.value)} />
            </label>
            <label className="manager-field">Trả phòng đến
              <input type="time" value={form.checkOutUntil} onChange={(e) => setField('checkOutUntil', e.target.value)} required />
            </label>
          </div>
        </section>

        <section className="manager-form-section">
          <div className="manager-form-section-heading">
            <span>4</span>
            <div><h2>Hình ảnh</h2><p>Mỗi dòng là một URL ảnh. Ảnh đầu tiên được dùng làm ảnh bìa.</p></div>
          </div>
          <label className="manager-field">
            URL hình ảnh
            <textarea rows="7" value={form.imageUrls} onChange={(e) => setField('imageUrls', e.target.value)} placeholder={'https://.../cover.jpg\nhttps://.../room.jpg'} />
          </label>
          <div className="manager-image-preview-grid">
            {form.imageUrls.split(/\r?\n/).map((url) => url.trim()).filter(Boolean).slice(0, 6).map((url, index) => (
              <div key={`${url}-${index}`}><img src={url} alt={`Xem trước ${index + 1}`} /><span>{index === 0 ? 'Ảnh bìa' : `Ảnh ${index + 1}`}</span></div>
            ))}
          </div>
        </section>

        <section className="manager-form-section">
          <div className="manager-form-section-heading">
            <span>5</span>
            <div><h2>Tiện nghi</h2><p>Chọn những tiện nghi hiện có tại chỗ nghỉ.</p></div>
          </div>
          <div className="manager-amenity-groups">
            {Object.entries(amenitiesByCategory).map(([category, values]) => (
              <fieldset key={category}>
                <legend>{category}</legend>
                <div className="manager-checkbox-grid">
                  {values.map((amenity) => (
                    <label className="manager-check" key={amenity.code}>
                      <input type="checkbox" checked={form.amenityCodes.includes(amenity.code)} onChange={() => toggleAmenity(amenity.code)} />
                      {amenity.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </section>

        <section className="manager-form-section">
          <div className="manager-form-section-heading">
            <span>6</span>
            <div><h2>Chính sách</h2><p>Quy định dành cho khách lưu trú.</p></div>
          </div>
          <div className="manager-form-grid">
            <label className="manager-check"><input type="checkbox" checked={form.policy.childrenAllowed} onChange={(e) => setPolicy('childrenAllowed', e.target.checked)} /> Cho phép trẻ em</label>
            <label className="manager-check"><input type="checkbox" checked={form.policy.partiesAllowed} onChange={(e) => setPolicy('partiesAllowed', e.target.checked)} /> Cho phép tổ chức tiệc</label>
            <label className="manager-field">Thú cưng
              <select value={form.policy.petsPolicy} onChange={(e) => setPolicy('petsPolicy', e.target.value)}>
                <option value="NOT_ALLOWED">Không cho phép</option>
                <option value="ON_REQUEST">Theo yêu cầu</option>
                <option value="ALLOWED">Cho phép</option>
              </select>
            </label>
            <label className="manager-field">Hút thuốc
              <select value={form.policy.smokingPolicy} onChange={(e) => setPolicy('smokingPolicy', e.target.value)}>
                <option value="NON_SMOKING">Không hút thuốc</option>
                <option value="DESIGNATED_AREAS">Khu vực riêng</option>
                <option value="ALLOWED">Cho phép</option>
              </select>
            </label>
            <label className="manager-field">Giờ yên tĩnh từ
              <input type="time" value={form.policy.quietHoursFrom} onChange={(e) => setPolicy('quietHoursFrom', e.target.value)} />
            </label>
            <label className="manager-field">Giờ yên tĩnh đến
              <input type="time" value={form.policy.quietHoursUntil} onChange={(e) => setPolicy('quietHoursUntil', e.target.value)} />
            </label>
            <label className="manager-field">Độ tuổi tối thiểu
              <input type="number" min="0" max="99" value={form.policy.ageRestriction} onChange={(e) => setPolicy('ageRestriction', e.target.value)} />
            </label>
            <label className="manager-field manager-field-full">Chính sách giường phụ
              <textarea rows="3" value={form.policy.extraBedPolicy} onChange={(e) => setPolicy('extraBedPolicy', e.target.value)} />
            </label>
            <label className="manager-field manager-field-full">Thông tin quan trọng
              <textarea rows="4" value={form.policy.importantInformation} onChange={(e) => setPolicy('importantInformation', e.target.value)} />
            </label>
          </div>
        </section>

        <div className="manager-form-actions">
          <Link className="btn btn-ghost dark" to="/manager/properties">Hủy</Link>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo chỗ nghỉ và thêm phòng'}
          </button>
        </div>
      </form>
    </main>
  )
}
