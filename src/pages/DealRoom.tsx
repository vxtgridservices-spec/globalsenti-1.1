import * as React from "react";
import { PageLayout } from "@/src/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { 
  Gem, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  FileCheck, 
  TrendingUp,
  Info,
  Crown,
  Award,
  Loader2,
  BadgeCheck,
  Briefcase
} from "lucide-react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { Deal } from "@/src/data/deals";
import { cn } from "@/src/lib/utils";

export function DealRoom() {
  const navigate = useNavigate();
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        let currentUserProfile = null;
        const { data: { user } } = await supabase.auth.getUser();
        const currentUser = user;
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          currentUserProfile = data;
          setProfile(data);
        }

        const { data: dealsData, error } = await supabase
          .from('deals')
          .select('*')
          .eq('status', 'Available')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        let processedDeals = dealsData || [];

        // If user is a broker, only show deals they are facilitating
        if (profile?.role === 'broker' && currentUser) {
          const { data: facilitatedReqs } = await supabase
            .from('requests')
            .select('deal_id')
            .eq('broker_id', currentUser.id);
          
          const facilitatedDealIds = new Set((facilitatedReqs || []).map(r => r.deal_id));
          
          processedDeals = processedDeals.filter(d => 
            d.broker_id === currentUser.id || facilitatedDealIds.has(d.id)
          );
        }

        // If we need broker tiers, we could fetch them here. For now, assume basic or fetch manually
        const brokerIds = [...new Set(processedDeals.map(d => d.broker_id).filter(Boolean))];
        let profilesMap: Record<string, any> = {};
        if (brokerIds.length > 0) {
          const { data: brokers } = await supabase.from('profiles').select('id, tier, role').in('id', brokerIds);
          if (brokers) {
            profilesMap = brokers.reduce((acc, b) => ({ ...acc, [b.id]: b }), {});
          }
        }

        const isAdminDeal = (deal: any) => {
          if (!deal.broker_id) return true; // Seed data
          return profilesMap[deal.broker_id]?.role === 'admin';
        };

        const enrichedDeals = processedDeals.map(deal => ({
          ...deal,
          is_admin_deal: isAdminDeal(deal),
          computed_tier: (deal.broker_id && profilesMap[deal.broker_id]?.tier) ? profilesMap[deal.broker_id].tier : 'basic'
        }));

        // Sort priority: Admin deals first, then by tier (elite > premium > verified > basic)
        const tierOrder = { elite: 3, premium: 2, verified: 1, basic: 0 };
        processedDeals = enrichedDeals.sort((a, b) => {
          // Admin deals always first
          if (a.is_admin_deal && !b.is_admin_deal) return -1;
          if (!a.is_admin_deal && b.is_admin_deal) return 1;
          
          // Then by tier
          return (tierOrder[b.computed_tier as keyof typeof tierOrder] || 0) - (tierOrder[a.computed_tier as keyof typeof tierOrder] || 0);
        });

        // Optional: Filter private deals (Elite only)
        const currentUserTier = currentUserProfile?.tier || 'basic';
        if (currentUserTier !== 'elite') {
          processedDeals = processedDeals.filter(d => !d.is_private);
        }

        if (!dealsData || dealsData.length === 0) {
          // Seed data if empty
          const seedDeals = [
            {
              id: "DR-2024-001",
              type: "Gold",
              title: "AU Bullion - 500kg Spot",
              location: "Dubai, UAE",
              purity: "99.99%",
              quantity: "500kg",
              price: "Market -2%",
              status: "Available",
              commodityType: "Gold Bullion",
              origin: "Ghana",
              form: "1kg Standard Bars",
              created_at: new Date().toISOString()
            },
            {
              id: "DR-2024-002",
              type: "Diamonds",
              title: "Rough Diamonds - 12,000 Carats",
              location: "Antwerp, Belgium",
              purity: "Mixed Clarity",
              quantity: "12,000 Carats",
              price: "Private Offer",
              status: "Available",
              commodityType: "Rough Diamonds",
              origin: "Botswana",
              form: "Rough Uncut",
              created_at: new Date().toISOString()
            },
            {
              id: "DR-2024-003",
              type: "Crude Oil",
              title: "Bonny Light Crude - 2M Barrels",
              location: "Nigeria",
              purity: "API 35",
              quantity: "2M Barrels",
              price: "Spot Contract",
              status: "Available",
              commodityType: "Crude Oil",
              origin: "Nigeria",
              form: "Bulk Liquid",
              created_at: new Date().toISOString()
            },
            {
              id: "DR-2024-004",
              type: "Natural Gas",
              title: "LNG Supply - 50,000 MT",
              location: "Qatar",
              purity: "Pipeline Grade",
              quantity: "50,000 MT",
              price: "Contract Based",
              status: "Available",
              commodityType: "Natural Gas",
              created_at: new Date().toISOString()
            },
            {
              id: "DR-2024-005",
              type: "Industrial Minerals",
              title: "Rare Earth Minerals - 5,000 MT",
              location: "Australia",
              purity: "High Grade",
              quantity: "5,000 MT",
              price: "Negotiable",
              status: "Available",
              commodityType: "Rare Earth Minerals",
              created_at: new Date().toISOString()
            },
            {
              id: "DR-2024-006",
              type: "Precious Stones",
              title: "Mixed Gemstones - 8,000 Carats",
              location: "Sri Lanka",
              purity: "Certified",
              quantity: "8,000 Carats",
              price: "Private Offer",
              status: "Available",
              commodityType: "Precious Stones",
              created_at: new Date().toISOString()
            }
          ];

          const { data: insertedData, error: insertError } = await supabase
            .from('deals')
            .upsert(seedDeals, { onConflict: 'id' })
            .select();

          if (insertError) {
            console.warn("Seeding failed:", insertError);
            setDeals([]); // Fallback to empty if seeding fails
          } else {
            setDeals((insertedData || []).map(deal => ({
              ...deal,
              is_admin_deal: true, // Seed deals are admin deals
              computed_tier: 'basic'
            })));
          }
        } else {
          setDeals(processedDeals);
        }
      } catch (error) {
        console.error("Error fetching deals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  return (
    <PageLayout title="Private Deal Room" subtitle="Exclusive high-value commodity opportunities for verified partners.">
      <div className="container mx-auto px-4 py-12">
        <div className="bg-gold/10 border border-gold/20 rounded-xl p-6 mb-12 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center shrink-0">
            <Lock className="text-background w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              {profile?.verification_status === "verified" ? "Verified Broker Status" : 
               profile?.verification_status === "pending" ? "Verification In Progress" :
               profile?.verification_status === "rejected" ? "Verification Failed" :
               "Verified Access Only"}
            </h3>
            <p className="text-gray-400">
              {profile?.verification_status === "verified" ? 
                "Your account is fully verified. You have access to list commodities and manage private deals." :
                "All listings in this room are subject to strict KYC/AML verification. Brokers must complete identity verification to list deals."}
            </p>
          </div>
          <div className="md:ml-auto flex gap-3">
            {profile?.verification_status === "verified" ? (
              <div className="flex flex-col gap-2">
                <Button 
                  className="bg-gold text-background font-bold whitespace-nowrap"
                  onClick={() => {
                    if (profile?.role === 'admin') navigate("/admin/deals");
                    else navigate("/broker/deals");
                  }}
                >
                  List Commodity
                </Button>
                <Button 
                  variant="outline" 
                  className="border-gold/30 text-gold text-xs h-8"
                  onClick={() => {
                    if (profile?.role === 'admin') navigate("/admin");
                    else navigate("/broker");
                  }}
                >
                  Switch to {profile?.role === 'admin' ? 'Admin' : 'Broker'} Mode
                </Button>
              </div>
            ) : (
              <Button 
                className="bg-gold text-background font-bold whitespace-nowrap"
                onClick={() => navigate("/verify-broker")}
              >
                {profile?.verification_status === "pending" ? "View Status" : 
                 profile?.verification_status === "rejected" ? "Retry Verification" : 
                 "Update Verification"}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-2xl font-serif font-bold text-white mb-6">Active Listings</h2>
            
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 text-gold animate-spin" />
              </div>
            ) : deals.length === 0 ? (
              <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <Info className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 font-serif text-lg">Currently no active deals available</p>
                <p className="text-gray-500 text-sm mt-2">Please check back later or contact a broker for private sourcing.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {deals.map((deal, index) => (
                  <motion.div
                    key={deal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-white/5 border-white/10 hover:border-gold/50 transition-all group">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-1 rounded bg-gold/20 text-gold text-[10px] font-bold uppercase tracking-wider">
                                {deal.type}
                              </span>
                              <span className="text-gray-500 text-xs">ID: {deal.id}</span>
                              {deal.computed_tier && deal.computed_tier !== 'basic' && (
                                <div className={cn(
                                  "flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                                  deal.computed_tier === 'elite' ? "bg-purple-500/20 text-purple-400" :
                                  deal.computed_tier === 'premium' ? "bg-amber-500/20 text-amber-400" :
                                  "bg-blue-500/20 text-blue-400"
                                )}>
                                  {deal.computed_tier === 'elite' ? <Crown className="w-3 h-3" /> : <Award className="w-3 h-3" />}
                                  {deal.computed_tier}
                                </div>
                              )}
                              {deal.is_admin_deal ? (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px] font-bold uppercase tracking-wider">
                                  <BadgeCheck className="w-3 h-3" /> Direct Supply
                                </div>
                              ) : (
                                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                  <Briefcase className="w-3 h-3 text-gold/50" /> Broker Facilitated Deal
                                </div>
                              )}
                            </div>
                            <h3 className="text-xl font-bold text-white group-hover:text-gold transition-colors">
                              {deal.title}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Location</p>
                                <p className="text-sm text-white">{deal.location}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Purity/Spec</p>
                                <p className="text-sm text-white">{deal.purity}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Pricing</p>
                                <p className="text-sm text-gold font-bold">{deal.price}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col justify-between items-end gap-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              deal.status === 'Available' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'
                            }`}>
                              {deal.status}
                            </span>
                            <Button 
                              className="bg-white/10 hover:bg-gold hover:text-background text-white font-bold transition-all"
                              onClick={() => navigate(`/deal/${deal.id}`)}
                            >
                              View Full Manifest <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-8">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gold" />
                  Market Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded bg-white/5">
                  <span className="text-white text-sm">Gold (XAU)</span>
                  <span className="text-green-500 text-sm font-bold">+1.24%</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded bg-white/5">
                  <span className="text-white text-sm">Brent Crude</span>
                  <span className="text-red-500 text-sm font-bold">-0.45%</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded bg-white/5">
                  <span className="text-white text-sm">Silver (XAG)</span>
                  <span className="text-green-500 text-sm font-bold">+0.82%</span>
                </div>
                <Button nativeButton={false} variant="link" className="text-gold w-full text-center mt-2" render={<Link to="/intelligence" />}>
                  View Full Market Intelligence
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-gold" />
                  Due Diligence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-gray-400">
                  Sentinel Group provides full escrow and inspection services for all listed deals.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-white">
                    <FileCheck className="w-4 h-4 text-gold" /> SGS Inspection Guaranteed
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white">
                    <FileCheck className="w-4 h-4 text-gold" /> Secure Escrow via Tier-1 Banks
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white">
                    <FileCheck className="w-4 h-4 text-gold" /> Full Logistics Integration
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 rounded-xl border border-white/10 bg-gradient-to-br from-gold/10 to-transparent">
              <h4 className="text-white font-bold mb-2">Need a Custom Sourcing?</h4>
              <p className="text-xs text-gray-400 mb-4">
                If you don't see what you're looking for, our global network can source specific commodities on request.
              </p>
              <Button 
                className="w-full bg-gold text-background font-bold"
                onClick={() => navigate("/contact")}
              >
                Request Private Sourcing
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
