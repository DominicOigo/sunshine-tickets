import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, UserPlus, MoreHorizontal, RefreshCw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../lib/adminService';
import './UsersPage.css';

type RoleFilter   = 'all' | 'Customer' | 'Organizer' | 'Admin';
type StatusFilter = 'all' | 'Active' | 'Suspended';

const UsersPage: React.FC<{ searchQuery?: string }> = ({ searchQuery = '' }) => {
  const { toast } = useToast();
  const [users,        setUsers]        = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState(searchQuery);
  const [roleFilter,   setRoleFilter]   = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page,         setPage]         = useState(1);
  const PER_PAGE = 8;

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers(200);
      setUsers(data);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
      (roleFilter   === 'all' || u.role   === roleFilter) &&
      (statusFilter === 'all' || u.status === statusFilter)
    );
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = [
    { label: 'Total Users',      value: users.length,                                    color: '#2E5BFF' },
    { label: 'Organizers',       value: users.filter(u => u.role === 'Organizer').length, color: '#FF7020' },
    { label: 'Customers',        value: users.filter(u => u.role === 'Customer').length,  color: '#00F2FE' },
    { label: 'Active',           value: users.filter(u => u.status === 'Active').length,  color: '#22C55E' },
  ];

  const toggleSuspend = async (u: any) => {
    try {
      const suspend = u.status === 'Active';
      await adminService.suspendUser(u.id, suspend);
      await adminService.log(suspend ? 'user.suspended' : 'user.unsuspended', u.name);
      toast(`${u.name} ${suspend ? 'suspended' : 'unsuspended'}.`, suspend ? 'info' : 'success');
      load();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  return (
    <div className="up-shell">
      <div className="up-heading">
        <div><h1>Users</h1><p>Manage all users on the platform.</p></div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="up-add-btn" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-gray)' }} onClick={load}>
            <RefreshCw size={14}/> Refresh
          </button>
          <button className="up-add-btn" onClick={() => toast('User invite feature coming soon.', 'info')}>
            <UserPlus size={14}/> Add User
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
          <input placeholder="Search users..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/>
        </div>
        <div className="up-filters">
          <select className="up-select" value={roleFilter} onChange={e => { setRoleFilter(e.target.value as RoleFilter); setPage(1); }}>
            <option value="all">All Roles</option>
            <option value="Customer">Customer</option>
            <option value="Organizer">Organizer</option>
            <option value="Admin">Admin</option>
          </select>
          <select className="up-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}>
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
          <button className="up-filter-btn"><Filter size={14}/> Filters</button>
        </div>
      </div>

      <div className="admin-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="admin-empty-row" style={{ padding: '3rem' }}>Loading users...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {paged.length === 0 && <tr><td colSpan={6} className="admin-empty-row">No users match your filters.</td></tr>}
                {paged.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <td>
                      <div className="up-user-cell">
                        <div className="up-avatar">{u.name.charAt(0)}</div>
                        <span className="admin-cell-title">{u.name}</span>
                      </div>
                    </td>
                    <td className="admin-td-muted">{u.email}</td>
                    <td>
                      <select
                        className="up-select"
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: 'var(--text-light)',
                          borderRadius: '8px',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.85rem',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                        value={u.role}
                        onChange={async (e) => {
                          const newRole = e.target.value;
                          try {
                            const dbRole = newRole === 'Organizer' ? 'organizer' : newRole === 'Admin' ? 'admin' : 'customer';
                            await adminService.changeUserRole(u.id, dbRole);
                            toast(`Updated ${u.name}'s role to ${newRole}.`, 'success');
                            load();
                          } catch (err: any) {
                            toast(err.message, 'error');
                          }
                        }}
                      >
                        <option value="Customer">Customer</option>
                        <option value="Organizer">Organizer</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`up-status-badge ${u.status === 'Active' ? 'active' : 'suspended'}`}>{u.status}</span>
                    </td>
                    <td className="admin-td-muted">{u.joined}</td>
                    <td>
                      <button className="up-action-btn" onClick={() => toggleSuspend(u)} title={u.status === 'Active' ? 'Suspend' : 'Unsuspend'}>
                        <MoreHorizontal size={14}/>
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="up-pagination">
          <span className="up-count">Showing {Math.min((page-1)*PER_PAGE+1, filtered.length)}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length} of {users.length} users</span>
          <div className="up-pages">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`up-page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
