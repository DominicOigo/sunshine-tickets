import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Ticket, Calendar, ShieldCheck, Activity, Sparkles } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import './TierSwitching.css';

interface TriggerRule {
  id: string;
  sourceTier: string;
  targetTier: string;
  type: 'volume' | 'time';
  value: string;
  active: boolean;
}

export const TierSwitching: React.FC = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [rules, setRules] = useState<TriggerRule[]>([
    { id: '1', sourceTier: 'Early Bird', targetTier: 'General Admission', type: 'volume', value: '90% Sold (450/500)', active: true },
    { id: '2', sourceTier: 'General Admission', targetTier: 'VIP Exclusive', type: 'time', value: 'May 30, 2026 @ 12:00 AM', active: false },
  ]);

  // Wizard State
  const [sourceTier, setSourceTier] = useState('Early Bird');
  const [targetTier, setTargetTier] = useState('General Admission');
  const [triggerType, setTriggerType] = useState<'volume' | 'time'>('volume');
  const [triggerValue, setTriggerValue] = useState('80'); // 80% or Date
  const [triggerDate, setTriggerDate] = useState('2026-05-30T00:00');

  const handleCreateRule = () => {
    const valString = triggerType === 'volume' 
      ? `${triggerValue}% Sold` 
      : new Date(triggerDate).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });
      
    const newRule: TriggerRule = {
      id: Date.now().toString(),
      sourceTier,
      targetTier,
      type: triggerType,
      value: valString,
      active: true
    };

    setRules([newRule, ...rules]);
    setStep(1);
    // Reset wizard
    setSourceTier('Early Bird');
    setTargetTier('General Admission');
    setTriggerType('volume');
    setTriggerValue('80');
    toast('Tier-switching rule deployed successfully!', 'success');
  };

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  return (
    <div className="tier-switching-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Automated Tier-Switching</h2>
          <p className="panel-subtitle">Configure inventory triggers that transition ticket pricing automatically</p>
        </div>
      </div>

      <div className="tier-layout">
        {/* Rules List (Left side) */}
        <div className="glass-panel rules-list-panel">
          <div className="panel-section-header">
            <div className="header-left">
              <Activity size={20} className="cyan-neon" />
              <h3>Active Rules</h3>
            </div>
          </div>
          <p className="section-description">Rules currently monitored by the Auto-Switch engine.</p>

          <div className="rules-container">
            {rules.map((rule) => (
              <div 
                key={rule.id} 
                className={`rule-card ${rule.active ? 'active-rule' : ''}`}
              >
                <div className="rule-details">
                  <div className="rule-flow">
                    <span className="tier-pill src">{rule.sourceTier}</span>
                    <ArrowRight size={14} className="flow-arrow" />
                    <span className="tier-pill dest">{rule.targetTier}</span>
                  </div>
                  <div className="rule-condition">
                    {rule.type === 'volume' ? <Ticket size={14} className="rule-icon" /> : <Calendar size={14} className="rule-icon" />}
                    <span>{rule.value}</span>
                  </div>
                </div>
                <div 
                  className={`switch-toggle ${rule.active ? 'on' : ''}`}
                  onClick={() => toggleRule(rule.id)}
                >
                  <div className="switch-knob" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Wizard (Right side) */}
        <div className="glass-panel wizard-panel">
          <div className="panel-section-header">
            <div className="header-left">
              <Sparkles size={20} className="orange-neon" />
              <h3>Rule Configurator</h3>
            </div>
            <span className="wizard-step-badge">Step {step} of 3</span>
          </div>
          <p className="section-description">Define conditions to trigger dynamic inventory adjustments.</p>

          {/* Progress Indicators */}
          <div className="wizard-progress">
            <div className={`progress-dot ${step >= 1 ? 'active' : ''}`} />
            <div className={`progress-line ${step >= 2 ? 'active' : ''}`} />
            <div className={`progress-dot ${step >= 2 ? 'active' : ''}`} />
            <div className={`progress-line ${step >= 3 ? 'active' : ''}`} />
            <div className={`progress-dot ${step >= 3 ? 'active' : ''}`} />
          </div>

          <div className="wizard-body">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="step-content"
                >
                  <h4>1. Select Tier Flow</h4>
                  <p className="step-desc">Which pricing tier transitions into the next?</p>
                  
                  <div className="input-block">
                    <label>Source Ticket Tier</label>
                    <select value={sourceTier} onChange={(e) => setSourceTier(e.target.value)}>
                      <option value="Early Bird">Early Bird (KES 2,500)</option>
                      <option value="General Admission">General Admission (KES 3,000)</option>
                      <option value="VIP Exclusive">VIP Exclusive (KES 5,000)</option>
                    </select>
                  </div>

                  <div className="input-block">
                    <label>Target Ticket Tier</label>
                    <select value={targetTier} onChange={(e) => setTargetTier(e.target.value)}>
                      <option value="General Admission">General Admission (KES 3,000)</option>
                      <option value="VIP Exclusive">VIP Exclusive (KES 5,000)</option>
                      <option value="Late Gate">Late Gate (KES 4,000)</option>
                    </select>
                  </div>

                  <div className="wizard-footer">
                    <div />
                    <button className="btn-wizard" onClick={() => setStep(2)}>
                      <span>Next Step</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="step-content"
                >
                  <h4>2. Define Switch Condition</h4>
                  <p className="step-desc">Should the transition be triggered by ticket sales volume or a deadline?</p>

                  <div className="trigger-type-select">
                    <button 
                      type="button" 
                      className={`trigger-type-btn ${triggerType === 'volume' ? 'selected' : ''}`}
                      onClick={() => setTriggerType('volume')}
                    >
                      <Ticket size={24} />
                      <span>Volume Sold (%)</span>
                    </button>
                    <button 
                      type="button" 
                      className={`trigger-type-btn ${triggerType === 'time' ? 'selected' : ''}`}
                      onClick={() => setTriggerType('time')}
                    >
                      <Calendar size={24} />
                      <span>Date & Time</span>
                    </button>
                  </div>

                  {triggerType === 'volume' ? (
                    <div className="input-block">
                      <label>Sales Capacity Threshold (%)</label>
                      <div className="slider-wrapper">
                        <input 
                          type="range" 
                          min="50" 
                          max="100" 
                          value={triggerValue} 
                          onChange={(e) => setTriggerValue(e.target.value)} 
                        />
                        <span className="slider-value">{triggerValue}% Sold</span>
                      </div>
                    </div>
                  ) : (
                    <div className="input-block">
                      <label>Deadline Date & Time</label>
                      <input 
                        type="datetime-local" 
                        value={triggerDate} 
                        onChange={(e) => setTriggerDate(e.target.value)} 
                      />
                    </div>
                  )}

                  <div className="wizard-footer">
                    <button className="btn-wizard-back" onClick={() => setStep(1)}>
                      <ArrowLeft size={16} />
                      <span>Back</span>
                    </button>
                    <button className="btn-wizard" onClick={() => setStep(3)}>
                      <span>Next Step</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="step-content"
                >
                  <h4>3. Review and Activate</h4>
                  <p className="step-desc">Confirm the rule configuration before deploying it live.</p>

                  <div className="summary-card">
                    {/* Visual tier flow */}
                    <div className="summary-flow-visual">
                      <div className="summary-flow-tier src">
                        <Ticket size={14} />
                        <span>{sourceTier}</span>
                      </div>
                      <div className="summary-flow-connector">
                        <div className="summary-flow-line" />
                        <div className="summary-flow-trigger-label">
                          {triggerType === 'volume' ? `${triggerValue}%` : <Calendar size={11} />}
                        </div>
                        <div className="summary-flow-line" />
                        <ArrowRight size={16} className="summary-flow-arrow" />
                      </div>
                      <div className="summary-flow-tier dest">
                        <ShieldCheck size={14} />
                        <span>{targetTier}</span>
                      </div>
                    </div>
                    <div className="summary-row">
                      <span>Trigger Criteria</span>
                      <strong>{triggerType === 'volume' ? 'Volume Sold' : 'Time Deadline'}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Value / Trigger</span>
                      <strong className="cyan-text">
                        {triggerType === 'volume'
                          ? `${triggerValue}% Capacity`
                          : new Date(triggerDate).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                      </strong>
                    </div>
                  </div>

                  <div className="wizard-footer">
                    <button className="btn-wizard-back" onClick={() => setStep(2)}>
                      <ArrowLeft size={16} />
                      <span>Back</span>
                    </button>
                    <button className="btn-wizard btn-activate-neon" onClick={handleCreateRule}>
                      <ShieldCheck size={18} />
                      <span>Deploy Trigger</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TierSwitching;
