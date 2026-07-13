import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Tag, X, RefreshCw, Edit3, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../lib/adminService';
import './UsersPage.css';

const CategoriesPage: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', icon: '' });
  const PER_PAGE = 8;

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.getCategories();
      setCategories(data ?? []);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalEvents = categories.reduce((s, c) => s + (c.event_count || 0), 0);

  const stats = [
    { label: 'Total Categories', value: categories.length, color: '#FF7020' },
    { label: 'Total Events',     value: totalEvents,        color: '#2E5BFF' },
    { label: 'Avg Events/Cat',   value: categories.length ? Math.round(totalEvents / categories.length) : 0, color: '#00F2FE' },
    { label: 'With Events',      value: categories.filter(c => (c.event_count || 0) > 0).length, color: '#22C55E' },
  ];

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', slug: '', icon: '' });
    setShowModal(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, icon: c.icon || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast('Name and slug are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await adminService.updateCategory(editing.id, {
          name: form.name.trim(),
          slug: form.slug.trim(),
          icon: form.icon.trim() || undefined,
        });
        toast('Category updated.', 'success');
      } else {
        await adminService.createCategory({
          name: form.name.trim(),
          slug: form.slug.trim(),
          icon: form.icon.trim() || undefined,
        });
        toast('Category created.', 'success');
      }
      setShowModal(false);
      setEditing(null);
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"? This action cannot be undone.`)) return;
    try {
      await adminService.deleteCategory(id);
      toast(`Category "${name}" deleted.`, 'success');
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  return (
    <div className="up-shell">
      <div className="up-heading">
        <div><h1>Categories</h1><p>Manage event categories used across the platform.</p></div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="up-add-btn"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-gray)' }}
            onClick={load}
          >
            <RefreshCw size={14}/> Refresh
          </button>
          <button className="up-add-btn" onClick={openNew}>
            <Plus size={14}/> Add Category
          </button>
        </div>
      </div>

      <div className="up-stats">
        {stats.map((s, i) => (
          <div key={i} className="admin-glass-panel up-stat-card">
            <span className="up-stat-label">{s.label}</span>
            <span className="up-stat-val" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="up-toolbar">
        <div className="up-search">
          <Search size={14}/>
          <input
            placeholder="Search categories..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Inline Add/Edit Modal */}
      {showModal && (
        <motion.div
          className="admin-glass-panel"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '1.5rem', padding: '1.5rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: 'white', fontWeight: 800, fontSize: '0.95rem', margin: 0 }}>
              {editing ? 'Edit Category' : 'New Category'}
            </h3>
            <button
              onClick={() => { setShowModal(false); setEditing(null); }}
              style={{
                color: 'var(--text-gray)', padding: '4px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={16}/>
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Name</label>
              <input
                className="admin-form-input"
                value={form.name}
                onChange={e => {
                  const name = e.target.value;
                  setForm(f => ({
                    ...f,
                    name,
                    slug: editing ? f.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                  }));
                }}
                placeholder="e.g. Music Concert"
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Slug</label>
              <input
                className="admin-form-input"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="e.g. music-concert"
              />
            </div>
            <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="admin-form-label">Icon (optional)</label>
              <input
                className="admin-form-input"
                value={form.icon}
                onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                placeholder="Icon name or URL"
              />
            </div>
          </div>
          <div style={{
            display: 'flex', gap: '0.75rem', marginTop: '1.25rem',
            paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)'
          }}>
            <button className="up-add-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : (editing ? 'Update Category' : 'Create Category')}
            </button>
            <button
              className="admin-btn-ghost"
              onClick={() => { setShowModal(false); setEditing(null); }}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      <div className="admin-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="admin-empty-row" style={{ padding: '3rem' }}>Loading categories...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>Name</th>
                  <th style={{ width: '25%' }}>Slug</th>
                  <th style={{ width: '5%' }}>Icon</th>
                  <th style={{ width: '10%' }}>Events</th>
                  <th style={{ width: '10%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 && (
                  <tr><td colSpan={5} className="admin-empty-row">No categories found.</td></tr>
                )}
                {paged.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <td>
                      <div className="admin-event-cell">
                        {c.icon ? (
                          <span
                            style={{
                              width: 32, height: 32, borderRadius: 7,
                              background: 'rgba(255,112,32,0.1)',
                              border: '1px solid rgba(255,112,32,0.2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '1rem', flexShrink: 0
                            }}
                          >
                            {c.icon.startsWith('http') ? (
                              <img src={c.icon} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                            ) : (
                              <Tag size={14} style={{ color: '#FF7020' }} />
                            )}
                          </span>
                        ) : (
                          <span
                            style={{
                              width: 32, height: 32, borderRadius: 7,
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <Tag size={14} style={{ color: 'var(--text-muted)' }} />
                          </span>
                        )}
                        <span className="admin-cell-title">{c.name}</span>
                      </div>
                    </td>
                    <td className="admin-td-muted">
                      <span style={{ fontFamily: 'monospace', color: '#FF9500', fontWeight: 700 }}>{c.slug}</span>
                    </td>
                    <td className="admin-td-muted">{c.icon || '—'}</td>
                    <td>
                      <span style={{
                        fontSize: '0.82rem', fontWeight: 800, color: '#00F2FE'
                      }}>
                        {c.event_count ?? 0}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          className="admin-act-view"
                          onClick={() => openEdit(c)}
                          title="Edit category"
                        >
                          <Edit3 size={12}/>
                        </button>
                        <button
                          className="admin-act-reject"
                          onClick={() => handleDelete(c.id, c.name)}
                          title="Delete category"
                        >
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="up-pagination">
          <span className="up-count">
            Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} of {categories.length} categories
          </span>
          <div className="up-pages">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`up-page-btn ${p === page ? 'active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
