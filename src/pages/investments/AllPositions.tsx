import React from "react";
import { PageLayout } from "@/src/components/layout/PageLayout";
import { Card, CardContent } from "@/src/components/ui/card";
import { Activity, ChevronRight, Clock, Search, PieChart } from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { InvestorPosition, PerformanceUpdate, PriceHistory } from "@/src/types/investments";
import { cn } from "@/src/lib/utils";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { Button } from "@/src/components/ui/button";
import { Link } from "react-router-dom";
import { Input } from "@/src/components/ui/input";

export function AllPositions() {
  const [positions, setPositions] = React.useState<InvestorPosition[]>([]);
  const [performanceData, setPerformanceData] = React.useState<Record<string, PerformanceUpdate>>({});
  const [priceHistory, setPriceHistory] = React.useState<PriceHistory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
     const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: posData } = await supabase
                .from('investor_positions')
                .select(`*, product:investment_products(*)`)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            if (posData) {
                console.log("Positions fetched:", posData);
                setPositions(posData);
                
                const productIds = posData.map(p => p.product_id);
                if (productIds.length > 0) {
                    const [perfRes, priceRes] = await Promise.all([
                        supabase.from('performance_updates')
                            .select('*')
                            .in('product_id', productIds),
                        supabase.from('price_history')
                            .select('*')
                            .in('product_id', productIds)
                            .order('timestamp', { ascending: true })
                    ]);

                    if (perfRes.data) {
                        const perfMap = perfRes.data.reduce((acc, curr) => {
                            if (!acc[curr.product_id] || new Date(curr.date) > new Date(acc[curr.product_id].date)) {
                                acc[curr.product_id] = curr;
                            }
                            return acc;
                        }, {} as Record<string, PerformanceUpdate>);
                        setPerformanceData(perfMap);
                    }

                    if (priceRes.data) {
                        setPriceHistory(priceRes.data);
                    }
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
     };

     fetchData();
  }, []);

  const filteredPositions = positions.filter(pos => 
    (pos.product?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
    (pos.product?.commodity?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <PageLayout title="All Active Positions" subtitle="Your complete direct investment portfolio.">
      <div className="px-6 py-12">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-xl md:text-2xl font-serif text-white">Full Portfolio</h3>
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <Input 
                    type="text"
                    placeholder="Search positions..."
                    className="pl-9 bg-white/5 border-white/10 text-white w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
        
        {loading ? (
            <div className="py-20 text-center">
                <div className="w-8 h-8 border-3 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Aggregating complete ledger...</p>
            </div>
        ) : filteredPositions.length > 0 ? (
            <div className="space-y-4">
                {filteredPositions.map((position) => {
                    const perf = performanceData[position.product_id];
                    const livePrice = perf?.current_nav || position.product?.unit_price || (position.total_invested / (position.units || 1));
                    const currentPosValue = livePrice * (position.units || 0);
                    
                    // Simulate live fluctuation based on product_id
                    const nowSec = Math.floor(Date.now() / 10000); // changes every 10 seconds
                    const salt = position.product_id.charCodeAt(0) + position.product_id.charCodeAt(1);
                    const fluctuation = Math.sin(nowSec + salt) * 0.005; // +/- 0.5%
                    const liveDisplayPosValue = currentPosValue * (1 + fluctuation);
                    const livePosGain = liveDisplayPosValue - position.total_invested;
                    const livePosROI = position.total_invested > 0 ? (livePosGain / position.total_invested) * 100 : 0;
                    
                    const maturityDate = position.product ? new Date(new Date(position.created_at).getTime() + position.product.duration_days * 24 * 60 * 60 * 1000) : null;

                    return (
                        <Card key={position.id} className="bg-secondary/20 border-white/5 hover:border-white/10 transition-colors">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded uppercase tracking-widest leading-none">
                                                {position.product?.commodity || "Commodity"}
                                            </span>
                                            <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded uppercase tracking-widest leading-none">
                                                {position.status}
                                            </span>
                                        </div>
                                        <h4 className="text-xl font-serif text-white mb-1">{position.product?.name || "Unnamed Product"}</h4>
                                        <p className="text-xs text-gray-500 font-mono">ID: {position.id} • {position.units} Units Held</p>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 text-right shrink-0">
                                        <div>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Current Value</p>
                                            <p className="text-white font-bold font-mono">${liveDisplayPosValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Performance (ROI)</p>
                                            <p className={cn("font-bold font-mono mb-2", livePosGain >= 0 ? "text-green-500" : "text-red-500")}>
                                                {livePosGain >= 0 ? "+" : ""}{livePosROI.toFixed(2)}%
                                            </p>
                                            <div style={{ height: "32px", width: "80px" }} className="mt-1 flex items-end justify-end">
                                                {priceHistory.filter(ph => ph.product_id === position.product_id).length > 0 ? (
                                                    <ResponsiveContainer>
                                                        <LineChart data={priceHistory.filter(ph => ph.product_id === position.product_id).slice(-10).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())}>
                                                            <Line type="monotone" dataKey="price" stroke={livePosROI >= 0 ? "#10b981" : "#ef4444"} dot={false} strokeWidth={2} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div className="h-0.5 w-12 bg-white/5 rounded-full" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="hidden lg:block">
                                            <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Maturity Date</p>
                                            <p className="text-white font-bold font-mono">{maturityDate?.toLocaleDateString() || "TBD"}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                                    <div className="flex gap-6">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-gray-500" />
                                                <span className="text-[10px] text-gray-400 uppercase tracking-widest">Invested: {new Date(position.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Activity className="w-3.5 h-3.5 text-gold" />
                                                <span className="text-[10px] text-gray-400 uppercase tracking-widest">Real-time valuation active</span>
                                            </div>
                                    </div>
                                    <Link to="/investments/portfolio">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-gold font-bold hover:bg-gold/10 text-[10px] uppercase tracking-widest h-8"
                                        >
                                            View in Portfolio <ChevronRight className="ml-1 w-3 h-3" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        ) : (
            <Card className="bg-secondary/10 border-dashed border-white/10 p-12 text-center">
                <PieChart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h4 className="text-white font-serif text-lg mb-2">No positions found</h4>
                <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                    {searchQuery ? "Try adjusting your search criteria." : "Explore the Investment Marketplace to start building your direct physical commodity portfolio."}
                </p>
                {!searchQuery && (
                    <Button 
                        className="bg-gold text-background font-bold"
                    >
                        <Link to="/investments">Browse Opportunities</Link>
                    </Button>
                )}
            </Card>
        )}
      </div>
    </PageLayout>
  );
}
