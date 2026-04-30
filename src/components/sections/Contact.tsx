import React, { useState, useEffect } from "react";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { Lock, Send, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

export function Contact() {
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    org: "",
    email: "",
    type: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state && typeof location.state === 'object') {
      const state = location.state as any;
      if (state.inquiryType) {
        setFormData(prev => ({ ...prev, type: state.inquiryType }));
      }
      if (state.prefillMessage) {
        setFormData(prev => ({ ...prev, message: state.prefillMessage }));
      }
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message || !formData.type) {
      toast.error("Please fill in all required fields (Name, Email, Inquiry Type, and Message).");
      return;
    }

    setLoading(true);
    try {
      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch a fallback deal for schema compliance if required
      const { data: defaultDeal } = await supabase.from('deals').select('id').limit(1).single();
      const fallbackDealId = defaultDeal?.id || "DR-2026-001";

      const { error } = await supabase
        .from('requests')
        .insert({
          name: formData.name,
          company: formData.org,
          deal_id: fallbackDealId,
          status: 'pending',
          stage: 'initiated',
          type: 'consultation',
          metadata: {
            title: "Private Consultation Request",
            commodity: formData.type,
            type: "Support",
            buyer_id: user?.id || null,
            sender_name: formData.name,
            organization: formData.org,
            email: formData.email,
            message: formData.message,
            source: "Contact Page"
          }
        });

      if (error) throw error;

      toast.success("Confidential request submitted successfully. Our team will contact you shortly.");
      setFormData({ name: "", org: "", email: "", type: "", message: "" });
    } catch (err: any) {
      console.error("Submission error:", err);
      toast.error("Failed to submit request. Please try again or contact us directly.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  return (
    <section className="py-24 bg-background relative overflow-hidden w-full" id="contact">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gold/5 -skew-x-12 transform translate-x-1/2" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-8">
            <SectionHeader
              subtitle="Private Consultation"
              title="Confidential Engagement Starts Here"
              centered={false}
              className="mb-0"
            />
            <p className="text-muted-foreground text-lg leading-relaxed max-w-xl">
              For serious inquiries and partnership opportunities only. Our team 
              maintains the highest level of confidentiality and discretion in all 
              communications.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                  <Lock className="text-gold w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">Secure Communication</h4>
                  <p className="text-muted-foreground">All data is encrypted and handled with strict internal protocols.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                  <Send className="text-gold w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">Priority Response</h4>
                  <p className="text-muted-foreground">Verified inquiries receive a response from our executive team within 24 hours.</p>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-secondary/20 border border-white/5 p-8 md:p-12 rounded-3xl backdrop-blur-sm"
          >
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white font-bold uppercase tracking-widest text-xs">Full Name *</Label>
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    className="bg-background/50 border-white/10 text-white h-12" 
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-bold uppercase tracking-widest text-xs">Email Address *</Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="john@example.com" 
                    className="bg-background/50 border-white/10 text-white h-12" 
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="org" className="text-white font-bold uppercase tracking-widest text-xs">Organization</Label>
                <Input 
                  id="org" 
                  placeholder="Company Name" 
                  className="bg-background/50 border-white/10 text-white h-12" 
                  value={formData.org}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="text-white font-bold uppercase tracking-widest text-xs">Type of Inquiry *</Label>
                <select 
                  id="type" 
                  className="w-full bg-background/50 border border-white/10 text-white h-12 rounded-md px-3 text-sm focus:ring-2 focus:ring-gold outline-none"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Inquiry Type</option>
                  <option value="security">Security Operations</option>
                  <option value="logistics">Secure Logistics</option>
                  <option value="commodity">Commodity Trade</option>
                  <option value="chemicals">Chemical Industries</option>
                  <option value="investments">Strategic Investments</option>
                  <option value="partnership">Strategic Partnership</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="text-white font-bold uppercase tracking-widest text-xs">Your Message *</Label>
                <Textarea 
                  id="message" 
                  placeholder="How can we assist you?" 
                  className="bg-background/50 border-white/10 text-white min-h-[150px]" 
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </div>
              <Button 
                type="submit"
                disabled={loading}
                className="w-full bg-gold hover:bg-gold-dark text-background font-bold h-14 text-lg gap-2 group"
              >
                {loading ? (
                  <>
                    PROCESSING...
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </>
                ) : (
                  <>
                    SUBMIT SECURE REQUEST
                    <Lock className="w-5 h-5 transition-transform group-hover:scale-110" />
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
