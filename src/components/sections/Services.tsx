import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Shield, Truck, Gem, BarChart3, Factory, Globe, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

const services = [
  {
    title: "SECURITY OPERATIONS",
    description: "Risk assessment, asset protection and executive security solutions.",
    icon: Shield,
  },
  {
    title: "SECURE LOGISTICS & TRANSPORTATION",
    description: "High-value cargo transport, armored solutions and global logistics.",
    icon: Truck,
  },
  {
    title: "COMMODITY TRADE",
    description: "Facilitating legal and compliant trade in high-value commodities worldwide.",
    icon: Gem,
  },
  {
    title: "RISK & INTELLIGENCE",
    description: "Market intelligence, risk analysis and strategic advisory for informed decisions.",
    icon: BarChart3,
  },
  {
    title: "INDUSTRIAL & SPECIALIZED SUPPLY",
    description: "Supplying industrial materials, minerals and infrastructure solutions.",
    icon: Factory,
  },
  {
    title: "GLOBAL PARTNERSHIPS",
    description: "Government, corporate and private sector partnerships.",
    icon: Globe,
  },
];

export function Services() {
  return (
    <section className="py-24 bg-background border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h3 className="text-gold font-bold tracking-[0.3em] uppercase text-xs mb-4">OUR CORE SERVICES</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center space-y-6 group cursor-pointer"
            >
              <div className="w-16 h-16 flex items-center justify-center">
                <service.icon className="w-10 h-10 text-gold group-hover:scale-110 transition-transform duration-500" strokeWidth={1} />
              </div>
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-white tracking-[0.2em] uppercase group-hover:text-gold transition-colors">
                  {service.title}
                </h4>
                <p className="text-muted-foreground text-[10px] leading-relaxed line-clamp-3">
                  {service.description}
                </p>
              </div>
              <Button variant="link" className="text-gold p-0 h-auto font-bold text-[9px] tracking-[0.2em] uppercase gap-2 hover:gap-4 transition-all">
                LEARN MORE
                <ArrowRight className="w-3 h-3" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
