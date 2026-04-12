import { PageLayout } from "@/src/components/layout/PageLayout";
import { Services as ServicesGrid } from "@/src/components/sections/Services";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { CheckCircle2 } from "lucide-react";

export function Services() {
  return (
    <PageLayout title="Our Services" subtitle="Comprehensive Strategic Solutions">
      <ServicesGrid />
      
      <section className="py-24 bg-secondary/10">
        <div className="container mx-auto px-4">
          <SectionHeader 
            title="Detailed Capabilities" 
            subtitle="Operational Excellence"
            description="Our services are backed by rigorous protocols and a global network of experts."
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gold">Security Operations</h3>
                <ul className="space-y-3">
                  {["Executive Protection", "Asset Guarding", "Risk Mitigation", "Intelligence Gathering"].map(item => (
                    <li key={item} className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle2 className="text-gold w-5 h-5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gold">Secure Logistics</h3>
                <ul className="space-y-3">
                  {["Armored Transport", "Air & Sea Freight", "Customs Clearance", "End-to-End Tracking"].map(item => (
                    <li key={item} className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle2 className="text-gold w-5 h-5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gold">Commodity Trade</h3>
                <ul className="space-y-3">
                  {["Sourcing & Verification", "Contract Structuring", "Trade Finance", "Compliance Auditing"].map(item => (
                    <li key={item} className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle2 className="text-gold w-5 h-5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gold">Intelligence Advisory</h3>
                <ul className="space-y-3">
                  {["Market Analysis", "Geopolitical Risk", "Due Diligence", "Strategic Planning"].map(item => (
                    <li key={item} className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle2 className="text-gold w-5 h-5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
