import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, ShieldCheck, HelpCircle, Loader2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import './OrgSubPage.css';

interface TaxDoc {
  id: string;
  title: string;
  description: string;
  type: string;
  year: string;
}

export const OrgTaxDocsPage: React.FC = () => {
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const docs: TaxDoc[] = [
    { id: '1', title: 'Form 1099-K (Merchant Card and Third Party Payments)', description: 'Official IRS reporting for gross payments received from ticket sales exceeding statutory thresholds.', type: 'Tax Form', year: '2025' },
    { id: '2', title: 'Sunshine Tickets Annual Earnings Statement', description: 'Comprehensive ledger summary of all ticket sales, processing fees, and payouts for tax filing purposes.', type: 'Financial Statement', year: '2025' },
    { id: '3', title: 'Withholding Tax & VAT Certificate', description: 'Withholding statement and VAT invoices detailing platform fees deducted.', type: 'VAT Invoice Summary', year: '2025' },
    { id: '4', title: 'Form 1099-K (Merchant Card and Third Party Payments)', description: 'Historical IRS reporting for payments processed.', type: 'Tax Form', year: '2024' },
    { id: '5', title: 'Sunshine Tickets Annual Earnings Statement', description: 'Historical comprehensive earnings summary.', type: 'Financial Statement', year: '2024' },
  ];

  const handleDownload = (id: string, name: string) => {
    setDownloadingId(id);
    setTimeout(() => {
      setDownloadingId(null);
      toast(`Simulated PDF download complete: ${name}.pdf`, 'success');
    }, 1500);
  };

  return (
    <div className="osp-shell">
      <div className="osp-heading">
        <div>
          <h1>Tax Documents &amp; Invoices</h1>
          <p>Retrieve government-compliant tax statements and annual platform invoices.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Document List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {docs.map((d, i) => (
            <motion.div
              key={d.id}
              className="osp-glass-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.25rem',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', minWidth: 0 }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: 'rgba(0,242,254,0.1)',
                    border: '1px solid rgba(0,242,254,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00F2FE',
                    flexShrink: 0
                  }}
                >
                  <FileText size={18} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', color: 'white', fontWeight: 700 }}>
                      {d.year}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#00F2FE', fontWeight: 800 }}>{d.type}</span>
                  </div>
                  <h3 style={{ margin: '4px 0 2px', color: 'white', fontSize: '0.88rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {d.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-gray)', lineHeight: '1.4' }}>
                    {d.description}
                  </p>
                </div>
              </div>

              <button
                className="osp-export-btn"
                disabled={downloadingId !== null}
                onClick={() => handleDownload(d.id, d.title)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
              >
                {downloadingId === d.id ? (
                  <Loader2 size={13} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Download size={13} />
                )}
                {downloadingId === d.id ? 'Generating...' : 'Download PDF'}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Right Info Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="osp-glass-panel" style={{ background: '#0F1014', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22C55E', marginBottom: '0.75rem' }}>
              <ShieldCheck size={16} />
              <strong style={{ fontSize: '0.85rem' }}>Tax Compliance</strong>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-gray)', margin: 0, lineHeight: '1.5' }}>
              Sunshine Tickets generates IRS Form 1099-K automatically for all registered organizers who exceed US/Kenya statutory transaction thresholds. For local tax returns, use the Annual Earnings Statement to file withholding tax returns.
            </p>
          </div>

          <div className="osp-glass-panel" style={{ background: '#0F1014', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              <HelpCircle size={16} />
              <strong style={{ fontSize: '0.85rem' }}>Need Help?</strong>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-gray)', margin: 0, lineHeight: '1.5' }}>
              If you require a custom tax certificate or have questions regarding withholding adjustments, please contact our merchant support team at <a href="mailto:support@sunshinetickets.co.ke" style={{ color: '#FF9500', fontWeight: 'bold' }}>support@sunshinetickets.co.ke</a>.
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
export default OrgTaxDocsPage;
