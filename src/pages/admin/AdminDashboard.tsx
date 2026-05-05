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
  Loader2,
  Clock,
  ExternalLink
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion } from "motion/react";
import { supabase } from "@/src/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { useNavigate } from "react-router-dom";

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = React.useState<any[]>([]);
  const [recentActivities, setRecentActivities] = React.useState<any[]>([]);
  const [urgentActions, setUrgentActions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
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

      // Fetch Recent Activity
      const [recentRequests, recentDeals] = await Promise.all([
        supabase.from('requests').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('deals').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      const activities: any[] = [];
      
      (recentRequests.data || []).forEach(req => {
        activities.push({
          type: 'request',
          user: req.name || 'Confidential Client',
          action: req.type === 'purchase' ? 'submitted a purchase request' : 'initiated a consultation',
          target: req.metadata?.commodity || req.deal_id || 'Global Asset',
          time: new Date(req.created_at),
          data: req
        });
      });

      (recentDeals.data || []).forEach(deal => {
        activities.push({
          type: 'deal',
          user: 'GSG System',
          action: 'published a new listing',
          target: deal.title,
          time: new Date(deal.created_at),
          data: deal
        });
      });

      setRecentActivities(activities.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 4));

      // Determine Urgent Actions
      const urgents: any[] = [];
      
      const pendingPurchases = (recentRequests.data || []).filter(r => r.status === 'pending' && r.type === 'purchase');
      if (pendingPurchases.length > 0) {
        urgents.push({
          title: "High-Value Request",
          description: `A purchase request for ${pendingPurchases[0].metadata?.commodity || 'commodities'} requires immediate compliance review.`,
          buttonText: "Review Now",
          path: "/admin/requests",
          color: "red"
        });
      }

      const pendingConsultations = (recentRequests.data || []).filter(r => r.status === 'pending' && (r.type === 'consultation' || r.type === 'support'));
      if (pendingConsultations.length > 0) {
        urgents.push({
          title: "Broker Inquiry",
          description: `New message from ${pendingConsultations[0].name || 'partner'} regarding partnership protocol.`,
          buttonText: "Reply",
          path: "/admin/consultations",
          color: "gold"
        });
      }

      // If nothing pending, add placeholders or generic actions
      if (urgents.length === 0) {
        urgents.push({
          title: "Identity Verification",
          description: `${pendingKYCRes.count || 0} entities are awaiting KYC documentation approval for trade access.`,
          buttonText: "Verify Now",
          path: "/admin/verifications",
          color: "blue"
        });
      }

      setUrgentActions(urgents);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

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
                {recentActivities.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 italic">No recent system activity logged.</div>
                ) : (
                  recentActivities.map((activity, i) => (
                    <div key={i} className="flex items-start gap-4 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        activity.type === 'deal' ? "bg-blue-500/10 text-blue-400" : "bg-gold/10 text-gold"
                      )}>
                        {activity.type === 'deal' ? <Briefcase className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <p className="text-sm text-white">
                            <span className="font-bold">{activity.user}</span> {activity.action}{" "}
                            <span className={cn("font-medium", activity.type === 'deal' ? "text-blue-400" : "text-gold")}>
                              {activity.target}
                            </span>
                          </p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-gray-600 hover:text-white"
                            onClick={() => navigate(activity.type === 'deal' ? `/deal/${activity.data.id}` : (activity.data.type === 'purchase' ? '/admin/requests' : '/admin/consultations'))}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatRelativeTime(activity.time)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
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
              {urgentActions.map((action, i) => (
                <div key={i} className={cn(
                  "p-4 rounded-xl border",
                  action.color === 'red' ? "bg-red-400/5 border-red-400/10" : 
                  action.color === 'gold' ? "bg-gold/5 border-gold/10" : "bg-blue-500/5 border-blue-500/10"
                )}>
                  <p className="text-sm text-white font-bold mb-1">{action.title}</p>
                  <p className="text-xs text-gray-400 mb-3">{action.description}</p>
                  <Button 
                    size="sm" 
                    className={cn(
                      "w-full font-bold",
                      action.color === 'red' ? "bg-red-400 hover:bg-red-500 text-white" : 
                      action.color === 'gold' ? "bg-gold hover:bg-gold-dark text-background" : "bg-blue-500 hover:bg-blue-600 text-white"
                    )}
                    onClick={() => navigate(action.path)}
                  >
                    {action.buttonText}
                  </Button>
                </div>
              ))}

              {urgentActions.length === 0 && (
                <div className="p-8 text-center bg-white/5 rounded-xl border border-dashed border-white/10">
                  <ShieldCheck className="w-10 h-10 text-green-500 mx-auto mb-3 opacity-20" />
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">All protocols nominal</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
