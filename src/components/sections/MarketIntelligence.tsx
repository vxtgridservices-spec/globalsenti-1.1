import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Download, TrendingUp, BarChart, PieChart } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

export function MarketIntelligence() {
  return (
    <section className="py-24 bg-secondary/5">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Card className="bg-background border-white/5 p-6 space-y-4">
                  <TrendingUp className="text-gold w-8 h-8" />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Gold Trend</p>
                    <p className="text-2xl font-bold text-white">+12.4%</p>
                  </div>
                  <div className="h-20 w-full bg-gold/5 rounded-lg flex items-end gap-1 p-2">
                    {[40, 60, 45, 70, 55, 85, 65].map((h, i) => (
                      <div key={i} className="flex-1 bg-gold/30 rounded-t-sm" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-background border-white/5 p-6 space-y-4">
                  <BarChart className="text-gold w-8 h-8" />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Supply Index</p>
                    <p className="text-2xl font-bold text-white">84.2</p>
                  </div>
                  <div className="h-20 w-full bg-gold/5 rounded-lg flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-4 border-gold/20 border-t-gold animate-spin" />
                  </div>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="col-span-2"
              >
                <Card className="bg-background border-white/5 p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Global Risk Exposure</p>
                      <p className="text-2xl font-bold text-white">Low / Stable</p>
                    </div>
                    <PieChart className="text-gold w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Logistics Safety</span>
                      <span className="text-gold">98%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="w-[98%] h-full bg-gold" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>

          <div className="space-y-8 order-1 lg:order-2">
            <SectionHeader
              subtitle="Market Intelligence"
              title="Real-Time Insights for Strategic Advantage"
              centered={false}
              className="mb-0"
            />
            <p className="text-muted-foreground text-lg leading-relaxed">
              We provide real-time insights into global commodity trends, supply 
              chain movements, and investment opportunities. Our intelligence 
              reports are used by governments and major corporations to navigate 
              complex global markets with confidence.
            </p>
            <ul className="space-y-4">
              {[
                "Daily Commodity Price Analysis",
                "Geopolitical Risk Assessments",
                "Supply Chain Vulnerability Reports",
                "Strategic Investment Briefs"
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-white font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
            <Button nativeButton={false} size="lg" className="bg-gold hover:bg-gold-light text-background font-bold h-16 px-10 text-xs tracking-[0.3em] gap-3 group transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]" render={<Link to="/intelligence" />}>
              <Download className="w-5 h-5 transition-transform group-hover:translate-y-2" />
              DOWNLOAD MARKET BRIEF
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
