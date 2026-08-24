import { useState } from 'react';
import { api } from '../api';

export default function TransferStudentsModal({ isOpen, onClose, classId, token, selectedIds = [], onSuccess }) {
  const [code, setCode] = useState('');
  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const selectedCount = selectedIds.length;

  const lookupClass = async () => {
    if (!code.trim()) return;
    setPreviewing(true);
    setError('');
    setTarget(null);
    try {
      const res = await api.get(`/classes/by-code/${code.trim().toUpperCase()}`, token);
      setTarget(res);
    } catch (e) {
      setError(e.message || 'Class not found. Check the code.');
    } finally {
      setPreviewing(false);
    }
  };

  const transfer = async () => {
    if (!target) return;
    if (!selectedCount) {
      setError('No students selected. Select students first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post(
        `/classes/${classId}/transfer`,
        { class_code: target.class_code, student_ids: selectedIds },
        token
      );
      onSuccess?.(res.message);
      setCode('');
      setTarget(null);
      onClose();
    } catch (e) {
      setError(e.message || 'Transfer failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 20,
          padding: '1.5rem',
          minWidth: 280,
          maxWidth: 400,
          width: '90%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        <h3 style={{ margin: '0 0 0.5rem', fontSize: 18, fontWeight: 700 }}>Transfer students</h3>
        <p style={{ margin: '0 0 1rem', fontSize: 14, color: '#4b5563' }}>
          {selectedCount > 0 ? `${selectedCount} student(s) selected.` : 'No students selected. Please select students first.'}
        </p>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
          Target class code
        </label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter class code"
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '2px solid #e8e8e8',
              borderRadius: 8,
              fontSize: 14,
              textTransform: 'uppercase',
            }}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={lookupClass}
            disabled={previewing || !code.trim()}
          >
            {previewing ? '…' : 'Find'}
          </button>
        </div>

        {error && <p style={{ color: '#dc2626', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}

        {target && (
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <p style={{ margin: 0, fontWeight: 700, color: '#166534' }}>{target.name}</p>
            {target.subject && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#166534' }}>{target.subject}</p>}
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#166534' }}>Code: {target.class_code}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={transfer}
            disabled={loading || !target || !selectedCount}
          >
            {loading ? 'Transferring…' : 'Transfer'}
          </button>
        </div>
      </div>
    </div>
  );
}
