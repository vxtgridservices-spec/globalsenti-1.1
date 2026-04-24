import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { 
  FileText, 
  Package, 
  Shield, 
  Bell, 
  ArrowUpRight, 
  MessageSquare, 
  Clock,
  Lock,
  ChevronRight,
  Activity,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { motion } from "motion/react";
import { Navbar } from "@/src/components/layout/Navbar";
import { Footer } from "@/src/components/layout/Footer";

export function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/portal");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
        navigate("/portal");
        return;
      }

      setProfile(profile);

      // Fetch initial requests
      const reqs = await fetchRequests(user.id);
      if (reqs && reqs.length > 0) {
        await fetchRecentActivity(reqs.map((r: any) => r.id));
      }
      setLoading(false);

      if (profile.role === 'admin') {
        navigate("/admin");
      }
    };

    checkUser();
  }, [navigate]);

  // Handle Realtime for requests
  useEffect(() => {
    if (!profile?.id) return;

    const channelName = `dashboard-requests-${profile.id}`;
    supabase.removeChannel(supabase.channel(channelName));

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'requests' 
      }, async () => {
        const reqs = await fetchRequests(profile.id);
        if (reqs && reqs.length > 0) {
           fetchRecentActivity(reqs.map((r: any) => r.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  // Realtime for activity (messages)
  useEffect(() => {
    if (!profile?.id || requests.length === 0) return;

    const channelName = `dashboard-activity-${profile.id}`;
    supabase.removeChannel(supabase.channel(channelName));

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, () => {
        fetchRecentActivity(requests.map(r => r.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, requests.length]);

  const fetchRequests = async (userId: string) => {
    const { data: reqs } = await supabase
      .from("requests")
      .select("*")
      .or(`buyer_id.eq.${userId},broker_id.eq.${userId},metadata->>buyer_id.eq.${userId}`);
    
    setRequests(reqs || []);
    return reqs || [];
  };

  const fetchRecentActivity = async (requestIds: string[]) => {
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .in("request_id", requestIds)
      .or('body.ilike.%[PROTOCOL UPDATE]%,body.ilike.%[System]%')
      .order('created_at', { ascending: false })
      .limit(8);
    
    if (msgs) {
      setActivities(msgs.map(m => ({
        title: m.body.replace('[PROTOCOL UPDATE] ', '').replace('[SYSTEM] ', '').replace('[System] ', ''),
        time: new Date(m.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        type: m.body.includes('PROTOCOL') ? 'protocol' : 'logistics'
      })));
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/portal");
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Derive stats from real data - Active contracts are those funded or in shipment
  const activeContracts = requests.filter(r => 
    r.status !== 'failed' && 
    ['escrow', 'shipment', 'contract_issued'].includes(r.stage)
  );
  
  const shipCount = requests.filter(r => 
    r.status !== 'failed' &&
    r.metadata?.shipment && 
    r.metadata.shipment.status !== 'delivered'
  ).length;

  const stats = [
    { title: "Active Contracts", value: activeContracts.length.toString(), icon: FileText, color: "text-blue-400" },
    { title: "Pending Shipments", value: shipCount.toString(), icon: Package, color: "text-gold" },
    { title: "Escrow Protocol", value: requests.filter(r => r.stage === 'escrow').length.toString(), icon: Shield, color: "text-green-400" },
    { title: "Notifications", value: activities.length.toString(), icon: Bell, color: "text-gold" },
  ];

  const operations = requests
    .filter(r => r.status !== 'failed')
    .map(r => ({
      id: r.id,
      name: r.metadata?.title || `Protocol ${r.id.slice(0, 8)}`,
      commodity: r.metadata?.commodity || "General Cargo",
      stage: r.stage ? r.stage.replace('_', ' ').toUpperCase() : "INITIATED",
      shipment: r.metadata?.shipment,
      time: r.updated_at ? new Date(r.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"
    }))
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <h1 className="text-4xl md:text-7xl font-serif text-white">Client Dashboard</h1>
            <div className="flex gap-4 w-full md:w-auto">
              <Button onClick={() => navigate('/chemicals/dashboard')} variant="outline" className="border-gold text-gold hover:bg-gold/10 w-full md:w-auto gap-2">
                 <Package className="w-4 h-4" /> Chemical Division
              </Button>
              <Button onClick={handleSignOut} variant="outline" className="border-white/10 text-white hover:bg-white/5 w-full md:w-auto">
                Sign Out
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex"
              >
                <Card className="bg-secondary/20 border-white/5 hover:border-white/10 transition-colors w-full h-full">
                  <CardContent className="p-6 flex justify-between items-center h-full w-full">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                      <p className="text-4xl font-serif text-white">{stat.value}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Active Operations</h2>
                  <p className="text-muted-foreground text-sm">Real-time status of your global security and logistics projects.</p>
                </div>
                <div className="space-y-4">
                  {operations.length > 0 ? operations.map((op) => (
                    <Card key={op.id} className="bg-secondary/20 border-white/5 hover:border-white/10 transition-colors">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded bg-gold/10 flex items-center justify-center shrink-0">
                          <Package className="text-gold w-6 h-6" />
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                            <h3 className="text-white font-bold">{op.name}</h3>
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded mb-1">
                                PROTOCOL: {op.stage}
                              </span>
                              {op.shipment && (
                                <span className={`text-[10px] font-bold ${op.shipment.status === 'delivered' ? 'text-green-500 bg-green-500/10' : 'text-gold bg-gold/10'} px-2 py-0.5 rounded`}>
                                  SHIPMENT: {op.shipment.status?.replace('_', ' ').toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{op.commodity} • Intelligence-Led Commerce</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-gray-500">• {op.shipment?.location || "Protocol Active"}</span>
                            <span className="text-[10px] text-gray-500">Updated {op.time}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )) : (
                    <Card className="bg-secondary/10 border-dashed border-white/5 p-12 text-center">
                       <p className="text-gray-500 text-sm font-serif italic">No managed operations detected for this profile.</p>
                    </Card>
                  )}
                  <Link to="/deal-room" className="inline-flex items-center text-gold text-sm font-bold hover:underline mt-2">
                    View All Operations <ArrowUpRight className="ml-1 w-4 h-4" />
                  </Link>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gold" /> Quick Actions
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "Investment Room", path: "/investments" },
                    { name: "Document Vault", path: "/vault" },
                    { name: "New Request", path: "/contact" },
                    { name: "Contact Agent", path: "/contact" }
                  ].map((action) => (
                    <Button 
                      key={action.name} 
                      variant="outline" 
                      className="h-16 border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold"
                      onClick={() => action.path !== "#" && navigate(action.path)}
                    >
                      {action.name}
                    </Button>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-bold text-white mb-6">Account Manager</h2>
                <Card className="bg-secondary/20 border-white/5">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10">
                        <img src="https://picsum.photos/seed/vance/100/100" alt="Alexander Vance" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold">Alexander Vance</h3>
                        <p className="text-xs text-muted-foreground">Senior Strategic Advisor</p>
                      </div>
                    </div>
                    <Button className="w-full bg-gold text-background font-bold gap-2">
                      <MessageSquare className="w-4 h-4" /> Secure Message
                    </Button>
                  </CardContent>
                </Card>
              </section>

               <section>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-gold" /> Protocol Activity Feed
                </h2>
                <div className="space-y-6">
                  {activities.length > 0 ? activities.map((activity, i) => (
                    <div key={i} className="flex gap-4 relative">
                      {i !== activities.length - 1 && (
                        <div className="absolute left-[7px] top-4 bottom-[-24px] w-[2px] bg-white/5" />
                      )}
                      <div className={`w-4 h-4 rounded-full ${activity.type === 'protocol' ? 'bg-blue-500' : 'bg-gold'} shrink-0 mt-1 shadow-[0_0_8px_rgba(212,175,55,0.3)]`} />
                      <div>
                        <h4 className="text-sm text-white font-medium leading-tight">{activity.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[9px] text-gray-500 uppercase tracking-widest">{activity.time}</p>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${activity.type === 'protocol' ? 'bg-blue-500/10 text-blue-400' : 'bg-gold/10 text-gold'}`}>
                            {activity.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-6">
                       <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Awaiting Live Protocol Updates...</p>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <Card className="bg-gold border-none overflow-hidden relative group">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2)_0%,_transparent_70%)]" />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Lock className="w-5 h-5 text-background" />
                      <h3 className="text-background font-bold uppercase tracking-widest text-sm">Private Deal Room</h3>
                    </div>
                    <p className="text-background/80 text-sm mb-6 font-medium">
                      Exclusive access to high-value commodity listings. You have 3 new listings matching your profile in the precious metals sector.
                    </p>
                    <Button 
                      className="w-full bg-background text-white hover:bg-background/90 font-bold" 
                      onClick={() => navigate("/deal-room")}
                    >
                      Enter Deal Room
                    </Button>
                  </CardContent>
                </Card>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
