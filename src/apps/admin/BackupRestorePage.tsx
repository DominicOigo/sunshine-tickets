import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HardDrive, Download, Upload, Trash2, Plus, RefreshCw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../lib/adminService';

const formatSize = (bytes: number): string => {
  if (!bytes && bytes !== 0) return '—';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
};

const BackupRestorePage: React.FC = () => {
  const { toast } = useToast();
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.getBackups();
      setBackups(data ?? []);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await adminService.createBackup();
      toast(res.message || 'Backup created successfully.', 'success');
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (filename: string) => {
    if (!window.confirm(`Are you sure you want to restore "${filename}"? This will replace the current database.`)) return;
    setRestoring(filename);
    try {
      const res = await adminService.restoreBackup(filename);
      toast(res.message || 'Database restored successfully.', 'success');
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (name: string) => {
    if (!window.confirm(`Delete backup "${name}"? This cannot be undone.`)) return;
    try {
      await adminService.deleteBackup(name);
      toast('Backup deleted.', 'success');
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  return (
    <div className="up-shell">
      <div className="up-heading">
        <div>
          <h1>Backup & Restore</h1>
          <p>Create, restore, and manage database backups.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="up-add-btn"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-gray)' }}
            onClick={load}
            disabled={loading}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="up-add-btn" onClick={handleCreate} disabled={creating}>
            {creating ? <RefreshCw size={14} className="spinner" /> : <Plus size={14} />}
            {creating ? ' Creating...' : ' Create Backup'}
          </button>
        </div>
      </div>

      <div className="admin-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="admin-empty-row" style={{ padding: '3rem', textAlign: 'center' }}>Loading backups...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Filename</th><th>Size</th><th>Created At</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {backups.length === 0 && (
                  <tr><td colSpan={4} className="admin-empty-row" style={{ textAlign: 'center', padding: '2.5rem' }}>No backups yet.</td></tr>
                )}
                {backups.map((b, i) => (
                  <motion.tr key={b.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <td>
                      <span className="admin-cell-title">
                        <HardDrive size={14} style={{ marginRight: '0.5rem', opacity: 0.5, verticalAlign: 'middle' }} />
                        {b.name}
                      </span>
                    </td>
                    <td className="admin-td-muted">{formatSize(b.size)}</td>
                    <td className="admin-td-muted">{new Date(b.created_at).toLocaleString()}</td>
                    <td>
                      <button
                        className="up-action-btn"
                        onClick={() => handleRestore(b.name)}
                        disabled={restoring === b.name}
                        title="Restore"
                      >
                        {restoring === b.name ? <RefreshCw size={14} className="spinner" /> : <Download size={14} />}
                      </button>
                      <button
                        className="up-action-btn"
                        onClick={() => handleDelete(b.name)}
                        title="Delete"
                        style={{ marginLeft: '0.25rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupRestorePage;
