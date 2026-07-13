import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Gift, Share2, Award, ArrowUpRight, DollarSign, Zap } from 'lucide-react';
import './FanLinkEngine.css';

interface Promoter {
  rank: number;
  name: string;
  referrals: number;
  salesVolume: string;
  rewardEarned: string;
}

interface ReferralReward {
  id: string;
  targetReferrals: number;
  rewardName: string;
  type: 'refund' | 'upgrade' | 'free';
  active: boolean;
}

export const FanLinkEngine: React.FC = () => {
  const [promoters] = useState<Promoter[]>([
    { rank: 1, name: 'Grace Wanjiku', referrals: 12, salesVolume: 'KES 24,000', rewardEarned: 'VVIP Deck Upgrade' },
    { rank: 2, name: 'Brian Kiprop', referrals: 8, salesVolume: 'KES 16,000', rewardEarned: '50% Ticket Refund' },
    { rank: 3, name: 'Asha Mohamed', referrals: 5, salesVolume: 'KES 10,000', rewardEarned: '15% Ticket Refund' },
    { rank: 4, name: 'David Ndwiga', referrals: 4, salesVolume: 'KES 8,000', rewardEarned: 'Free Drink Voucher' },
    { rank: 5, name: 'Elsy Chebet', referrals: 3, salesVolume: 'KES 6,000', rewardEarned: '15% Ticket Refund' },
  ]);

  const [rewards] = useState<ReferralReward[]>([
    { id: '1', targetReferrals: 3, rewardName: '15% Cashback Refund', type: 'refund', active: true },
    { id: '2', targetReferrals: 5, rewardName: '50% Cashback Refund', type: 'refund', active: true },
    { id: '3', targetReferrals: 8, rewardName: 'VIP Lounge Pass Upgrade', type: 'upgrade', active: true },
    { id: '4', targetReferrals: 12, rewardName: 'VVIP Cobalt Deck Upgrade', type: 'upgrade', active: true },
  ]);

  return (
    <div className="fan-link-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Fan-Link Referral Engine</h2>
          <p className="panel-subtitle">Reward loyal fans with automated refunds and ticket upgrades for driving sales</p>
        </div>
      </div>

      <div className="fan-stats-bar">
        {[
          { label: 'Total Referrals', value: '32', icon: <Users size={16} className="cyan-neon" /> },
          { label: 'Rewards Paid Out', value: 'KES 18,400', icon: <DollarSign size={16} className="orange-neon" /> },
          { label: 'Conversion Rate', value: '68%', icon: <Zap size={16} className="cyan-neon" /> },
          { label: 'Active Promoters', value: '5', icon: <Share2 size={16} className="orange-neon" /> },
        ].map((s, i) => (
          <div key={i} className="fan-stat-card">
            <div className="fan-stat-icon">{s.icon}</div>
            <div>
              <div className="fan-stat-value">{s.value}</div>
              <div className="fan-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="fan-grid">
        {/* Leaderboard (Left) */}
        <div className="glass-panel leaderboard-panel">
          <div className="panel-section-header">
            <div className="header-left">
              <Award size={20} className="cyan-neon" />
              <h3>Fan Leaderboard</h3>
            </div>
            <span className="sc-badge">Top Promoters</span>
          </div>
          <p className="section-description">Ranked by successful ticket purchases driven via unique fan links.</p>

          <div className="table-responsive">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Fan Name</th>
                  <th>Referrals</th>
                  <th>Sales Value</th>
                  <th>Reward Unlocked</th>
                </tr>
              </thead>
              <tbody>
                {promoters.map((p) => (
                  <tr key={p.rank} className={p.rank <= 3 ? `top-rank rank-${p.rank}` : ''}>
                    <td>
                      <span className="rank-number">{p.rank}</span>
                    </td>
                    <td>
                      <div className="promoter-profile">
                        <div className="avatar-letter">{p.name.charAt(0)}</div>
                        <strong>{p.name}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="referrals-count">{p.referrals}</span>
                    </td>
                    <td>{p.salesVolume}</td>
                    <td>
                      <span className="reward-pill">{p.rewardEarned}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rewards Config (Right) */}
        <div className="glass-panel rewards-panel">
          <div className="panel-section-header">
            <div className="header-left">
              <Gift size={20} className="orange-neon" />
              <h3>Reward Thresholds</h3>
            </div>
          </div>
          <p className="section-description">Automated milestones triggered upon successful referral counts.</p>

          <div className="rewards-list-container">
            {rewards.map((reward) => (
              <div key={reward.id} className="reward-card-row">
                <div className="reward-target-circle">
                  <span>{reward.targetReferrals}</span>
                  <small>FANS</small>
                </div>
                <div className="reward-row-info">
                  <h4>{reward.rewardName}</h4>
                  <p>Auto-{reward.type} applied directly to the promoter's billing account.</p>
                </div>
                <div className="reward-badge">
                  <Zap size={12} />
                  <span>ACTIVE</span>
                </div>
              </div>
            ))}
          </div>

          <div className="referral-sharing-preview">
            <div className="share-icon-box">
              <Share2 size={22} className="cyan-neon" />
            </div>
            <div>
              <h4>Promoter Preview URL</h4>
              <p className="url-preview">sunshinetickets.co.ke/ref?code=FAN-3918A</p>
            </div>
            <ArrowUpRight size={18} className="arrow-share" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FanLinkEngine;
