import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Users, Mail, User, Trash2, X, PlusCircle } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { organizerService } from '../../../lib/organizerService';
import './OrgSubPage.css';

export const OrgTeamPage: React.FC = () => {
  const { toast } = useToast();
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add state
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Editor');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await organizerService.getTeamMembers();
      setTeam(data ?? []);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string, nameStr: string) => {
    if (window.confirm(`Are you sure you want to remove team member "${nameStr}"?`)) {
      try {
        await organizerService.deleteTeamMember(id);
        toast(`Removed team member: ${nameStr}`, 'success');
        load();
      } catch (e: any) {
        toast(e.message, 'error');
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !email.includes('@')) {
      toast('Please enter a valid name and email address.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await organizerService.addTeamMember(name.trim(), email.trim(), role);
      toast('Team member added successfully!', 'success');
      setName('');
      setEmail('');
      setRole('Editor');
      setShowAddForm(false);
      load();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = team.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="osp-shell">
      <div className="osp-heading">
        <div>
          <h1>Team Members</h1>
          <p>Collaborate with others. Manage access and roles for your organization staff.</p>
        </div>
        <button className="osp-primary-btn" onClick={() => setShowAddForm(true)}>
          <Plus size={15} /> Add Team Member
        </button>
      </div>

      <div className="osp-toolbar">
        <div className="osp-search">
          <Search size={14} />
          <input
            placeholder="Search team members by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Add team member modal overlay */}
      <AnimatePresence>
        {showAddForm && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '2rem'
            }}
          >
            <motion.div
              className="osp-glass-panel"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                width: '100%',
                maxWidth: '450px',
                background: '#0F1014',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white', fontWeight: 800 }}>Add Team Member</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  style={{
                    color: 'var(--text-gray)',
                    padding: '4px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-gray)' }}>FULL NAME</label>
                  <div className="osp-search" style={{ maxWidth: 'none' }}>
                    <User size={14} />
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-gray)' }}>EMAIL ADDRESS</label>
                  <div className="osp-search" style={{ maxWidth: 'none' }}>
                    <Mail size={14} />
                    <input
                      type="email"
                      placeholder="e.g. johndoe@gmail.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-gray)' }}>ROLE / ACCESS LEVEL</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '0.6rem 1rem',
                      borderRadius: '8px',
                      color: 'white',
                      fontWeight: 'bold',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Editor" style={{ background: '#0F1014' }}>Editor (Full edit access)</option>
                    <option value="Viewer" style={{ background: '#0F1014' }}>Viewer (Read-only access)</option>
                    <option value="Scanner" style={{ background: '#0F1014' }}>Scanner (Only check-in app access)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="osp-primary-btn"
                  style={{ marginTop: '0.5rem', width: '100%', display: 'flex', justifyContent: 'center' }}
                >
                  {submitting ? 'Adding...' : 'Add Team Member'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="osp-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="osp-empty" style={{ padding: '4rem' }}>Loading team members...</div>
        ) : (
          <div className="osp-table-wrap">
            <table className="osp-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="osp-empty">No team members added yet. Add staff above!</td>
                  </tr>
                ) : (
                  filtered.map((t, i) => (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <td>
                        <div className="osp-user-cell">
                          <div className="osp-avatar">{t.name.charAt(0)}</div>
                          <div>
                            <span className="osp-cell-title">{t.name}</span>
                            <span className="osp-cell-sub">{t.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className="osp-status-badge"
                          style={{
                            color: t.role === 'Editor' ? '#FF9500' : t.role === 'Scanner' ? '#00F2FE' : '#888',
                            background: t.role === 'Editor' ? 'rgba(255,149,0,0.1)' : t.role === 'Scanner' ? 'rgba(0,242,254,0.1)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${t.role === 'Editor' ? 'rgba(255,149,0,0.2)' : t.role === 'Scanner' ? 'rgba(0,242,254,0.2)' : 'rgba(255,255,255,0.08)'}`
                          }}
                        >
                          {t.role}
                        </span>
                      </td>
                      <td className="osp-td-muted">
                        {new Date(t.created_at).toLocaleDateString('en-KE')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            className="osp-action-btn"
                            title="Remove Member"
                            onClick={() => handleDelete(t.id, t.name)}
                            style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.1)' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default OrgTeamPage;
