import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CategoriesSection from './components/CategoriesSection';
import HowItWorksSection from './components/HowItWorksSection';
import TrendingEvents from './components/TrendingEvents';
import AboutSection from './components/AboutSection';
import FeaturedOrganizers from './components/FeaturedOrganizers';
import ForOrganizersBanner from './components/ForOrganizersBanner';
import HelpSection from './components/HelpSection';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className='landing-exact'>
      <Navbar />
      <main className='main-content'>
        <Hero />
        <CategoriesSection />
        <HowItWorksSection />
        <TrendingEvents />
        <AboutSection />
        <FeaturedOrganizers />
        <ForOrganizersBanner />
        <HelpSection />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default LandingPage;
