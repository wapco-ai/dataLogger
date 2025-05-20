
import React, { useState } from 'react'

function NodeModal({ location, onClose, onSave }) {
  const [nodeName, setNodeName] = useState('')
  const [nodeDescription, setNodeDescription] = useState('')
  const [nodeType, setNodeType] = useState('')
  
  // New state for transportation modes and gender
  const [transportModes, setTransportModes] = useState({
    wheelchair: false,
    electricVan: false,
    bicycle: false,
    walking: false
  })
  const [gender, setGender] = useState('')

  // Handle transport mode checkbox toggle
  const handleTransportModeChange = (mode) => {
    setTransportModes(prev => ({
      ...prev,
      [mode]: !prev[mode]
    }))
  }

  const handleSave = () => {
    if (!nodeName.trim()) {
      alert('نام گره را وارد کنید')
      return
    }

    // Collect selected transport modes
    const selectedTransportModes = Object.keys(transportModes)
      .filter(mode => transportModes[mode])

    const nodeData = {
      name: nodeName,
      description: nodeDescription,
      type: nodeType,
      latitude: location.lat,
      longitude: location.lng,
      timestamp: new Date().toISOString(),
      transportModes: selectedTransportModes,
      gender: gender
    }

    onSave(nodeData)
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
      <h2>ایجاد گره جدید</h2>
      
      {/* Node Name Input */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          نام گره:
          <input
            type="text"
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            placeholder="نام گره را وارد کنید"
            style={{ width: '100%', padding: '5px' }}
            required
          />
        </label>
      </div>

      {/* Description Textarea */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          توضیحات:
          <textarea
            value={nodeDescription}
            onChange={(e) => setNodeDescription(e.target.value)}
            placeholder="توضیحات گره را وارد کنید"
            style={{ width: '100%', padding: '5px', minHeight: '100px' }}
          />
        </label>
      </div>

      {/* Node Type Select */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          نوع گره:
          <select
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value)}
            style={{ width: '100%', padding: '5px' }}
          >
            <option value="">انتخاب نوع گره</option>
            <option value="checkpoint">نقطه بازرسی</option>
            <option value="landmark">نشانه</option>
            <option value="poi">نقطه دلخواه</option>
            <option value="other">سایر</option>
          </select>
        </label>
      </div>

      {/* Transport Modes Checkboxes */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          شیوه‌های حمل و نقل:
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {Object.keys(transportModes).map((mode) => (
              <label key={mode} style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={transportModes[mode]}
                  onChange={() => handleTransportModeChange(mode)}
                />
                {mode === 'wheelchair' && 'ویلچر'}
                {mode === 'electricVan' && 'ون برقی'}
                {mode === 'walking' && 'پیاده‌روی'}
              </label>
            ))}
          </div>
        </label>
      </div>

      {/* Gender Selection */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          جنسیت تردد:
          <div style={{ display: 'flex', gap: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="radio"
                name="gender"
                value="male"
                checked={gender === 'male'}
                onChange={() => setGender('male')}
              />
              مردانه
            </label>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="radio"
                name="gender"
                value="female"
                checked={gender === 'female'}
                onChange={() => setGender('female')}
              />
              زنانه
            </label>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="radio"
                name="gender"
                value="family"
                checked={gender === 'family'}
                onChange={() => setGender('family')}
              />
              خانوادگی
            </label>
          </div>
        </label>
      </div>

      {/* Save and Cancel Buttons */}
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

export default NodeModal
