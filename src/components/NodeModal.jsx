import React, { useState } from 'react';
// import './styles.css'; // Ensure styles are imported

function NodeModal({ location, onClose, onSave }) {
  const [nodeName, setNodeName] = useState('');
  const [nodeDescription, setNodeDescription] = useState('');
  const [nodeType, setNodeType] = useState('');
  const [transportModes, setTransportModes] = useState({
    wheelchair: false,
    electricVan: false,
    walking: false,
  });
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');

  const handleTransportModeChange = (mode) => {
    setTransportModes((prev) => ({
      ...prev,
      [mode]: !prev[mode],
    }));
  };

  const handleSave = () => {
    if (!nodeName.trim()) {
      setError('نام گره را وارد کنید');
      return;
    }
    setError('');
    const selectedTransportModes = Object.keys(transportModes).filter((mode) => transportModes[mode]);

    const nodeData = {
      name: nodeName,
      description: nodeDescription,
      type: nodeType,
      latitude: location.lat,
      longitude: location.lng,
      timestamp: new Date().toISOString(),
      transportModes: selectedTransportModes,
      gender: gender,
    };

    onSave(nodeData);
    onClose();
  };

  return (
    <div className="modal-container">
      <h2>ایجاد گره جدید</h2>
      {error && <p className="error-message">{error}</p>}
      <div className="input-group">
        <label>
          نام گره:
          <input
            type="text"
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            placeholder="نام گره را وارد کنید"
            required
          />
        </label>
      </div>
      <div className="input-group">
        <label>
          توضیحات:
          <textarea
            value={nodeDescription}
            onChange={(e) => setNodeDescription(e.target.value)}
            placeholder="توضیحات گره را وارد کنید"
          />
        </label>
      </div>
      <div className="input-group">
        <label>
          نوع گره:
          <select
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value)}
          >
            <option value="">انتخاب نوع گره</option>
            <option value="checkpoint">نقطه بازرسی</option>
            <option value="landmark">نشانه</option>
            <option value="poi">نقطه دلخواه</option>
            <option value="other">سایر</option>
          </select>
        </label>
      </div>
      <div className="input-group">
        <label>شیوه‌های حمل و نقل:</label>
        <div className="checkbox-group">
          {Object.keys(transportModes).map((mode) => (
            <label key={mode}>
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
      </div>
      <div className="input-group">
        <label>جنسیت تردد:</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="gender"
              value="male"
              checked={gender === 'male'}
              onChange={() => setGender('male')}
            />
            مردانه
          </label>
          <label>
            <input
              type="radio"
              name="gender"
              value="female"
              checked={gender === 'female'}
              onChange={() => setGender('female')}
            />
            زنانه
          </label>
          <label>
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
      </div>
      <div className="button-group">
        <button onClick={handleSave} className="save-button">ذخیره</button>
        <button onClick={onClose} className="cancel-button">انصراف</button>
      </div>
    </div>
  );
}

export default NodeModal;