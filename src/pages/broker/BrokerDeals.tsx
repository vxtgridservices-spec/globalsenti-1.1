import * as React from "react";
import { BrokerLayout } from "@/src/components/broker/BrokerLayout";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/src/components/ui/table";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ExternalLink,
  Filter,
  ShieldAlert
} from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/src/components/ui/dialog";
import { Label } from "@/src/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/src/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { Deal } from "@/src/data/deals";
import { Loader2 } from "lucide-react";

export function BrokerDeals() {
  const navigate = useNavigate();
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [profile, setProfile] = React.useState<any>(null);
  const [newDeal, setNewDeal] = React.useState<Partial<Deal>>({
    type: "Gold",
    status: "Available",
    commodityType: "Gold Bullion",
    quantity: "",
    price: "",
    location: "",
    purity: "",
    title: ""
  });

  const fetchDeals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profile);

      // Fetch only deals belonging to this broker
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('broker_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDeals(data || []);
      
    } catch (error) {
      console.error("Error fetching broker deals:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDeals();
  }, []);

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile?.verification_status !== "verified") return;

    // Enforce limits
    const tier = profile?.tier || 'basic';
    const activeDealsCount = deals.filter(d => d.status === 'Available').length;
    
    if (tier === 'verified' && activeDealsCount >= 3) {
      toast.error("Verification tier limit reached (Max 3 active deals). Upgrade to Premium for 10 deals.");
      return;
    }
    if (tier === 'premium' && activeDealsCount >= 10) {
      toast.error("Premium tier limit reached (Max 10 active deals). Upgrade to Elite for unlimited.");
      return;
    }
    if (tier === 'basic') {
      toast.error("Basic brokers cannot publish deals. Complete verification first.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const dealToInsert = {
        ...newDeal,
        id: `DR-${Date.now().toString().slice(-6)}`,
        broker_id: user?.id,
        created_at: new Date().toISOString(),
        pricing: { type: "Spot", marketPosition: "Market", currency: "USD", paymentTerms: "MT103" },
        logistics: { deliveryTerms: "FOB", shippingPort: "TBD", inspectionAgency: "SGS", insurance: "Full" },
        compliance: { kyc: "Required", aml: "Required", sellerStatus: "Verified" },
        conditions: { moq: "1 unit", contractDuration: "Spot", exclusivity: "None" },
        documents: []
      };

      const { data, error } = await supabase
        .from('deals')
        .insert([dealToInsert])
        .select();
      
      if (error) throw error;
      
      setDeals([data[0], ...deals]);
      setIsAddModalOpen(false);
      toast.success("Listing published successfully.");
      setNewDeal({
        type: "Gold",
        status: "Available",
        commodityType: "Gold Bullion",
        quantity: "",
        price: "",
        location: "",
        purity: "",
        title: ""
      });
    } catch (error) {
      console.error("Error adding deal:", error);
      toast.error("Failed to add deal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setDeals(deals.filter(d => d.id !== id));
      toast.success("Listing deleted successfully.");
    } catch (error) {
      console.error("Error deleting deal:", error);
      toast.error("Failed to delete.");
    }
  };

  return (
    <BrokerLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-serif text-white mb-2">My Listings</h1>
            <p className="text-gray-400">Manage your private commodity offerings.</p>
          </div>
          
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger render={<Button className="bg-gold text-background font-bold gap-2 h-12 px-6">
                <Plus className="w-5 h-5" /> Create New Listing
              </Button>} />
            <DialogContent className="bg-secondary border-white/10 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-serif text-gold">List New Commodity</DialogTitle>
              </DialogHeader>
              
              {profile?.verification_status !== "verified" && (
                <div className="p-4 rounded-xl bg-red-400/10 border border-red-400/20 mb-4 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-white font-bold">Verification Required</p>
                    <p className="text-xs text-gray-400">Only verified brokers can publish listings.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleAddDeal} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input 
                      required 
                      placeholder="e.g. AU Bullion - 50kg Spot" 
                      className="bg-white/5 border-white/10 text-white"
                      value={newDeal.title}
                      onChange={e => setNewDeal({...newDeal, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Commodity Type</Label>
                    <Select 
                      value={newDeal.type} 
                      onValueChange={v => setNewDeal({...newDeal, type: v})}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-secondary border-white/10 text-white">
                        <SelectItem value="Gold">Gold</SelectItem>
                        <SelectItem value="Diamonds">Diamonds</SelectItem>
                        <SelectItem value="Crude Oil">Crude Oil</SelectItem>
                        <SelectItem value="Natural Gas">Natural Gas</SelectItem>
                        <SelectItem value="Industrial Minerals">Industrial Minerals</SelectItem>
                        <SelectItem value="Precious Stones">Precious Stones</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input 
                      required 
                      placeholder="e.g. Dubai, UAE" 
                      className="bg-white/5 border-white/10 text-white"
                      value={newDeal.location}
                      onChange={e => setNewDeal({...newDeal, location: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input 
                      required 
                      placeholder="e.g. 500kg" 
                      className="bg-white/5 border-white/10 text-white"
                      value={newDeal.quantity}
                      onChange={e => setNewDeal({...newDeal, quantity: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Purity / Spec</Label>
                    <Input 
                      required 
                      placeholder="e.g. 99.99%" 
                      className="bg-white/5 border-white/10 text-white"
                      value={newDeal.purity}
                      onChange={e => setNewDeal({...newDeal, purity: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price / Discount</Label>
                    <Input 
                      required 
                      placeholder="e.g. Market -2%" 
                      className="bg-white/5 border-white/10 text-white"
                      value={newDeal.price}
                      onChange={e => setNewDeal({...newDeal, price: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button 
                    type="submit" 
                    className="bg-gold text-background font-bold w-full h-12"
                    disabled={isSubmitting || profile?.verification_status !== "verified"}
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publish Listing"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-secondary/20 border-white/5">
          <CardHeader className="border-b border-white/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg font-serif">Portfolio Performance</CardTitle>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input 
                  placeholder="Search my deals..." 
                  className="pl-10 bg-white/5 border-white/10 text-white text-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 text-gold animate-spin" />
              </div>
            ) : deals.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 mb-4 font-serif">No active listings in your portfolio.</p>
                <Button variant="outline" className="border-gold/30 text-gold" onClick={() => setIsAddModalOpen(true)}>
                  Create Your First Listing
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">ID</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Commodity</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Title</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Quantity</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Price</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Status</TableHead>
                    <TableHead className="text-right text-gray-400 font-bold uppercase tracking-widest text-[10px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.map((deal) => (
                    <TableRow key={deal.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="font-mono text-xs text-gold">{deal.id}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-wider">
                          {deal.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-white font-medium">{deal.title}</TableCell>
                      <TableCell className="text-gray-400 text-sm">{deal.quantity}</TableCell>
                      <TableCell className="text-white font-bold">{deal.price}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          deal.status === 'Available' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'
                        }`}>
                          {deal.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-gray-400 hover:text-red-400"
                            onClick={() => handleDelete(deal.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Link to={`/deal/${deal.id}`}>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gold">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </BrokerLayout>
  );
}
