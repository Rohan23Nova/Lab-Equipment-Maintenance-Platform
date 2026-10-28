import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Hero } from '@/components/landing/Hero';
import { ProductPreview } from '@/components/landing/ProductPreview';
import { Features } from '@/components/landing/Features';
import { Workflow } from '@/components/landing/Workflow';
import { ArchitectureHighlight } from '@/components/landing/ArchitectureHighlight';
import { CtaSection } from '@/components/landing/CtaSection';
import { Footer } from '@/components/layout/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <ProductPreview />
        <Features />
        <Workflow />
        <ArchitectureHighlight />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
