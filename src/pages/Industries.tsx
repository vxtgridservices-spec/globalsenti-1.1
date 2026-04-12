import { PageLayout } from "@/src/components/layout/PageLayout";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Landmark, Fuel, Pickaxe, Landmark as Bank, FlaskConical } from "lucide-react";
import { motion } from "motion/react";

const industries = [
  { title: "Government & Defense", icon: Landmark, desc: "Providing strategic security and supply solutions for state-level requirements." },
  { title: "Oil & Gas", icon: Fuel, desc: "Securing infrastructure and facilitating energy trade across global markets." },
  { title: "Mining & Natural Resources", icon: Pickaxe, desc: "Protecting high-value assets and managing complex resource logistics." },
  { title: "Financial Institutions", icon: Bank, desc: "Securing physical assets and providing market intelligence for investments." },
  { title: "Research & Industrial Development", icon: FlaskConical, desc: "Supplying critical minerals and securing sensitive industrial projects." },
];

export function Industries() {
  return (
    <PageLayout title="Industries We Serve" subtitle="Specialized Sector Expertise">
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {industries.map((industry, i) => (
              <motion.div
                key={industry.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-10 bg-secondary/20 border border-white/5 rounded-3xl hover:border-gold/30 transition-all group"
              >
                <industry.icon className="text-gold w-12 h-12 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-gold transition-colors">{industry.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{industry.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
