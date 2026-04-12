import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { Lock, Send } from "lucide-react";
import { motion } from "motion/react";

export function Contact() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
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
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white font-bold uppercase tracking-widest text-xs">Full Name</Label>
                  <Input id="name" placeholder="John Doe" className="bg-background/50 border-white/10 text-white h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org" className="text-white font-bold uppercase tracking-widest text-xs">Organization</Label>
                  <Input id="org" placeholder="Company Name" className="bg-background/50 border-white/10 text-white h-12" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="text-white font-bold uppercase tracking-widest text-xs">Type of Inquiry</Label>
                <select id="type" className="w-full bg-background/50 border border-white/10 text-white h-12 rounded-md px-3 text-sm focus:ring-2 focus:ring-gold outline-none">
                  <option value="">Select Inquiry Type</option>
                  <option value="security">Security Operations</option>
                  <option value="logistics">Secure Logistics</option>
                  <option value="commodity">Commodity Trade</option>
                  <option value="partnership">Strategic Partnership</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="text-white font-bold uppercase tracking-widest text-xs">Your Message</Label>
                <Textarea id="message" placeholder="How can we assist you?" className="bg-background/50 border-white/10 text-white min-h-[150px]" />
              </div>
              <Button className="w-full bg-gold hover:bg-gold-dark text-background font-bold h-14 text-lg gap-2 group">
                SUBMIT SECURE REQUEST
                <Lock className="w-5 h-5 transition-transform group-hover:scale-110" />
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
