import { Wrench } from 'lucide-react'

const styles = {
  shell: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    padding: '2rem',
    textAlign: 'center' as const,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'rgba(255,149,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  h1: {
    fontSize: '2rem',
    fontWeight: 800,
    color: 'white',
    margin: '0 0 0.75rem',
  },
  p: {
    fontSize: '1rem',
    color: 'var(--text-gray)',
    maxWidth: 480,
    lineHeight: 1.6,
    margin: '0 0 0.25rem',
  },
  email: {
    color: 'var(--primary-gold)',
    textDecoration: 'none',
  },
}

const MaintenancePage: React.FC = () => (
  <div style={styles.shell}>
    <div style={styles.icon}>
      <Wrench size={36} style={{ color: 'var(--primary-gold)' }} />
    </div>
    <h1 style={styles.h1}>Under Maintenance</h1>
    <p style={styles.p}>
      We are currently performing scheduled maintenance to improve your experience.
    </p>
    <p style={styles.p}>
      Please check back shortly. If you need immediate assistance, contact us at{' '}
      <a href="mailto:support@sunshinetickets.co.ke" style={styles.email}>
        support@sunshinetickets.co.ke
      </a>
    </p>
  </div>
)

export default MaintenancePage
