import React from 'react';
import LandingHero from '../../components/landing/LandingHero';
import LandingProblemSolution from '../../components/landing/LandingProblemSolution';
import LandingFeatures from '../../components/landing/LandingFeatures';
import LandingHowItWorks from '../../components/landing/LandingHowItWorks';
import LandingPricing from '../../components/landing/LandingPricing';
import LandingBenefits from '../../components/landing/LandingBenefits';
import LandingTestimonials from '../../components/landing/LandingTestimonials';
import LandingCTAFinal from '../../components/landing/LandingCTAFinal';
import LandingFooter from '../../components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <main className="landing-page">
      <LandingHero />
      <LandingProblemSolution />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingPricing />
      <LandingBenefits />
      <LandingTestimonials />
      <LandingCTAFinal />
      <LandingFooter />
    </main>
  );
}
