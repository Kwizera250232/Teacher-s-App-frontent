import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';

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
      setGroups(data.groups || []);
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

  return (
    <AlumniLayout showTopWriters={false}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>💬 Alumni Groups</h2>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Connect with alumni communities</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: '10px 20px',
            borderRadius: 24,
            border: 'none',
            background: '#667eea',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + New Group
        </button>
      </div>

      {/* Create Group Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: 28, width: '90%', maxWidth: 440,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 20 }}>Create New Group</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>Group Name</label>
              <input
                type="text"
                placeholder="e.g., Class of 2024"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 15 }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>Description</label>
              <textarea
                placeholder="What is this group about?"
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 15, minHeight: 80, resize: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreate(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleCreate} disabled={creating || !newGroup.name.trim()} className="btn btn-primary">
                {creating ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Groups List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>Loading groups...</div>
      ) : groups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <h3 style={{ margin: '0 0 8px' }}>No groups yet</h3>
          <p style={{ color: '#64748b' }}>Be the first to create a U-Class group!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {groups.map((g) => (
            <div key={g.id} onClick={() => navigate(`/alumni/groups/${g.id}`)} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: 20, background: '#fff', borderRadius: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'; }}
            >
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: `hsl(${(g.id * 137) % 360}, 60%, 50%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, color: '#fff', fontWeight: 700,
              }}>
                {g.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>{g.name}</h4>
                <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 8px' }}>{g.description || 'No description'}</p>
                <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#94a3b8' }}>
                  <span>👥 {g.member_count || 0} members</span>
                  {g.is_member && <span style={{ color: '#059669', fontWeight: 700 }}>✓ Joined</span>}
                </div>
              </div>
              <div style={{ fontSize: 24, color: '#94a3b8' }}>›</div>
            </div>
          ))}
        </div>
      )}
    </AlumniLayout>
  );
}
