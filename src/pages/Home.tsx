import { Navbar } from "@/src/components/layout/Navbar";
import { Hero } from "@/src/components/sections/Hero";
import { Services } from "@/src/components/sections/Services";
import { Commodities } from "@/src/components/sections/Commodities";
import { GlobalOperations } from "@/src/components/sections/GlobalOperations";
import { BottomGrid } from "@/src/components/sections/BottomGrid";
import { LogoStrip } from "@/src/components/sections/LogoStrip";
import { Footer } from "@/src/components/layout/Footer";

export function Home() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <Hero />
      <Services />
      <Commodities />
      <GlobalOperations />
      <BottomGrid />
      <LogoStrip />
      <Footer />
    </main>
  );
}
