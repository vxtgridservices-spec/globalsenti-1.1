import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Shield, Truck, Gem, BarChart3, Factory, Users, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

const services = [
  {
    title: "Security Operations",
    description: "Risk assessment, asset protection and executive security solutions.",
    icon: Shield,
  },
  {
    title: "Secure Logistics & Transportation",
    description: "High-value cargo transport, armored solutions and global logistics.",
    icon: Truck,
  },
  {
    title: "Commodity Trade",
    description: "Facilitating legal and compliant trade in high-value commodities worldwide.",
    icon: Gem,
  },
  {
    title: "Risk & Intelligence Advisory",
    description: "Market intelligence, risk analysis and strategic advisory for informed decisions.",
    icon: BarChart3,
  },
  {
    title: "Industrial & Specialized Supply",
    description: "Supplying industrial materials, minerals and infrastructure solutions.",
    icon: Factory,
  },
  {
    title: "Global Partnerships",
    description: "Government, corporate and private sector partnerships.",
    icon: Users,
  },
];

export function Services() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        <SectionHeader
          subtitle="Our Core Services"
          title="Strategic Solutions for a Complex World"
          description="We provide a comprehensive suite of services designed to protect assets, facilitate trade, and provide strategic intelligence."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-secondary/30 border-white/5 hover:border-gold/50 transition-all duration-500 group cursor-pointer h-full">
                <CardHeader className="space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold transition-colors duration-500">
                    <service.icon className="w-6 h-6 text-gold group-hover:text-background transition-colors duration-500" />
                  </div>
                  <CardTitle className="text-xl text-white group-hover:text-gold transition-colors">
                    {service.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                  <div className="flex items-center gap-2 text-gold font-bold text-sm tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                    Learn More
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
