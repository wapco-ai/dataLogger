
import React, { useState } from 'react'

function PathSaveModal({ onSave, onClose, pathCoordinates }) {
  const [pathName, setPathName] = useState('')
  const [pathDescription, setPathDescription] = useState('')
  const [pathType, setPathType] = useState('')

  const handleSave = () => {
    if (!pathName.trim()) {
      alert('نام مسیر را وارد کنید')
      return
    }

    const pathData = {
      name: pathName,
      description: pathDescription,
      type: pathType,
      coordinates: pathCoordinates,
      timestamp: new Date().toISOString()
    }

    onSave(pathData)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      zIndex: 1000,
      width: '90%',
      maxWidth: '400px'
    }}>
      <h2>ذخیره‌سازی مسیر</h2>
      <div style={{ marginBottom: '10px' }}>
        <label>نام مسیر:</label>
        <input
          type="text"
          value={pathName}
          onChange={(e) => setPathName(e.target.value)}
          placeholder="نام مسیر را وارد کنید"
          style={{ width: '100%', padding: '5px' }}
          required
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>توضیحات:</label>
        <textarea
          value={pathDescription}
          onChange={(e) => setPathDescription(e.target.value)}
          placeholder="توضیحات مسیر را وارد کنید"
          style={{ width: '100%', padding: '5px', minHeight: '100px' }}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>نوع مسیر:</label>
        <select
          value={pathType}
          onChange={(e) => setPathType(e.target.value)}
          style={{ width: '100%', padding: '5px' }}
        >
          <option value="">انتخاب نوع مسیر</option>
          <option value="hiking">پیاده‌روی</option>
          <option value="cycling">دوچرخه‌سواری</option>
          <option value="driving">رانندگی</option>
          <option value="other">سایر</option>
        </select>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={handleSave}
          style={{
            padding: '10px',
            backgroundColor: 'green',
            color: 'white',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          ذخیره
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '10px',
            backgroundColor: 'red',
            color: 'white',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          انصراف
        </button>
      </div>
    </div>
  )
}

export default PathSaveModal
