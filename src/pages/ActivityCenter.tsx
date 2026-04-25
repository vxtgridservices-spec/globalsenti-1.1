import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { Navbar } from "@/src/components/layout/Navbar";
import { Footer } from "@/src/components/layout/Footer";
import { Card, CardContent } from "@/src/components/ui/card";
import { Package, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export function ActivityCenter() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [aggregatedOperations, setAggregatedOperations] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/portal");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      setProfile(profile);

      // Fetch all requests
      let orQuery = `broker_id.eq.${user.id},buyer_id.eq.${user.id},metadata->>buyer_id.eq.${user.id}`;
      // Use ilike for case-insensitive email matching
      if (user.email) orQuery += `,metadata->>email.ilike.${user.email}`;

      const [reqsRes, chemicalRes, fundingRes, msgsRes] = await Promise.all([
        supabase.from("requests").select("*").or(orQuery),
        supabase.from('chemical_orders').select('*, product:chemical_products(*)').eq('user_id', user.id),
        supabase.from('funding_submissions').select('*').eq('user_id', user.id),
        supabase.from("messages")
          .select("*")
          .eq("buyer_id", user.id)
          .or('body.ilike.%[PROTOCOL UPDATE]%,body.ilike.%[System]%,body.ilike.%[SYSTEM RESPONSE]%')
          .order('created_at', { ascending: false })
      ]);

      // Consolidate all "operations"
      const allOps: any[] = [];
      
      (reqsRes.data || []).forEach((r: any) => {
        if (r.status !== 'failed') {
          allOps.push({ id: r.id, name: r.metadata?.title || `Protocol ${r.id.slice(0, 8)}`, commodity: r.metadata?.commodity || "General Cargo", stage: r.stage ? r.stage.replace('_', ' ').toUpperCase() : "INITIATED", type: 'request' });
        }
      });
      (chemicalRes.data || []).forEach((o: any) => {
         allOps.push({ id: o.id, name: o.product?.name || "Chemical Allocation", commodity: "Chemicals", stage: o.order_status?.toUpperCase() || "PENDING", type: 'chemical' });
      });
      (fundingRes.data || []).forEach((f: any) => {
        allOps.push({ id: f.id, name: "Investment Funding", commodity: f.asset_type || "Capital", stage: f.status?.toUpperCase() || "PROCESSING", type: 'funding' });
      });

      setAggregatedOperations(allOps);

      if (msgsRes.data) {
        setActivities(msgsRes.data.map(m => ({
          title: m.body.replace('[PROTOCOL UPDATE] ', '').replace('[SYSTEM] ', '').replace('[System] ', '').replace('[SYSTEM RESPONSE] ', ''),
          time: new Date(m.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          type: m.body.includes('PROTOCOL') ? 'protocol' : (m.body.includes('RESPONSE') ? 'support' : 'logistics')
        })));
      }
      setLoading(false);
    };

    checkUser();
  }, [navigate]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col pt-32">
      <Navbar />
      <main className="container mx-auto max-w-6xl pb-20 px-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gold mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
        <h1 className="text-4xl font-serif text-white mb-12">Activity Center</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <section>
                <h2 className="text-2xl font-bold text-white mb-6">All Operations</h2>
                <div className="space-y-4">
                    {aggregatedOperations.map((op) => (
                        <Card key={op.id} className="bg-secondary/20 border-white/5">
                            <CardContent className="p-4 flex items-center gap-4">
                                <Package className="text-gold w-6 h-6" />
                                <div>
                                    <h3 className="text-white font-bold">{op.name}</h3>
                                    <p className="text-xs text-muted-foreground">{op.commodity} • {op.stage}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
            <section>
                <h2 className="text-2xl font-bold text-white mb-6">Activity Feed</h2>
                <div className="space-y-6">
                  {activities.map((activity, i) => (
                    <div key={i} className="flex gap-4">
                      <div className={`w-3 h-3 rounded-full ${activity.type === 'protocol' ? 'bg-blue-500' : (activity.type === 'support' ? 'bg-green-500' : 'bg-gold')} shrink-0 mt-1`} />
                      <div>
                        <h4 className="text-sm text-white">{activity.title}</h4>
                        <p className="text-[10px] text-gray-500 uppercase">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
            </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
