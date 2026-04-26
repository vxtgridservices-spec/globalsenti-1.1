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
  AlertTriangle,
  Send,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Navbar } from "@/src/components/layout/Navbar";
import { Footer } from "@/src/components/layout/Footer";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/src/components/ui/dialog";
import { Textarea } from "@/src/components/ui/textarea";
import { toast } from "sonner";

export function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [chemicalOrders, setChemicalOrders] = useState<any[]>([]);
  const [fundingSubmissions, setFundingSubmissions] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [aggregatedOperations, setAggregatedOperations] = useState<any[]>([]);
  
  // Messaging state
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

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

      // Fetch initial requests and other active items
      const [reqs, chemicalRes, fundingRes] = await Promise.all([
        fetchRequests(user.id, user.email),
        supabase.from('chemical_orders').select('*, product:chemical_products(*)').eq('user_id', user.id),
        supabase.from('funding_submissions').select('*').eq('user_id', user.id)
      ]);

      await fetchRecentActivity(user.id);

      // Consolidate all "operations"
      const allOps: any[] = [];
      
      // 1. Commodity Requests
      (reqs || []).forEach((r: any) => {
        if (r.status !== 'failed') {
          allOps.push({
            id: r.id,
            name: r.metadata?.title || `Protocol ${r.id.slice(0, 8)}`,
            commodity: r.metadata?.commodity || "General Cargo",
            stage: r.stage ? r.stage.replace('_', ' ').toUpperCase() : "INITIATED",
            shipment: r.metadata?.shipment,
            time: r.updated_at ? new Date(r.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
            type: 'request'
          });
        }
      });

      // 2. Chemical Orders
      (chemicalRes.data || []).forEach((o: any) => {
         allOps.push({
           id: o.id,
           name: o.product?.name || "Chemical Allocation",
           commodity: "Chemicals",
           stage: o.order_status?.toUpperCase() || "PENDING",
           shipment: `${o.quantity} ${o.product?.unit_type || 'units'}`,
           time: o.updated_at ? new Date(o.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
           type: 'chemical'
         });
      });

      // 3. Funding Submissions
      (fundingRes.data || []).forEach((f: any) => {
        allOps.push({
          id: f.id,
          name: "Investment Funding",
          commodity: f.asset_type || "Capital",
          stage: f.status?.toUpperCase() || "PROCESSING",
          shipment: `$${Number(f.amount).toLocaleString()}`,
          time: f.updated_at ? new Date(f.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
          type: 'funding'
        });
      });

      setRequests(reqs || []);
      setChemicalOrders(chemicalRes.data || []);
      setFundingSubmissions(fundingRes.data || []);
      setAggregatedOperations(allOps);
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
        const reqs = await fetchRequests(profile.id, profile.email);
        if (reqs && reqs.length > 0) {
           fetchRecentActivity(profile.id);
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

  const fetchRequests = async (userId: string, email?: string) => {
    // Primary query: things we ALREADY own or follow
    let orQuery = `broker_id.eq.${userId},buyer_id.eq.${userId},metadata->>buyer_id.eq.${userId}`;
    if (email) {
      // Use ilike for case-insensitive email matching in metadata
      orQuery += `,metadata->>email.ilike.${email}`;
    }

    const { data: reqs, error } = await supabase
      .from("requests")
      .select("*")
      .or(orQuery);
    
    if (error) console.error("[AUTH] fetchRequests error:", error);

    // Self-healing: if we found requests via email that don't have our buyer_id, claim them
    if (reqs && reqs.length > 0) {
      const unclaimedReqs = reqs.filter(r => !r.buyer_id && r.metadata?.email?.toLowerCase() === email?.toLowerCase());
      if (unclaimedReqs.length > 0) {
        const unclaimedIds = unclaimedReqs.map(r => r.id);
        console.log(`[AUTH] Claiming ${unclaimedIds.length} orphaned requests/messages for user ${userId}`);
        
        // Claim requests
        const { error: claimErr } = await supabase
          .from("requests")
          .update({ buyer_id: userId })
          .in("id", unclaimedIds);
          
        if (!claimErr) {
          // Claim associated messages so RLS allows reading them
          await supabase
            .from("messages")
            .update({ buyer_id: userId })
            .in("request_id", unclaimedIds);
            
          // Update the local state with claimed IDs set correctly
          reqs.forEach(r => {
            if (unclaimedIds.includes(r.id)) r.buyer_id = userId;
          });
        }
      }
    }
    
    setRequests(reqs || []);
    return reqs || [];
  };

  const fetchRecentActivity = async (userId: string) => {
    try {
      const { data: msgs, error } = await supabase
        .from("messages")
        .select("*")
        .eq("buyer_id", userId)
        .or('body.ilike.%[PROTOCOL UPDATE]%,body.ilike.%[System]%,body.ilike.%[SYSTEM RESPONSE]%')
        .order('created_at', { ascending: false })
        .limit(8);
      
      if (!error && msgs) {
        setActivities(msgs.map(m => ({
          title: m.body.replace('[PROTOCOL UPDATE] ', '').replace('[SYSTEM] ', '').replace('[System] ', '').replace('[SYSTEM RESPONSE] ', ''),
          time: new Date(m.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          type: m.body.includes('PROTOCOL') ? 'protocol' : (m.body.includes('RESPONSE') ? 'support' : 'logistics')
        })));
      }
    } catch (err) {
      console.error("Activity fetch error:", err);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/portal");
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      toast.error("Please enter a message.");
      return;
    }

    setIsSendingMessage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User session not found.");

      // For the demo, we'll try to find a relevant request to attach this message to,
      // or just log it as a general inquiry.
      // If no active request exists, we create a 'general' support request first.
      
      let targetRequestId = requests[0]?.id;
      let targetDealId = requests[0]?.deal_id;

      if (!targetRequestId) {
        // Fetch a default deal to satisfy the NOT NULL constraint if necessary
        const { data: defaultDeal } = await supabase.from('deals').select('id').limit(1).single();
        const placeholderDealId = defaultDeal?.id || "DR-2026-001";

        // Create a general inquiry request
        const { data: newReq, error: reqError } = await supabase
          .from('requests')
          .insert({
            name: profile?.full_name || user.email,
            company: profile?.org_name || "Private Individual",
            deal_id: placeholderDealId,
            status: 'pending',
            stage: 'initiated',
            type: 'support',
            metadata: {
              title: "General Strategic Consultation",
              commodity: "Advisory Services",
              type: "Support",
              buyer_id: user.id
            }
          })
          .select()
          .single();
        
        if (reqError) throw reqError;
        targetRequestId = newReq.id;
        targetDealId = newReq.deal_id;
      }

      // If we still don't have a deal_id (shouldn't happen with the logic above, but for safety)
      if (!targetDealId) {
        const { data: defaultDeal } = await supabase.from('deals').select('id').limit(1).single();
        targetDealId = defaultDeal?.id || "DR-2026-001";
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          request_id: targetRequestId,
          deal_id: targetDealId,
          buyer_id: user.id,
          sender_id: user.id,
          body: messageText.trim(),
          message: messageText.trim()
        });

      if (error) throw error;

      toast.success("Message transmitted securely to Advisor Vance.");
      setMessageText("");
      fetchHistory();
      
      // Refresh requests if we created a new one
      if (!requests[0]?.id) {
        fetchRequests(user.id, user.email);
      }
    } catch (err: any) {
      console.error("Message error:", err);
      toast.error("Failed to transmit message through secure channel.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const [history, setHistory] = useState<any[]>([]);

  const fetchHistory = async () => {
    const requestIds = requests.map(r => r.id);
    
    if (requestIds.length === 0) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .in('request_id', requestIds)
      .order('created_at', { ascending: true });
    
    if (!error) setHistory(data || []);
  };

  useEffect(() => {
    if (!isMessageModalOpen || !profile?.id) return;

    fetchHistory();

    const channel = supabase
      .channel('client-messages-sync')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        // If the message is for one of the user's requests, refresh history
        if (requests.some(r => r.id === payload.new.request_id)) {
           fetchHistory();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMessageModalOpen, profile?.id, requests.length]);
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Derive stats from real data
  
  // 1. Contracts: Commodity requests + Chemical orders (if active)
  const activeContracts = [
    ...requests.filter(r => r.status !== 'failed' && ['escrow', 'shipment', 'contract_issued'].includes(r.stage)),
    ...chemicalOrders.filter(o => o.order_status !== 'completed' && o.order_status !== 'failed')
  ];
  
  // 2. Shipments: Commodity shipment metadata + Chemical orders (as shipments)
  const pendingShipments = [
    ...requests.filter(r => r.status !== 'failed' && r.metadata?.shipment && r.metadata.shipment.status !== 'delivered'),
    ...chemicalOrders.filter(o => o.order_status === 'shipped')
  ];
  
  const stats = [
    { title: "Active Contracts", value: (activeContracts.length).toString(), icon: FileText, color: "text-blue-400" },
    { title: "Pending Shipments", value: pendingShipments.length.toString(), icon: Package, color: "text-gold" },
    { title: "Escrow Protocol", value: requests.filter(r => r.stage === 'escrow').length.toString(), icon: Shield, color: "text-green-400" },
    { title: "Notifications", value: activities.length.toString(), icon: Bell, color: "text-gold" },
  ];

  const operations = aggregatedOperations.slice(0, 6);

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
                  {operations.slice(0, 5).length > 0 ? operations.slice(0, 5).map((op) => (
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
                  {operations.length > 5 && (
                    <Link to="/activity-center" className="inline-flex items-center text-gold text-sm font-bold hover:underline mt-2">
                       View All Operations <ArrowUpRight className="ml-1 w-4 h-4" />
                    </Link>
                  )}
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
                    { name: "New Request", path: "/contact", state: { inquiryType: "trade", prefillMessage: "Protocol activation requested for new commodity sourcing." } },
                    { name: "Contact Agent", path: "/contact", state: { inquiryType: "partnership", prefillMessage: "Strategic advisor consultation requested." } }
                  ].map((action) => (
                    <Button 
                      key={action.name} 
                      variant="outline" 
                      className="h-16 border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold"
                      onClick={() => navigate(action.path || "#", { state: action.state })}
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
                    <Button 
                      className="w-full bg-gold text-background font-bold gap-2 hover:bg-gold-light transition-all"
                      onClick={() => setIsMessageModalOpen(true)}
                    >
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
                  {activities.slice(0, 5).length > 0 ? activities.slice(0, 5).map((activity, i) => (
                    <div key={i} className="flex gap-4 relative">
                      {i !== activities.slice(0, 5).length - 1 && (
                        <div className="absolute left-[7px] top-4 bottom-[-24px] w-[2px] bg-white/5" />
                      )}
                      <div className={`w-4 h-4 rounded-full ${activity.type === 'protocol' ? 'bg-blue-500' : (activity.type === 'support' ? 'bg-green-500' : 'bg-gold')} shrink-0 mt-1 shadow-[0_0_8px_rgba(212,175,55,0.3)]`} />
                      <div>
                        <h4 className="text-sm text-white font-medium leading-tight">{activity.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[9px] text-gray-500 uppercase tracking-widest">{activity.time}</p>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${activity.type === 'protocol' ? 'bg-blue-500/10 text-blue-400' : (activity.type === 'support' ? 'bg-green-500/10 text-green-400' : 'bg-gold/10 text-gold')}`}>
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
                  {activities.length > 5 && (
                    <Link to="/activity-center" className="inline-flex items-center text-gold text-sm font-bold hover:underline mt-2">
                       View All Activities <ArrowUpRight className="ml-1 w-4 h-4" />
                    </Link>
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

      {/* Secure Messaging Modal */}
      <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-secondary border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-white flex items-center gap-2">
              <Shield className="text-gold w-6 h-6" /> Secure Protocol
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Your communication with Alexander Vance is encrypted and stored according to our strict internal security policies.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-6">
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
              {history.map((msg, i) => (
                <div key={i} className={`flex flex-col gap-1 ${msg.sender_role === 'admin' ? 'items-start' : 'items-end'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-xs ${
                    msg.sender_role === 'admin' 
                      ? 'bg-gold/10 text-white border border-gold/20 rounded-tl-none' 
                      : 'bg-white/5 text-white border border-white/10 rounded-tr-none'
                  }`}>
                    <p className="leading-relaxed">
                      {msg.body.replace('[SYSTEM RESPONSE] ', '').replace('[SYSTEM] ', '').replace('[System] ', '')}
                    </p>
                  </div>
                  <p className="text-[8px] text-gray-500 uppercase font-black px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
              {history.length === 0 && (
                <div className="text-center py-10 opacity-30">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gold" />
                  <p className="text-[10px] font-black uppercase tracking-tighter">Secure line established. Awaiting transmission.</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                <img src="https://picsum.photos/seed/vance/100/100" alt="Vance" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-grow">
                <p className="text-sm font-bold text-white">Alexander Vance</p>
                <p className="text-[10px] text-gold uppercase font-black tracking-widest">Strategic Advisor • Online</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Secure Transmission Body</label>
              <Textarea 
                placeholder="Enter your confidential inquiry here..." 
                className="bg-background border-white/10 text-white min-h-[100px] resize-none focus:ring-gold"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsMessageModalOpen(false)}
              className="border-white/10 text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button 
              className="bg-gold text-background font-bold gap-2"
              onClick={handleSendMessage}
              disabled={isSendingMessage}
            >
              {isSendingMessage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Transmitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send Protocol
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
