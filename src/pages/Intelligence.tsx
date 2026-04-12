import * as React from "react";
import { PageLayout } from "@/src/components/layout/PageLayout";
import { MarketIntelligence as MarketIntelligenceSection } from "@/src/components/sections/MarketIntelligence";

export function Intelligence() {
  return (
    <PageLayout title="Market Intelligence" subtitle="Strategic insights and real-time data for global commodity markets.">
      <MarketIntelligenceSection />
      <div className="container mx-auto px-4 py-12">
        <div className="prose prose-invert max-w-none">
          <h2 className="text-white font-serif text-3xl mb-6">Strategic Analysis</h2>
          <p className="text-gray-400 mb-8">
            Our intelligence division provides deep-dive analysis into geopolitical risks, supply chain vulnerabilities, 
            and market fluctuations. We leverage a global network of on-the-ground sources to provide our clients with 
            the information they need to make informed decisions in volatile environments.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
