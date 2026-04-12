import * as React from "react";
import { PageLayout } from "@/src/components/layout/PageLayout";
import { Partnerships as PartnershipsSection } from "@/src/components/sections/Partnerships";

export function Partnerships() {
  return (
    <PageLayout title="Global Partnerships" subtitle="Building strategic alliances for sustainable growth and security.">
      <PartnershipsSection />
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-white font-serif text-3xl mb-6">Join Our Global Network</h2>
        <p className="text-gray-400 max-w-2xl mx-auto mb-8">
          Sentinel Group works with governments, NGOs, and private enterprises to create secure and efficient 
          commodity supply chains. Our partnership models are designed to be mutually beneficial and long-term.
        </p>
      </div>
    </PageLayout>
  );
}
