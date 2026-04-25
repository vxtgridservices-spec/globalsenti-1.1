import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { CheckCircle2, ArrowRight, Lock, Download, TrendingUp, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";

const whyChooseUs = [
  "International Compliance Standards",
  "Secure & Confidential Transactions",
  "Proven Track Record",
  "Expert Team & Global Network",
  "End-to-End Logistics Support",
];

const newsItems = [
  {
    title: "Global Demand for Critical Minerals Continues to Rise",
    date: "May 7, 2024",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=200",
  },
  {
    title: "Oil Markets Outlook: Opportunities in Emerging Economies",
    date: "April 28, 2024",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=200",
  },
  {
    title: "Securing the Future: The Role of Strategic Partnerships",
    date: "April 15, 2024",
    image: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=200",
  },
];

export function BottomGrid() {
  const [formData, setFormData] = useState({
    name: "",
    org: "",
    email: "",
    type: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message || !formData.type) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch a fallback deal for schema compliance if required
      const { data: defaultDeal } = await supabase.from('deals').select('id').limit(1).single();
      const fallbackDealId = defaultDeal?.id || "DR-2024-001";

      const { error } = await supabase
        .from('requests')
        .insert({
          name: formData.name,
          company: formData.org,
          deal_id: fallbackDealId,
          buyer_id: user?.id || null,
          status: 'pending',
          stage: 'initiated',
          type: 'consultation',
          metadata: {
            title: "Footer Consultation Request",
            commodity: formData.type,
            type: "Support",
            buyer_id: user?.id || null,
            sender_name: formData.name,
            organization: formData.org,
            email: formData.email,
            message: formData.message,
            source: "Footer Section"
          }
        });

      if (error) throw error;

      toast.success("Request submitted successfully.");
      setFormData({ name: "", org: "", email: "", type: "", message: "" });
    } catch (err: any) {
      console.error("Submission error:", err);
      toast.error("Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <section className="py-24 bg-background border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Why Choose Us */}
          <div className="space-y-8">
            <h3 className="text-gold font-bold tracking-[0.2em] uppercase text-xs">WHY CHOOSE US</h3>
            <ul className="space-y-4">
              {whyChooseUs.map((item) => (
                <li key={item} className="flex items-center gap-3 text-white/80 text-sm">
                  <CheckCircle2 className="text-gold w-4 h-4 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Button nativeButton={false} variant="link" className="text-gold p-0 h-auto font-bold text-[10px] tracking-[0.2em] uppercase justify-start gap-3 hover:gap-5 transition-all" render={<Link to="/about" />}>
              LEARN MORE ABOUT US
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Market Intelligence */}
          <div className="space-y-8">
            <h3 className="text-gold font-bold tracking-[0.2em] uppercase text-xs">MARKET INTELLIGENCE</h3>
            <div className="space-y-4">
              <p className="text-white font-bold text-xs tracking-widest uppercase">GLOBAL COMMODITY TRENDS</p>
              <div className="h-32 w-full bg-secondary/20 rounded-xl border border-white/5 p-4 relative overflow-hidden">
                <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <motion.path
                    d="M 0 80 Q 20 60 40 70 T 80 30 T 100 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-gold"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />
                  <motion.path
                    d="M 0 80 Q 20 60 40 70 T 80 30 T 100 20 L 100 100 L 0 100 Z"
                    fill="url(#gradient)"
                    className="opacity-10 text-gold"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="currentColor" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
                <TrendingUp className="absolute top-4 right-4 text-gold w-4 h-4" />
              </div>
              <Button nativeButton={false} variant="outline" className="w-full border-gold/30 text-gold hover:bg-gold hover:text-background font-bold h-10 text-[9px] tracking-[0.2em] gap-3" render={<Link to="/intelligence" />}>
                DOWNLOAD MARKET BRIEF
                <Download className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Latest News */}
          <div className="space-y-8">
            <h3 className="text-gold font-bold tracking-[0.2em] uppercase text-xs">LATEST NEWS</h3>
            <div className="space-y-6">
              {newsItems.map((item) => (
                <div key={item.title} className="flex gap-4 group cursor-pointer">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/5">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-white text-xs font-bold leading-tight group-hover:text-gold transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">{item.date}</p>
                  </div>
                </div>
              ))}
              <Button nativeButton={false} variant="link" className="text-gold p-0 h-auto font-bold text-[10px] tracking-[0.2em] uppercase justify-start gap-3 hover:gap-5 transition-all" render={<Link to="/intelligence" />}>
                VIEW ALL NEWS
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Private Consultation */}
          <div className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-gold font-bold tracking-[0.2em] uppercase text-xs">PRIVATE CONSULTATION</h3>
              <p className="text-muted-foreground text-[10px] leading-relaxed">
                For serious inquiries and partnership opportunities only.
              </p>
            </div>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <Input 
                name="name"
                placeholder="Full Name *" 
                className="bg-secondary/20 border-white/5 h-10 text-xs text-white placeholder:text-muted-foreground/50" 
                value={formData.name}
                onChange={handleChange}
                required
              />
              <Input 
                name="email"
                type="email"
                placeholder="Email Address *" 
                className="bg-secondary/20 border-white/5 h-10 text-xs text-white placeholder:text-muted-foreground/50" 
                value={formData.email}
                onChange={handleChange}
                required
              />
              <Input 
                name="org"
                placeholder="Organization" 
                className="bg-secondary/20 border-white/5 h-10 text-xs text-white placeholder:text-muted-foreground/50" 
                value={formData.org}
                onChange={handleChange}
              />
              <select 
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="flex h-10 w-full rounded-md border border-white/5 bg-secondary/20 px-3 py-2 text-xs text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
              >
                <option value="" disabled>Inquiry Type *</option>
                <option value="security" className="bg-background text-white">Security Operations</option>
                <option value="logistics" className="bg-background text-white">Secure Logistics</option>
                <option value="trade" className="bg-background text-white">Commodity Trade</option>
                <option value="chemicals" className="bg-background text-white">Chemical Industries</option>
                <option value="investments" className="bg-background text-white">Strategic Investments</option>
                <option value="partnership" className="bg-background text-white">Strategic Partnership</option>
              </select>
              <Textarea 
                name="message"
                placeholder="Your Message *" 
                className="bg-secondary/20 border-white/5 min-h-[80px] text-xs text-white placeholder:text-muted-foreground/50 resize-none" 
                value={formData.message}
                onChange={handleChange}
                required
              />
              <Button 
                type="submit"
                disabled={loading}
                className="w-full bg-gold hover:bg-gold-light text-background font-bold h-10 text-[9px] tracking-[0.2em] gap-3"
              >
                {loading ? (
                  <>
                    PROCESSING...
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  </>
                ) : (
                  <>
                    SUBMIT SECURE REQUEST
                    <Lock className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
