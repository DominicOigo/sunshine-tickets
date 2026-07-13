import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketplaceService, Category } from '../../../lib/marketplaceService';
import './CategoriesSection.css';

const ICON_MAP: Record<string, string> = {
  music: '🎵', concert: '🎤', festival: '🎪', theatre: '🎭',
  comedy: '😂', sports: '⚽', workshop: '📚', food: '🍽️',
  nightlife: '🌙', art: '🎨', family: '👨‍👩‍👧‍👦', charity: '❤️',
};

const CategoriesSection: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    marketplaceService.getCategories().then(setCategories).catch(() => {});
  }, []);

  if (!categories.length) return null;

  return (
    <section id="categories" className="categories-section">
      <div className="categories-section__container">
        <div className="categories-section__header">
          <span className="categories-section__tag">Categories</span>
          <h2 className="categories-section__title">Browse by Category</h2>
          <p className="categories-section__desc">Find your perfect experience across hundreds of event categories</p>
        </div>
        <div className="categories-section__grid-wrap">
          <div className="categories-section__grid">
            {categories.map(cat => (
              <div key={cat.id} className="categories-section__card" onClick={() => navigate(`/events?category=${cat.slug}`)}>
                <div className="categories-section__card-icon">
                  {ICON_MAP[cat.slug] || '📅'}
                </div>
                <span className="categories-section__card-name">{cat.name}</span>
                <span className="categories-section__card-count">{cat.event_count} events</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
