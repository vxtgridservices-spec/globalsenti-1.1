import * as React from "react";
import { PageLayout } from "@/src/components/layout/PageLayout";
import { AccessGuard } from "@/src/components/security/AccessGuard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  ChevronRight, 
  BarChart4, 
  PieChart, 
  Wallet,
  ArrowUpRight,
  Info,
  BadgeCheck,
  Building,
  Target,
  Loader2
} from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { InvestmentProduct } from "@/src/types/investments";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/src/components/ui/select";

export function InvestmentMarketplace() {
  const navigate = useNavigate();
  const [products, setProducts] = React.useState<InvestmentProduct[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedProduct, setSelectedProduct] = React.useState<InvestmentProduct | null>(null);
  const [investUnits, setInvestUnits] = React.useState(1);
  const [isInvesting, setIsInvesting] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState('Bank Wire');

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('investment_products')
          .select('*')
          .or('status.ilike.active,status.ilike.open')
          .order('created_at', { ascending: false });
        
        if (error) {
          if (error.code === '42P01') {
            console.warn("investment_products table does not exist yet.");
            setProducts([]);
          } else {
            throw error;
          }
        } else {
          setProducts(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch investment products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleConfirmInvestment = async () => {
    if (!selectedProduct) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
         navigate("/portal");
         return;
      }

      setIsInvesting(true);
      const totalAmount = investUnits * selectedProduct.unit_price;

      // VALIDATIONS
      if (investUnits > selectedProduct.units_available) {
          toast.error(`Error: Only ${selectedProduct.units_available} units available for purchase.`);
          setIsInvesting(false);
          return;
      }

      if (totalAmount < selectedProduct.min_investment) {
          toast.error(`Minimum investment for this product is $${selectedProduct.min_investment.toLocaleString()}`);
          setIsInvesting(false);
          return;
      }

      if (totalAmount > selectedProduct.max_allocation) {
          toast.error(`Maximum allocation for this product per investor is $${selectedProduct.max_allocation.toLocaleString()}`);
          setIsInvesting(false);
          return;
      }

      // 1. Create Subscription Record
      const { data, error } = await supabase.from('investment_subscriptions').insert([{
        user_id: user.id,
        product_id: selectedProduct.id,
        units: investUnits,
        unit_price_at_purchase: selectedProduct.unit_price,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        status: 'Awaiting Funding Instructions',
        created_at: new Date().toISOString()
      }]).select();

      if (error) throw error;

      // 2. Update available units on product
      const { error: updateError } = await supabase
        .from('investment_products')
        .update({ 
          units_available: selectedProduct.units_available - investUnits 
        })
        .eq('id', selectedProduct.id);
      
      if (updateError) {
        console.error("Failed to update available units:", updateError);
        // We still continue because the subscription was recorded, 
        // but this is a consistency issue.
      }

      toast.success(`ALLOCATION SECURED: Your purchase for ${investUnits} units of ${selectedProduct.name} has been reserved. Please complete the funding process in your portfolio to activate this investment.`, {
        duration: 10000,
      });
      navigate("/investments/portfolio");
    } catch (err: any) {
      console.warn("DB Error, check if 'investment_subscriptions' table exists:", err);
      // Fallback for demo
      toast.info("Subscription simulated. Action requires 'investment_subscriptions' table for cloud persistence.");
      navigate("/investments/portfolio");
    } finally {
      setIsInvesting(true);
      setTimeout(() => {
        setIsInvesting(false);
        setSelectedProduct(null);
      }, 1000);
    }
  };

  return (
    <AccessGuard section="investments">
    <PageLayout 
      title="Commodity Investments" 
      subtitle="Institutional-grade managed commodity investment products for strategic capital allocation."
    >
      <div className="container mx-auto px-4 py-8">
        {/* Market Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Assets Under Management", value: "$42.5M", icon: Wallet, color: "text-blue-400" },
            { label: "Avg. Historical ROI", value: "15.8%", icon: TrendingUp, color: "text-green-400" },
            { label: "Active Investors", value: "1,240", icon: Building, color: "text-gold" },
            { label: "Market Volatility Index", value: "Low", icon: BarChart4, color: "text-orange-400" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex"
            >
              <Card className="bg-secondary/20 border-white/5 h-full w-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{stat.label}</p>
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                  <p className="text-3xl font-serif text-white mt-auto">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-serif text-white mb-2">Investment Marketplace</h2>
            <p className="text-muted-foreground text-xs md:text-sm max-w-2xl leading-relaxed">
              Diversify your portfolio with direct access to physical commodity arbitrage, yield funds, and infrastructure-backed investments managed by Global Sentinel Group.
            </p>
          </div>
          <Button 
              variant="outline" 
              className="border-white/10 text-white hover:bg-white/5 font-bold w-full md:w-auto h-11"
              onClick={() => navigate("/investments/portfolio")}
          >
            <PieChart className="w-4 h-4 mr-2" /> My Portfolio
          </Button>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-serif">Accessing global investment vault...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center border border-white/5 bg-secondary/10 rounded-3xl">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-serif text-white mb-2">No active investment products available</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Our managed commodity products are currently in the structuring phase and will be published once compliance verification is complete.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-secondary/30 border-white/10 hover:border-gold/30 transition-all duration-500 group overflow-hidden h-full flex flex-col">
                  <div className="h-2 bg-gold/20 relative">
                     <div className="absolute inset-y-0 left-0 bg-gold w-1/3 group-hover:w-full transition-all duration-700" />
                  </div>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                       <span className={cn(
                           "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border",
                           product.risk_level === 'Low' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                           product.risk_level === 'Medium' ? "bg-gold/10 text-gold border-gold/20" :
                           "bg-red-500/10 text-red-500 border-red-500/20"
                       )}>
                           {product.risk_level} Risk
                       </span>
                       <span className="text-gray-500 text-[10px] uppercase font-mono tracking-widest">{product.commodity}</span>
                    </div>
                    <CardTitle className="text-xl font-serif text-white group-hover:text-gold transition-colors">{product.name}</CardTitle>
                    <CardDescription className="text-gray-400 text-xs line-clamp-2 mt-2">{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 flex-grow">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Target ROI</p>
                        <p className="text-lg text-white font-bold">{product.target_roi}% <span className="text-[10px] text-green-500 font-normal">Annualized</span></p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Term</p>
                        <p className="text-lg text-white font-bold">{product.duration_days} Days</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                         <div className="flex justify-between text-xs">
                             <span className="text-gray-400">Min. Investment</span>
                             <span className="text-white font-bold underline decoration-gold/50 underline-offset-4 font-mono">${product.min_investment.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between text-xs">
                             <span className="text-gray-400">Unit Price</span>
                             <span className="text-white font-bold font-mono">${product.unit_price.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between text-xs">
                             <span className="text-gray-400">Available Units</span>
                             <span className="text-white font-bold font-mono">{product.units_available}</span>
                         </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                            <ShieldCheck className="w-3.5 h-3.5 text-gold" /> Capital Protected Structure
                        </div>
                        <Button 
                            className="w-full bg-gold hover:bg-gold-light text-background font-bold tracking-[0.1em] uppercase text-xs h-11 group"
                            onClick={() => {
                                setSelectedProduct(product);
                                setInvestUnits(Math.ceil(product.min_investment / product.unit_price));
                            }}
                        >
                            Invest Now <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Marketplace Disclaimer */}
        <div className="mt-16 p-6 md:p-8 border border-white/5 bg-secondary/10 rounded-2xl">
          <div className="flex flex-col md:flex-row items-start gap-3 md:gap-4">
            <Info className="w-5 h-5 text-gold shrink-0 mt-0.5 md:mt-1" />
            <div>
              <h4 className="text-white font-bold mb-2 text-sm md:text-base">Qualified Investor Disclosure</h4>
              <p className="text-[12px] md:text-sm text-gray-400 leading-relaxed">
                Managed commodity investments involve risks, including the loss of principal. Performance targets are projections based on historical data and strategic analysis, and are not guaranteed. These products are available exclusively to qualified and accredited investors through Global Sentinel Group's secure administrative framework. Strategy notes represent the intended methodology and may be adjusted based on market volatility and physical commodity liquidity.
              </p>
            </div>
          </div>
        </div>

        {/* MODAL: INVESTMENT SUBSCRIPTION */}
        {selectedProduct && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    className="bg-secondary p-6 md:p-8 rounded-3xl border border-white/10 w-full max-w-lg shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gold" />
                    <h3 className="text-xl md:text-2xl font-serif text-white mb-2">Purchase Settlement</h3>
                    <p className="text-xs text-gray-500 mb-8 font-mono uppercase tracking-widest">{selectedProduct.name}</p>
                    
                    <div className="space-y-6 mb-8">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <Label className="text-[9px] uppercase text-gray-500 font-black tracking-widest mb-2 block">Unit Price</Label>
                                <p className="text-xl text-white font-bold font-mono">${selectedProduct.unit_price.toLocaleString()}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <Label className="text-[9px] uppercase text-gray-500 font-black tracking-widest mb-2 block">Min. Required</Label>
                                <p className="text-xl text-white font-bold font-mono">${selectedProduct.min_investment.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Select Investment Quantity (Units)</Label>
                            <div className="flex items-center gap-4">
                                <Input 
                                    type="number" 
                                    min={Math.ceil(selectedProduct.min_investment / selectedProduct.unit_price)}
                                    max={selectedProduct.units_available}
                                    className="bg-white/5 border-white/10 text-white h-14 text-2xl font-mono" 
                                    value={investUnits} 
                                    onChange={e => setInvestUnits(Math.max(1, Number(e.target.value)))} 
                                />
                                <div className="text-right">
                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest leading-none mb-1">Total Investment</p>
                                    <p className="text-2xl text-gold font-serif">${(investUnits * selectedProduct.unit_price).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Funding Method</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white h-12">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-secondary border-white/10 text-white">
                                    <SelectItem value="Bank Wire">International Bank Wire (USD/EUR/GBP)</SelectItem>
                                    <SelectItem value="Custody Transfer">Internal Custody Transfer (GS Pool)</SelectItem>
                                    <SelectItem value="USDT">Digital Asset Settlement (USDT/USDC)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="p-4 rounded-xl bg-gold/5 border border-gold/10">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-gold shrink-0" />
                                <div>
                                    <p className="text-xs text-gold font-bold mb-1 tracking-tight">Security & Custody</p>
                                    <p className="text-[10px] text-gold/70 leading-relaxed font-medium">Your investment is backed by physical {selectedProduct.commodity} reserves held in Global Sentinel secure vaults. Managed by our institutional arbitrage protocols.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button 
                            className="w-full bg-gold hover:bg-gold-light text-background font-bold h-14 gap-2 transition-all"
                            onClick={handleConfirmInvestment}
                            disabled={isInvesting || (investUnits * selectedProduct.unit_price < selectedProduct.min_investment)}
                        >
                            {isInvesting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>Confirm Capital Allocation <ArrowUpRight className="w-4 h-4" /></>
                            )}
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="text-gray-500 hover:text-white text-xs h-10" 
                            onClick={() => setSelectedProduct(null)}
                        >
                            Abort Purchase
                        </Button>
                    </div>
                </motion.div>
            </div>
        )}
      </div>
    </PageLayout>
    </AccessGuard>
  );
}
