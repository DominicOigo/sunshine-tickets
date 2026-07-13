import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles?: ('customer' | 'organizer' | 'admin')[];
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children, allowedRoles }) => {
  const { user, loading, openAuthModal } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return; // Do not redirect while loading the session

    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', location.pathname + location.search);
      const isOnlyAdmin = allowedRoles && allowedRoles.length === 1 && allowedRoles.includes('admin');
      const isBizRoute = allowedRoles && (allowedRoles.includes('organizer') || allowedRoles.includes('admin')) && !allowedRoles.includes('customer');
      if (isOnlyAdmin) {
        navigate('/', { replace: true });
        openAuthModal('signin', 'customer', true);
      } else if (isBizRoute) {
        navigate('/', { replace: true });
        openAuthModal('signup', 'organizer');
      } else {
        navigate('/', { replace: true });
        openAuthModal('signin');
      }
    } else if (allowedRoles && !allowedRoles.includes(user.role)) {
      const isBizRoute = allowedRoles.includes('organizer') || allowedRoles.includes('admin');
      if (isBizRoute) {
        toast('You need an Organizer account to access this area. Please sign out of your Customer account first.', 'error');
        navigate('/', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, loading, allowedRoles]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0A0A0A', color: 'white', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '3px solid rgba(255,149,0,0.1)', borderTop: '3px solid #FF9500', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <span>Loading Sunshine Tickets...</span>
        </div>
      </div>
    );
  }

  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) return null;
  return <>{children}</>;
};

export default RequireAuth;
