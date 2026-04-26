import * as React from "react";
import { BrokerLayout } from "@/src/components/broker/BrokerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { 
  Briefcase, 
  MessageSquare, 
  TrendingUp, 
  ShieldCheck,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Users
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { motion } from "motion/react";
import { supabase } from "@/src/lib/supabase";

export function BrokerDashboard() {
  const [stats, setStats] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [recentRequests, setRecentRequests] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch user's deals count
        const { data: deals, error: dealsError } = await supabase
          .from('deals')
          .select('id, status')
          .eq('broker_id', user.id);

        if (dealsError) throw dealsError;

        const totalDeals = deals.length;
        const activeDeals = deals.filter(d => d.status === 'Available').length;
        const pendingDeals = deals.filter(d => d.status === 'Under Review').length;

        // Fetch requests strictly facilitated by this broker
        const { count: totalRequests, error: reqError } = await supabase
          .from('requests')
          .select('*', { count: 'exact', head: true })
          .eq('broker_id', user.id);

        const { data: recentReqs } = await supabase
          .from('requests')
          .select('*')
          .eq('broker_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        setRecentRequests(recentReqs || []);

        setStats([
          { title: "Your Commodities", value: totalDeals.toString(), change: "+0%", trend: "up", icon: Briefcase, color: "text-blue-400" },
          { title: "Active Listings", value: activeDeals.toString(), change: "+0%", trend: "up", icon: TrendingUp, color: "text-green-400" },
          { title: "Under Review", value: pendingDeals.toString(), change: "+0%", trend: "down", icon: Clock, color: "text-yellow-400" },
          { title: "Client Engagements", value: (totalRequests || 0).toString(), change: "+0%", trend: "up", icon: MessageSquare, color: "text-gold" },
        ]);
      } catch (error) {
        console.error("Error fetching broker stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <BrokerLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-gold animate-spin" />
        </div>
      </BrokerLayout>
    );
  }

  return (
    <BrokerLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-serif text-white mb-2">Broker Command Center</h1>
          <p className="text-gray-400">Overview of your active commodities and client engagements.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-secondary/20 border-white/5 hover:border-gold/30 transition-all">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn("p-2 rounded-lg bg-white/5", stat.color)}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-xs font-bold",
                      stat.trend === "up" ? "text-green-500" : "text-red-500"
                    )}>
                      {stat.change}
                      {stat.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">{stat.title}</p>
                    <p className="text-3xl font-serif text-white">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 bg-secondary/20 border-white/5 font-sans">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gold" />
                Recent Leads & Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {recentRequests.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 italic">
                    No recent inquiries for your listings.
                  </div>
                ) : (
                  recentRequests.map((req, i) => (
                    <div key={i} className="p-6 flex items-start gap-4 hover:bg-white/5 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-5 h-5 text-gold" />
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm text-white font-bold">{req.name || "New Prospect"}</p>
                          <span className="text-[10px] text-gray-500 uppercase font-bold">{new Date(req.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">Inquired about <span className="text-gold">Deal #{req.deal_id}</span></p>
                        <p className="text-sm text-gray-300 line-clamp-1">{req.message || "Requested manifest documentation and pricing details."}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-gold h-auto p-0 font-bold hover:bg-transparent">
                        Details
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card className="bg-secondary/20 border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-gold" />
                  Broker Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    <p className="text-sm text-white font-bold">Verification Active</p>
                  </div>
                  <p className="text-xs text-gray-400">Your broker credentials are verified until Dec 2026. Next audit in 182 days.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">KYC Status</span>
                    <span className="text-green-500 font-bold">L3 FULL</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Trade Limit</span>
                    <span className="text-white font-mono">$50M+ / Deal</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-secondary/20 border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-sm">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full bg-gold text-background font-bold h-10 text-xs" onClick={() => window.location.href='/broker/create-deal'}>
                  New Listing
                </Button>
                <Button variant="outline" className="w-full border-white/10 text-white h-10 text-xs hover:bg-white/5" onClick={() => window.location.href='/broker/profile'}>
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </BrokerLayout>
  );
}
