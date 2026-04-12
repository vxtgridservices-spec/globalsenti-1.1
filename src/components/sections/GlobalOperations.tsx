import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Button } from "@/src/components/ui/button";
import { Globe, MapPin, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

const regions = [
  { name: "Africa", description: "Strategic mining and resource corridors.", x: "50%", y: "65%" },
  { name: "Europe", description: "Financial hubs and logistics networks.", x: "50%", y: "35%" },
  { name: "Middle East", description: "Energy partnerships and security ops.", x: "60%", y: "45%" },
  { name: "Asia", description: "Industrial supply and trade routes.", x: "75%", y: "45%" },
  { name: "North America", description: "Corporate headquarters and compliance.", x: "25%", y: "35%" },
  { name: "South America", description: "Resource extraction and logistics.", x: "30%", y: "65%" },
];

export function GlobalOperations() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <SectionHeader
              subtitle="Global Presence"
              title="Operating Across Strategic Corridors"
              centered={false}
              className="mb-0"
            />
            <p className="text-muted-foreground text-lg leading-relaxed max-w-xl">
              We operate in key global regions with trusted partners and full 
              regulatory compliance to deliver unmatched security and logistics solutions. 
              Our network ensures that your assets are protected and your trade is 
              facilitated with the highest standards of integrity.
            </p>
            <div className="grid grid-cols-2 gap-10">
              <div className="space-y-3">
                <h4 className="text-5xl font-bold text-gold font-serif tracking-tighter">40+</h4>
                <p className="text-muted-foreground font-bold uppercase tracking-[0.3em] text-[10px]">Countries Served</p>
              </div>
              <div className="space-y-3">
                <h4 className="text-5xl font-bold text-gold font-serif tracking-tighter">250+</h4>
                <p className="text-muted-foreground font-bold uppercase tracking-[0.3em] text-[10px]">Trusted Partners</p>
              </div>
              <div className="space-y-3">
                <h4 className="text-5xl font-bold text-gold font-serif tracking-tighter">15+</h4>
                <p className="text-muted-foreground font-bold uppercase tracking-[0.3em] text-[10px]">Years of Excellence</p>
              </div>
              <div className="space-y-3">
                <h4 className="text-5xl font-bold text-gold font-serif tracking-tighter">500+</h4>
                <p className="text-muted-foreground font-bold uppercase tracking-[0.3em] text-[10px]">Completed Projects</p>
              </div>
            </div>
            <Button nativeButton={false} className="bg-gold hover:bg-gold-light text-background font-bold h-16 px-10 text-xs tracking-[0.3em] gap-3 group transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]" render={<Link to="/about" />}>
              OUR GLOBAL NETWORK
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
            </Button>
          </div>

          <div className="relative aspect-square md:aspect-video lg:aspect-square bg-secondary/20 rounded-3xl border border-white/5 overflow-hidden group">
            {/* World Map Placeholder */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center grayscale" />
            
            {/* Pulsing Dots for Regions */}
            {regions.map((region, index) => (
              <motion.div
                key={region.name}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="absolute group/pin"
                style={{ left: region.x, top: region.y }}
              >
                <div className="relative">
                  <div className="w-4 h-4 bg-gold rounded-full animate-ping absolute inset-0" />
                  <div className="w-4 h-4 bg-gold rounded-full relative z-10 cursor-pointer" />
                  
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 p-4 bg-background/90 backdrop-blur-md border border-gold/30 rounded-xl opacity-0 group-hover/pin:opacity-100 transition-all duration-300 pointer-events-none z-20">
                    <h5 className="text-gold font-bold text-sm mb-1">{region.name}</h5>
                    <p className="text-white text-xs leading-relaxed">{region.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Globe className="w-64 h-64 text-gold/5 animate-[spin_60s_linear_infinite]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
