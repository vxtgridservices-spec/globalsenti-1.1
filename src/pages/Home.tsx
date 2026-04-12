import { Navbar } from "@/src/components/layout/Navbar";
import { Hero } from "@/src/components/sections/Hero";
import { Services } from "@/src/components/sections/Services";
import { Commodities } from "@/src/components/sections/Commodities";
import { GlobalOperations } from "@/src/components/sections/GlobalOperations";
import { MarketIntelligence } from "@/src/components/sections/MarketIntelligence";
import { Partnerships } from "@/src/components/sections/Partnerships";
import { TrustStrip } from "@/src/components/sections/TrustStrip";
import { Contact } from "@/src/components/sections/Contact";
import { Footer } from "@/src/components/layout/Footer";

export function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Services />
      <Commodities />
      <GlobalOperations />
      <MarketIntelligence />
      <Partnerships />
      <TrustStrip />
      <Contact />
      <Footer />
    </main>
  );
}
