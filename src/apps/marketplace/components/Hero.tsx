import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Zap, Tag, Headphones, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminService, HeroSlide } from '../../../lib/adminService';
import { scrollToHash } from '../../../lib/scrollTo';
import './Hero.css';

const DEFAULT_SLIDE: HeroSlide = {
  id: 'default',
  image_url: '',
  title: 'Discover Amazing Events',
  subtitle: 'From intimate gigs to world-class productions, find events that move you.',
  link_url: null,
  link_text: 'Explore Events',
  sort_order: 0,
  is_active: true,
  created_at: '',
  updated_at: '',
};

const Hero: React.FC = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    adminService.getPublicHeroSlides()
      .then(data => setSlides(data?.length ? data : [DEFAULT_SLIDE]))
      .catch(() => setSlides([DEFAULT_SLIDE]));
  }, []);

  const activeSlides = slides.filter(s => s.is_active);

  const goTo = useCallback((i: number) => {
    setDirection(i > current ? 1 : -1);
    setCurrent(i);
  }, [current]);

  const next = useCallback(() => {
    if (activeSlides.length < 2) return;
    setDirection(1);
    setCurrent(c => (c + 1) % activeSlides.length);
  }, [activeSlides.length]);

  const prev = useCallback(() => {
    if (activeSlides.length < 2) return;
    setDirection(-1);
    setCurrent(c => (c - 1 + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length]);

  useEffect(() => {
    if (activeSlides.length < 2) return;
    intervalRef.current = setInterval(next, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [next, activeSlides.length]);

  if (!activeSlides.length) return null;

  const slide = activeSlides[current];

  return (
    <section className='hero-carousel'>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={slide.id ?? current}
          custom={direction}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className='hero-carousel-slide'
          style={
            slide.image_url
              ? { backgroundImage: `url(${slide.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: 'linear-gradient(135deg, #0A0D14 0%, #111827 50%, #1E2538 100%)' }
          }
        >
          <div className='hero-carousel-overlay' />
          <div className='hero-carousel-content'>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className='hero-carousel-text'
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className='hero-carousel-title'
              >
                {slide.title}
              </motion.h1>
              {slide.subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                  className='hero-carousel-subtitle'
                >
                  {slide.subtitle}
                </motion.p>
              )}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className='hero-carousel-actions'
              >
                <button className='hero-carousel-btn' onClick={() => {
                  const url = slide.link_url || '/events';
                  if (url.startsWith('http')) window.open(url, '_blank');
                  else navigate(url);
                }}>
                  {slide.link_text} <ArrowRight size={20} />
                </button>
                <button className='hero-how-btn' onClick={() => {
                  if (window.location.pathname !== '/') {
                    navigate('/#how-it-works');
                  } else {
                    scrollToHash('#how-it-works');
                    window.history.replaceState(null, '', '#how-it-works');
                  }
                }}>
                  <Play size={16} /> How It Works
                </button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {activeSlides.length > 1 && (
        <>
          <button className='hero-carousel-arrow hero-carousel-arrow--left' onClick={prev}>
            <ChevronLeft size={28} />
          </button>
          <button className='hero-carousel-arrow hero-carousel-arrow--right' onClick={next}>
            <ChevronRight size={28} />
          </button>

          <div className='hero-carousel-dots'>
            {activeSlides.map((_, i) => (
              <button
                key={i}
                className={`hero-carousel-dot ${i === current ? 'active' : ''}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </>
      )}

      <div className='hero-carousel-trust'>
        {[
          { icon: <ShieldCheck size={18} />, l: 'Secure Booking', s: '100% Safe & Trusted' },
          { icon: <Zap size={18} />, l: 'Instant Delivery', s: 'E-tickets in Seconds' },
          { icon: <Tag size={18} />, l: 'No Hidden Fees', s: 'Transparent Pricing' },
          { icon: <Headphones size={18} />, l: '24/7 Support', s: 'We are Here to Help' },
        ].map((item, i) => (
          <div key={i} className='hero-trust-pill'>
            <div className='hero-trust-icon'>{item.icon}</div>
            <div className='hero-trust-text'>
              <strong>{item.l}</strong>
              <span>{item.s}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Hero;