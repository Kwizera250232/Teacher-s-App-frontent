import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function AlumniGroups() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  const loadGroups = async () => {
    try {
      const data = await api.get('/alumni/groups', token);
      setGroups(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGroups(); }, []);

  const handleCreate = async () => {
    if (!newGroup.name.trim()) return;
    setCreating(true);
    try {
      await api.post('/alumni/groups', newGroup, token);
      setShowCreate(false);
      setNewGroup({ name: '', description: '' });
      loadGroups();
    } catch (e) {
      alert(e.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading groups...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24 }}>U-Class Groups</h2>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Connect, share, and chat with alumni</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + New Group
        </button>
      </div>

      {groups.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, background: '#f8fafc', borderRadius: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <h3 style={{ margin: '0 0 8px' }}>No groups yet</h3>
          <p style={{ color: '#64748b' }}>Be the first to create a U-Class group!</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {groups.map((g) => (
          <div key={g.id} onClick={() => navigate(`/alumni/groups/${g.id}`)} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: 16, background: '#fff', borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'; }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: `hsl(${(g.id * 137) % 360}, 60%, 50%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, color: '#fff', fontWeight: 600,
            }}>
              {g.name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px', fontSize: 17 }}>{g.name}</h4>
              <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>{g.description || 'No description'}</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, color: '#94a3b8' }}>
                <span>👥 {g.member_count} members</span>
                {g.is_member && <span style={{ color: '#059669', fontWeight: 600 }}>✓ Joined</span>}
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/alumni/groups/${g.id}`); }}>
              {g.is_member ? 'Open' : 'View'}
            </button>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <h3 style={{ marginBottom: 16 }}>Create U-Class Group</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Group Name</label>
              <input
                type="text"
                placeholder="e.g. Class of 2024"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14 }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Description</label>
              <textarea
                placeholder="What is this group about?"
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={creating || !newGroup.name.trim()}>
                {creating ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
