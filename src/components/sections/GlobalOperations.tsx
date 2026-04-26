import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Button } from "@/src/components/ui/button";
import { Globe, ArrowRight, Building2, ShieldCheck, Users, Lock } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

const regions = [
  { name: "NORTH AMERICA", x: "20%", y: "35%" },
  { name: "SOUTH AMERICA", x: "30%", y: "65%" },
  { name: "EUROPE", x: "50%", y: "30%" },
  { name: "AFRICA", x: "50%", y: "60%" },
  { name: "MIDDLE EAST", x: "60%", y: "45%" },
  { name: "ASIA", x: "75%", y: "40%" },
];

export function GlobalOperations() {
  return (
    <section className="py-24 bg-background relative overflow-hidden w-full">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24 min-h-[500px]">
          {/* Left Column: Vertically Centered Text */}
          <div className="space-y-8 flex flex-col justify-center">
            <SectionHeader
              subtitle="GLOBAL PRESENCE"
              title="Operating Across Strategic Corridors"
              centered={false}
              className="mb-0"
            />
            <p className="text-muted-foreground text-lg leading-relaxed max-w-xl">
              We operate in key global regions with trusted partners and full 
              regulatory compliance to deliver unmatched security and logistics solutions. 
              Our network ensures seamless operations across international borders.
            </p>
            <Button nativeButton={false} className="bg-gold hover:bg-gold-light text-background font-bold h-12 px-8 text-[10px] tracking-[0.3em] gap-3 group transition-all duration-500 w-fit" render={<Link to="/about" />}>
              OUR GLOBAL NETWORK
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
            </Button>
          </div>

          {/* Right Column: Map with Glowing Markers and Connection Lines */}
          <div className="relative aspect-video lg:aspect-square rounded-3xl overflow-hidden group bg-secondary/5 border border-white/5 shadow-2xl">
            {/* World Map Image */}
            <img 
              src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=2000" 
              alt="World Map"
              className="absolute inset-0 w-full h-full object-cover grayscale opacity-10"
              referrerPolicy="no-referrer"
            />
            
            {/* Dark Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-transparent to-background/80 pointer-events-none" />
            
            {/* Connection Lines (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
              <motion.path
                d="M 20 35 Q 35 30 50 30"
                fill="none"
                stroke="var(--gold)"
                strokeWidth="0.2"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.5 }}
              />
              <motion.path
                d="M 50 30 Q 55 37 60 45"
                fill="none"
                stroke="var(--gold)"
                strokeWidth="0.2"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.7 }}
              />
              <motion.path
                d="M 60 45 Q 67 42 75 40"
                fill="none"
                stroke="var(--gold)"
                strokeWidth="0.2"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.9 }}
              />
              <motion.path
                d="M 50 60 Q 55 52 60 45"
                fill="none"
                stroke="var(--gold)"
                strokeWidth="0.2"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 1.1 }}
              />
              <motion.path
                d="M 20 35 Q 25 50 30 65"
                fill="none"
                stroke="var(--gold)"
                strokeWidth="0.2"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 1.3 }}
              />
            </svg>

            {/* Glowing Markers */}
            {regions.map((region, index) => (
              <motion.div
                key={region.name}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="absolute"
                style={{ left: region.x, top: region.y }}
              >
                <div className="relative flex flex-col items-center group/marker">
                  {/* Glow Effect */}
                  <div className="absolute -inset-4 bg-gold/20 blur-xl rounded-full opacity-0 group-hover/marker:opacity-100 transition-opacity duration-500" />
                  
                  {/* Pulse Animation */}
                  <div className="w-3 h-3 bg-gold rounded-full animate-ping absolute inset-0 opacity-40" />
                  
                  {/* Main Marker */}
                  <div className="w-2.5 h-2.5 bg-gold rounded-full relative z-10 shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                  
                  {/* Label */}
                  <span className="mt-3 text-[7px] font-bold text-white tracking-[0.25em] uppercase whitespace-nowrap bg-black/80 px-2.5 py-1 rounded-sm border border-white/10 backdrop-blur-md opacity-0 group-hover/marker:opacity-100 transition-all duration-300 transform translate-y-2 group-hover/marker:translate-y-0">
                    {region.name}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trust Strip with Icons */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pt-12 border-t border-white/5">
          <div className="space-y-4 text-center md:text-left">
            <Building2 className="w-8 h-8 text-gold/50 mx-auto md:mx-0" strokeWidth={1} />
            <div className="space-y-1">
              <h4 className="text-3xl font-bold text-gold font-serif">15+</h4>
              <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[9px]">Years of Excellence</p>
            </div>
          </div>
          <div className="space-y-4 text-center md:text-left">
            <Globe className="w-8 h-8 text-gold/50 mx-auto md:mx-0" strokeWidth={1} />
            <div className="space-y-1">
              <h4 className="text-3xl font-bold text-gold font-serif">40+</h4>
              <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[9px]">Countries Served</p>
            </div>
          </div>
          <div className="space-y-4 text-center md:text-left">
            <ShieldCheck className="w-8 h-8 text-gold/50 mx-auto md:mx-0" strokeWidth={1} />
            <div className="space-y-1">
              <h4 className="text-3xl font-bold text-gold font-serif">250+</h4>
              <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[9px]">Trusted Partners</p>
            </div>
          </div>
          <div className="space-y-4 text-center md:text-left">
            <Users className="w-8 h-8 text-gold/50 mx-auto md:mx-0" strokeWidth={1} />
            <div className="space-y-1">
              <h4 className="text-3xl font-bold text-gold font-serif">500+</h4>
              <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[9px]">Completed Projects</p>
            </div>
          </div>
          <div className="space-y-4 text-center md:text-left">
            <Lock className="w-8 h-8 text-gold/50 mx-auto md:mx-0" strokeWidth={1} />
            <div className="space-y-1">
              <h4 className="text-3xl font-bold text-gold font-serif">100%</h4>
              <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[9px]">Confidential & Secure</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
