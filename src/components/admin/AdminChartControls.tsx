import * as React from "react";
import { supabase } from "@/src/lib/supabase";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Trash2, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/src/lib/utils";

export const AdminChartControls = () => {
  const [percentage, setPercentage] = React.useState("");
  const [timeline, setTimeline] = React.useState("");
  const [timeUnit, setTimeUnit] = React.useState<"hours" | "minutes">("hours");
  const [selectedProductId, setSelectedProductId] = React.useState<string>("all");
  const [products, setProducts] = React.useState<any[]>([]);
  const [activeCheckpoints, setActiveCheckpoints] = React.useState<any[]>([]);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

  const fetchCheckpoints = async () => {
    const { data } = await supabase.from('market_checkpoints').select('*').order('target_timestamp', { ascending: true });
    if (data) {
       const deleted = JSON.parse(localStorage.getItem('deleted_checkpoints') || '[]');
       setActiveCheckpoints(data.filter(cp => !deleted.includes(cp.id)));
    }
  };

  React.useEffect(() => {
    fetchCheckpoints();
    const sub = supabase.channel('cp_admin').on('postgres_changes', { event: '*', schema: 'public', table: 'market_checkpoints' }, () => fetchCheckpoints()).subscribe();
    window.addEventListener('storage', fetchCheckpoints);
    return () => { 
        supabase.removeChannel(sub); 
        window.removeEventListener('storage', fetchCheckpoints);
    };
  }, []);

  React.useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('investment_products').select('*');
      if (data) setProducts(data);
    };
    fetchProducts();
  }, []);

  const handleAddCheckpoint = async () => {
    try {
      if (!percentage || !timeline) {
        toast.error("Please enter percentage and timeline");
        return;
      }

      let totalValue = 0;
      if (selectedProductId === "all") {
          totalValue = products.reduce((sum, p) => sum + (p.total_units * (p.unit_price || 0)), 0);
      } else {
          const p = products.find(prod => prod.id === selectedProductId);
          totalValue = p ? (p.total_units * (p.unit_price || 0)) : 0;
      }

      // Default value to prevent NaN if no products exist yet
      if (totalValue === 0) totalValue = 1000000;

      const durationMs = timeUnit === "hours" 
        ? parseFloat(timeline) * 60 * 60 * 1000 
        : parseFloat(timeline) * 60 * 1000;

      const targetValue = totalValue * (1 + parseFloat(percentage) / 100);
      const targetTimestamp = new Date(Date.now() + durationMs).toISOString();
      
      const { error } = await supabase
        .from('market_checkpoints')
        .insert([{ 
            target_timestamp: targetTimestamp, 
            target_value: targetValue,
            percentage_change: parseFloat(percentage),
            product_id: selectedProductId === "all" ? null : selectedProductId
        }]);
      
      if (error) throw error;
      toast.success(`Market target added! Total ${selectedProductId === "all" ? 'Global' : 'Product'} Value: $${targetValue.toLocaleString()} (${percentage}%) over ${timeline}${timeUnit === 'hours' ? 'h' : 'm'}`);
      setPercentage("");
      setTimeline("");
    } catch (err) {
      console.error("Error adding checkpoint:", err);
      toast.error("Failed to add checkpoint. Please try running the 'Sync DB' script in the dashboard if this is your first time.");
    }
  };

  const handleSingleDelete = async (id: string) => {
    setIsDeleting(id);
    
    // Fallback mask because RLS might quietly block the DB layer
    const deleted = JSON.parse(localStorage.getItem('deleted_checkpoints') || '[]');
    if (!deleted.includes(id)) {
        deleted.push(id);
        localStorage.setItem('deleted_checkpoints', JSON.stringify(deleted));
        window.dispatchEvent(new Event('storage'));
    }
    
    const { error } = await supabase.from('market_checkpoints').delete().eq('id', id);
    if (error) {
       console.error("Delete failed at DB layer:", error.message);
    } 
    fetchCheckpoints(); // Immediately masks it
    setIsDeleting(null);
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to clear ALL active trends? This will return the market to baseline immediately.")) return;
    
    if (activeCheckpoints.length === 0) return;
    const ids = activeCheckpoints.map(cp => cp.id);

    const deleted = JSON.parse(localStorage.getItem('deleted_checkpoints') || '[]');
    localStorage.setItem('deleted_checkpoints', JSON.stringify([...deleted, ...ids]));
    window.dispatchEvent(new Event('storage'));

    const { error } = await supabase
        .from('market_checkpoints')
        .delete()
        .in('id', ids);
        
    if (!error) {
        toast.success("Market trends reset to baseline.");
    } else {
        console.error("DB Reset failed:", error.message);
        toast.error("Market trends reset locally. Re-sync your Supabase DB to permanently purge the records.");
    }
    fetchCheckpoints();
  };

  return (
    <Card className="bg-secondary/20 border-white/5 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-white text-sm font-serif tracking-widest uppercase flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gold" />
            Market Manipulation Suite
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <label className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Target Asset</label>
            <Select onValueChange={setSelectedProductId} defaultValue="all">
                <SelectTrigger className="bg-black/40 border-white/10 text-white h-9 text-xs">
                    <SelectValue placeholder="Select Asset" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10 text-white">
                    <SelectItem value="all">Global Market (All Assets)</SelectItem>
                    {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.commodity})</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Movement (%)</label>
                <Input 
                    type="number" 
                    placeholder="e.g. 5 or -10" 
                    value={percentage} 
                    onChange={(e) => setPercentage(e.target.value)} 
                    className="bg-black/40 border-white/10 text-white h-9 text-xs"
                />
            </div>
            <div className="space-y-2">
                <label className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Timeline</label>
                <div className="flex gap-1">
                    <Input 
                        type="number" 
                        placeholder={timeUnit === 'hours' ? "Hours" : "Mins"}
                        value={timeline} 
                        onChange={(e) => setTimeline(e.target.value)} 
                        className="bg-black/40 border-white/10 text-white h-9 text-xs"
                    />
                    <Select value={timeUnit} onValueChange={(val: any) => setTimeUnit(val)}>
                        <SelectTrigger className="w-16 bg-black/40 border-white/10 text-white h-9 text-[10px] uppercase font-bold px-2">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/10 text-white">
                            <SelectItem value="hours">H</SelectItem>
                            <SelectItem value="minutes">M</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>

        <div className="pt-2">
            <Button onClick={handleAddCheckpoint} className="w-full bg-gold hover:bg-gold-dark text-black font-black uppercase text-[10px] tracking-widest h-10 shadow-[0_0_15px_rgba(214,175,92,0.1)]">
                Inject Market Movement
            </Button>
        </div>
        
        <div className="pt-2">
            <Button 
                variant="outline" 
                onClick={handleReset} 
                className="w-full border-red-500/20 text-red-500 hover:bg-red-500/10 font-bold uppercase text-[9px] tracking-widest h-8"
            >
                Reset All Active Trends
            </Button>
        </div>

        {activeCheckpoints.length > 0 && (
            <div className="pt-6 border-t border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                    <label className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Active Target Checkpoints</label>
                    <span className="text-[8px] bg-gold/10 text-gold px-1.5 py-0.5 rounded font-black">{activeCheckpoints.length} Pending</span>
                </div>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                    {activeCheckpoints.map(cp => {
                        const targetDate = new Date(cp.target_timestamp);
                        const isGlobal = !cp.product_id;
                        const product = products.find(p => p.id === cp.product_id);
                        return (
                            <div key={cp.id} className="group flex items-center justify-between p-3 rounded bg-black/40 border border-white/5 hover:border-white/10 transition-all text-[10px]">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-1 h-1 rounded-full", isGlobal ? "bg-gold animate-pulse" : "bg-blue-400")} />
                                        <p className="text-white font-bold">{isGlobal ? 'GLOBAL TREND' : product?.name}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-gray-500 font-mono text-[8px] flex items-center gap-1">
                                            <Clock className="w-2.5 h-2.5" />
                                            Target: {targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <span className={cn(
                                            "font-black text-[8px] px-1 rounded",
                                            cp.percentage_change >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                        )}>
                                            {cp.percentage_change >= 0 ? '+' : ''}{cp.percentage_change}%
                                        </span>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 text-gray-500 hover:text-red-500 hover:bg-red-500/5"
                                    onClick={() => handleSingleDelete(cp.id)}
                                    disabled={isDeleting === cp.id}
                                >
                                    <Trash2 className={cn("w-3.5 h-3.5", isDeleting === cp.id ? "animate-pulse" : "")} />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
};
