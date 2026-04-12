import { Button } from "@/src/components/ui/button";
import { motion } from "motion/react";
import { ArrowRight, ShieldCheck, Globe, Truck } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000"
          alt="Logistics background"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 text-gold font-bold tracking-[0.5em] uppercase text-xs">
              <div className="w-12 h-[1px] bg-gold/50" />
              <span>Security. Resources. Trust.</span>
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-white leading-[0.95] tracking-tighter font-serif">
              GLOBAL SECURITY. <br />
              <span className="text-gold italic font-light">STRATEGIC</span> <br />
              RESOURCES.
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed font-light tracking-wide"
          >
            Delivering secure, compliant, and confidential solutions for governments, 
            corporations, and private clients in high-value asset protection, 
            logistics, and international trade.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-6 pt-4"
          >
            <Button nativeButton={false} size="lg" className="bg-gold hover:bg-gold-light text-background font-bold h-16 px-10 text-sm tracking-[0.2em] group transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]" render={<Link to="/contact" />}>
              REQUEST PRIVATE CONSULTATION
              <ArrowRight className="ml-3 w-5 h-5 transition-transform group-hover:translate-x-2" />
            </Button>
            <Button nativeButton={false} size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-16 px-10 text-sm tracking-[0.2em] transition-all duration-500" render={<Link to="/services" />}>
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
