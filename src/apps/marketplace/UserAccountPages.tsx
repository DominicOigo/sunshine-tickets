import React from 'react';
import { Ticket, User, Heart, ChevronRight } from 'lucide-react';
import Navbar from './components/Navbar';
import { useAuth } from '../../context/AuthContext';

const AccountLayout: React.FC<{ children: React.ReactNode, title: string }> = ({ children, title }) => (
  <div style={{ minHeight: '100vh', background: '#07080A' }}>
    <Navbar />
    <main style={{ paddingTop: '100px', padding: '2rem 5vw 10rem 5vw', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', marginBottom: '2rem' }}>{title}</h1>
      {children}
    </main>
  </div>
);

export const MyTicketsPage: React.FC = () => (
  <AccountLayout title="My Tickets">
    <div style={{ background: '#0F1014', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1.5rem', padding: '3rem', textAlign: 'center' }}>
      <Ticket size={48} style={{ color: '#A0A1A5', marginBottom: '1rem' }} />
      <h3 style={{ color: 'white', fontSize: '1.2rem' }}>No tickets yet</h3>
      <p style={{ color: '#666', margin: '0.5rem 0 1.5rem' }}>Your purchased event tickets will appear here.</p>
    </div>
  </AccountLayout>
);

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  return (
    <AccountLayout title="Account Settings">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ background: '#0F1014', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1.5rem', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-orange-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 800 }}>
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 style={{ color: 'white', margin: 0 }}>{user?.name}</h4>
            <p style={{ color: '#A0A1A5', margin: 0, fontSize: '0.85rem' }}>{user?.email}</p>
          </div>
        </div>

        <div style={{ background: '#0F1014', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1.5rem', overflow: 'hidden' }}>
          {[
            { icon: <User size={18} />, label: "Personal Info" },
            { icon: <Ticket size={18} />, label: "My Orders" },
            { icon: <Heart size={18} />, label: "Wishlist" },
          ].map((item, i) => (
            <div key={i} style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i === 2 ? 'none' : '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white' }}>
                {item.icon} <span style={{ fontWeight: 600 }}>{item.label}</span>
              </div>
              <ChevronRight size={16} style={{ color: '#666' }} />
            </div>
          ))}
        </div>
      </div>
    </AccountLayout>
  );
};
