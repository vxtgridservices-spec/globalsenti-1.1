import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Button } from "@/src/components/ui/button";
import { Users, Building2, Landmark, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

const partnershipTypes = [
  {
    title: "Strategic Partnership",
    icon: Users,
    description: "Long-term collaboration for global security and resource projects.",
  },
  {
    title: "Investment Access",
    icon: Building2,
    description: "Exclusive opportunities in high-value commodity and infrastructure deals.",
  },
  {
    title: "Government Liaison",
    icon: Landmark,
    description: "Structured engagement for state-level security and strategic supply.",
  },
];

export function Partnerships() {
  return (
    <section className="py-24 bg-background w-full">
      <div className="container mx-auto px-4">
        <SectionHeader
          subtitle="Partnership Section"
          title="Engaging with Integrity and Precision"
          description="We engage with governments, corporations, and verified private entities in structured, compliant transactions."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {partnershipTypes.map((type, index) => (
            <motion.div
              key={type.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-8 bg-secondary/20 border border-white/5 rounded-2xl space-y-6 hover:border-gold/30 transition-colors group"
            >
              <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold transition-colors duration-500">
                <type.icon className="w-8 h-8 text-gold group-hover:text-background transition-colors duration-500" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-white group-hover:text-gold transition-colors">
                  {type.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {type.description}
                </p>
              </div>
              <Button variant="link" className="text-gold p-0 h-auto font-bold text-xs tracking-widest uppercase gap-2 group-hover:translate-x-2 transition-transform">
                LEARN MORE
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          <Button nativeButton={false} size="lg" className="bg-gold hover:bg-gold-light text-background font-bold h-16 px-10 text-xs tracking-[0.3em] transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]" render={<Link to="/partnerships" />}>
            STRATEGIC PARTNERSHIP
          </Button>
          <Button nativeButton={false} size="lg" variant="outline" className="border-gold/30 text-gold hover:bg-gold hover:text-background font-bold h-16 px-10 text-xs tracking-[0.3em] transition-all duration-500" render={<Link to="/partnerships" />}>
            INVESTMENT ACCESS
          </Button>
          <Button nativeButton={false} size="lg" variant="outline" className="border-gold/30 text-gold hover:bg-gold hover:text-background font-bold h-16 px-10 text-xs tracking-[0.3em] transition-all duration-500" render={<Link to="/partnerships" />}>
            GOVERNMENT LIAISON
          </Button>
        </div>
      </div>
    </section>
  );
}
