import { Button } from "@/src/components/ui/button";
import { motion } from "motion/react";
import { ArrowRight, ShieldCheck, Globe, Truck } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000"
          alt="Logistics background"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-background/60" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto space-y-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center space-y-4"
          >
            {/* Minimized and brought down slightly */}
            <div className="flex items-center gap-2 text-gold font-bold tracking-[0.3em] uppercase text-[9px] mt-4">
              <div className="w-8 h-[1px] bg-gold/50" />
              <span>Security • Resources • Trust</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight font-serif">
              GLOBAL SECURITY. <br />
              <span className="text-gold italic font-light">STRATEGIC</span> RESOURCES.
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed font-light tracking-wide"
          >
            Providing secure, compliant, and confidential solutions for governments 
            and global corporations in high-value asset protection and international trade.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-4 pt-2 justify-center"
          >
            <Button nativeButton={false} size="sm" className="bg-gold hover:bg-gold-light text-background font-bold h-12 px-6 text-[10px] tracking-[0.2em] transition-all duration-500 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]" render={<Link to="/contact" />}>
              REQUEST CONSULTATION
            </Button>
            <Button nativeButton={false} size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10 h-12 px-6 text-[10px] tracking-[0.2em] transition-all duration-500" render={<Link to="/services" />}>
              EXPLORE SERVICES
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Bottom Strip */}
      <div className="absolute bottom-0 left-0 right-0 bg-background/40 backdrop-blur-md border-t border-white/10 py-6 hidden md:block">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Globe className="text-gold w-6 h-6" />
            <span className="text-white font-medium">Global Presence in 40+ Countries</span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-gold w-6 h-6" />
            <span className="text-white font-medium">Full Regulatory Compliance</span>
          </div>
          <div className="flex items-center gap-3">
            <Truck className="text-gold w-6 h-6" />
            <span className="text-white font-medium">Secure High-Value Logistics</span>
          </div>
        </div>
      </div>
    </section>
  );
}
