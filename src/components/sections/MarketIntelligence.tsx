import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Download, TrendingUp, BarChart, PieChart, Check } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";

export function MarketIntelligence() {
  const [goldTrend, setGoldTrend] = useState(12.4);
  const [supplyIndex, setSupplyIndex] = useState(84.2);
  const [logisticsSafety, setLogisticsSafety] = useState(98.0);
  const [goldBars, setGoldBars] = useState([40, 60, 45, 70, 55, 85, 65]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);

  // Simulate real-time market data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setGoldTrend((prev) => {
        const change = (Math.random() - 0.5) * 0.5;
        return Number((prev + change).toFixed(2));
      });
      
      setSupplyIndex((prev) => {
        const change = (Math.random() - 0.4) * 0.8;
        return Number((Math.min(100, Math.max(0, prev + change))).toFixed(1));
      });

      setLogisticsSafety((prev) => {
        const change = (Math.random() - 0.3) * 0.5;
        return Number((Math.min(100, Math.max(90, prev + change))).toFixed(1));
      });

      setGoldBars((prev) => {
        const nextBar = Math.max(20, Math.min(100, prev[prev.length - 1] + (Math.random() * 20 - 10)));
        return [...prev.slice(1), nextBar];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleDownload = () => {
    if (isDownloading) return;
    setIsDownloading(true);

    // Simulate a brief loading sequence
    setTimeout(() => {
      // Generate a dynamic CSV report
      const headers = "Metric,Value,Status,Timestamp\n";
      const timestamp = new Date().toISOString();
      const rows = [
        `Gold Trend,${goldTrend > 0 ? '+' : ''}${goldTrend}%,Active,${timestamp}`,
        `Supply Index,${supplyIndex},Stable,${timestamp}`,
        `Logistics Safety,${logisticsSafety}%,Secure,${timestamp}`,
        `Global Risk Exposure,Low,Monitored,${timestamp}`,
      ].join("\n");
      
      const csvContent = headers + rows;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Global_Sentinel_Market_Brief_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsDownloading(false);
      setDownloadComplete(true);
      
      setTimeout(() => setDownloadComplete(false), 3000);
    }, 1500);
  };

  return (
    <section className="py-24 bg-secondary/5 w-full">
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
                    <p className={`text-2xl font-bold ${goldTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {goldTrend >= 0 ? '+' : ''}{goldTrend.toFixed(2)}%
                    </p>
                  </div>
                  <div className="h-20 w-full bg-gold/5 rounded-lg flex items-end gap-1 p-2">
                    {goldBars.map((h, i) => (
                      <div key={i} className="flex-1 bg-gold/30 rounded-t-sm transition-all duration-700 ease-in-out" style={{ height: `${h}%` }} />
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
                    <p className="text-2xl font-bold text-white">{supplyIndex.toFixed(1)}</p>
                  </div>
                  <div className="h-20 w-full bg-gold/5 rounded-lg flex items-center justify-center relative">
                    <div className="w-16 h-16 rounded-full border-4 border-gold/10 border-t-gold animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <span className="text-xs font-bold text-gold/80">{Math.round((supplyIndex / 100) * 100)}%</span>
                    </div>
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
                      <span className="text-gold">{logisticsSafety.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gold transition-all duration-700 ease-in-out" 
                        style={{ width: `${logisticsSafety}%` }}
                      />
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
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              size="lg" 
              className={`bg-gold hover:bg-gold-light text-background font-bold h-16 px-10 text-xs tracking-[0.3em] gap-3 group transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] disabled:opacity-70`}
            >
              {downloadComplete ? (
                <>
                  <Check className="w-5 h-5 text-background" />
                  REPORT DOWNLOADED
                </>
              ) : isDownloading ? (
                <>
                  <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  GENERATING SECURE BRIEF...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 transition-transform group-hover:translate-y-2" />
                  DOWNLOAD MARKET BRIEF
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
