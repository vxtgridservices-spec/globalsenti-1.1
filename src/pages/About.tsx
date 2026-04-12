import { PageLayout } from "@/src/components/layout/PageLayout";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Shield, Target, Eye, Award } from "lucide-react";
import { motion } from "motion/react";

export function About() {
  return (
    <PageLayout title="About Our Group" subtitle="Integrity. Precision. Expertise.">
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-white">A Global Leader in Strategic Solutions</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Global Sentinel Group was founded on the principles of absolute 
                confidentiality, rigorous compliance, and unmatched operational 
                excellence. We serve as a trusted partner to governments and 
                multinational corporations operating in high-stakes environments.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Our team comprises elite professionals from security, intelligence, 
                logistics, and commodity trading sectors, providing a holistic 
                approach to risk management and strategic supply.
              </p>
            </div>
            <div className="relative rounded-3xl overflow-hidden aspect-video">
              <img 
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000" 
                alt="Corporate building" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gold/10 mix-blend-overlay" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Our Mission", icon: Target, desc: "To provide secure and compliant pathways for global trade and asset protection." },
              { title: "Our Vision", icon: Eye, desc: "To be the gold standard in international security and strategic resource logistics." },
              { title: "Our Values", icon: Shield, desc: "Integrity, confidentiality, and operational precision in every engagement." },
              { title: "Our Legacy", icon: Award, desc: "Over 15 years of successful operations in the world's most complex markets." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-8 bg-secondary/20 border border-white/5 rounded-2xl space-y-4"
              >
                <item.icon className="text-gold w-10 h-10" />
                <h3 className="text-xl font-bold text-white">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
