import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star, CheckCircle, Users } from 'lucide-react';
import { marketplaceService, FeaturedOrganizer } from '../../../lib/marketplaceService';
import './FeaturedOrganizers.css';

const FeaturedOrganizers: React.FC = () => {
  const [organizers, setOrganizers] = useState<FeaturedOrganizer[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    marketplaceService.getFeaturedOrganizers().then(setOrganizers).catch(() => {});
  }, []);

  if (!organizers.length) return null;

  return (
    <section id="organizers" className="featured-org-section">
      <div className="featured-org-section__container">
        <div className="featured-org-section__header">
          <div>
            <span className="featured-org-section__tag">Organizers</span>
            <h2 className="featured-org-section__title">Top Event Organizers</h2>
            <p className="featured-org-section__desc">Trusted event creators bringing you unforgettable experiences.</p>
          </div>
        </div>
        <div className="featured-org-section__scroll">
          <div className="featured-org-section__grid">
            {organizers.map(org => (
              <div key={org.id} className="featured-org-section__card" onClick={() => navigate(`/events?organizer=${org.id}`)}>
                <div className="featured-org-section__card-avatar">
                  {org.business_name?.charAt(0) || org.name.charAt(0)}
                </div>
                <div className="featured-org-section__card-info">
                  <h3 className="featured-org-section__card-name">
                    {org.business_name || org.name}
                    {org.is_verified && <CheckCircle size={14} className="verified" />}
                  </h3>
                  <div className="featured-org-section__card-stats">
                    <span><Users size={13} /> {org.total_tickets_sold} tickets</span>
                    <span><Star size={13} /> {org.avg_rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedOrganizers;
