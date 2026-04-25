import * as React from "react";
import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { 
  LayoutDashboard,
  Users, 
  Briefcase, 
  MessageSquare, 
  TrendingUp, 
  ShieldCheck,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion } from "motion/react";
import { supabase } from "@/src/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";

export function AdminDashboard() {
  const [stats, setStats] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const [dealsRes, requestsRes, inquiriesRes, usersRes] = await Promise.all([
          supabase.from('deals').select('id', { count: 'exact' }),
          supabase.from('requests').select('id', { count: 'exact' }).not('type', 'in', '("consultation","support")'),
          supabase.from('requests').select('id', { count: 'exact' }).in('type', ['consultation', 'support']),
          supabase.from('profiles').select('id', { count: 'exact' })
        ]);

        const [pendingKYCRes, pendingBrokerDealsRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact' }).eq('kyc_status', 'pending'),
          supabase.from('deals').select('id', { count: 'exact' }).eq('status', 'Under Review')
        ]);

        setStats([
          { title: "Total Deals", value: dealsRes.count?.toString() || "0", change: "+0%", trend: "up", icon: Briefcase, color: "text-blue-400" },
          { title: "Active Requests", value: requestsRes.count?.toString() || "0", change: "+0%", trend: "up", icon: MessageSquare, color: "text-gold" },
          { title: "Private Inquiries", value: inquiriesRes.count?.toString() || "0", change: "+0%", trend: "up", icon: Users, color: "text-green-400" },
          { title: "Pending KYC", value: pendingKYCRes.count?.toString() || "0", change: "+0%", trend: "down", icon: Users, color: "text-red-400" },
        ]);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <AdminLayout title="System Overview" icon={LayoutDashboard}>
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-gold animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="System Overview" icon={LayoutDashboard}>
      <div className="space-y-8">
        <div>
          <p className="text-gray-400 -mt-6 mb-8">Welcome back, Administrator. Here is the current state of the platform.</p>
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
          <Card className="lg:col-span-2 bg-secondary/20 border-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gold" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { user: "John Doe", action: "submitted a purchase request", deal: "AU Bullion - 500kg Spot", time: "2 hours ago" },
                  { user: "Sarah Smith", action: "uploaded KYC documents", deal: "Identity Verification", time: "4 hours ago" },
                  { user: "Michael Chen", action: "initiated contact with broker", deal: "Rough Diamonds - 12k Carats", time: "6 hours ago" },
                  { user: "System", action: "auto-archived closed deal", deal: "DR-2023-098", time: "12 hours ago" },
                ].map((activity, i) => (
                  <div key={i} className="flex items-start gap-4 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm text-white">
                        <span className="font-bold">{activity.user}</span> {activity.action}{" "}
                        <span className="text-gold font-medium">{activity.deal}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/20 border-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                Urgent Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-red-400/5 border border-red-400/10">
                <p className="text-sm text-white font-bold mb-1">High-Value Request</p>
                <p className="text-xs text-gray-400 mb-3">A purchase request for 2M Barrels of Crude Oil requires immediate compliance review.</p>
                <Button size="sm" className="w-full bg-red-400 hover:bg-red-500 text-white font-bold">Review Now</Button>
              </div>
              <div className="p-4 rounded-xl bg-gold/5 border border-gold/10">
                <p className="text-sm text-white font-bold mb-1">Broker Inquiry</p>
                <p className="text-xs text-gray-400 mb-3">New message from verified partner regarding AU Bullion availability.</p>
                <Button size="sm" className="w-full bg-gold hover:bg-gold-dark text-background font-bold">Reply</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
