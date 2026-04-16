import * as React from "react";
import { AdminLayout } from "@/src/components/admin/AdminLayout";
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
  MoreHorizontal,
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
import { Deal } from "@/src/data/deals";
import { Loader2 } from "lucide-react";

export function AdminDeals() {
  const navigate = useNavigate();
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
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
  const [profile, setProfile] = React.useState<any>(null);

  const fetchDeals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profile);
      }
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
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
            created_at: new Date().toISOString(),
            pricing: { type: "Spot", marketPosition: "Market", currency: "USD", paymentTerms: "MT103" },
            logistics: { deliveryTerms: "FOB", shippingPort: "TBD", inspectionAgency: "SGS", insurance: "Full" },
            compliance: { kyc: "Required", aml: "Required", sellerStatus: "Verified" },
            conditions: { moq: "1 unit", contractDuration: "Spot", exclusivity: "None" },
            documents: []
          },
          {
            id: "DR-2024-002",
            type: "Diamonds",
            title: "Rough Diamonds - 12,000 Carats",
            location: "Antwerp, Belgium",
            purity: "Mixed Clarity",
            quantity: "12,000 Carats",
            price: "Private Offer",
            status: "Under Review",
            commodityType: "Rough Diamonds",
            created_at: new Date().toISOString(),
            pricing: { type: "Spot", marketPosition: "Market", currency: "USD", paymentTerms: "MT103" },
            logistics: { deliveryTerms: "FOB", shippingPort: "TBD", inspectionAgency: "SGS", insurance: "Full" },
            compliance: { kyc: "Required", aml: "Required", sellerStatus: "Verified" },
            conditions: { moq: "1 unit", contractDuration: "Spot", exclusivity: "None" },
            documents: []
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
            created_at: new Date().toISOString(),
            pricing: { type: "Spot", marketPosition: "Market", currency: "USD", paymentTerms: "MT103" },
            logistics: { deliveryTerms: "FOB", shippingPort: "TBD", inspectionAgency: "SGS", insurance: "Full" },
            compliance: { kyc: "Required", aml: "Required", sellerStatus: "Verified" },
            conditions: { moq: "1 unit", contractDuration: "Spot", exclusivity: "None" },
            documents: []
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
            created_at: new Date().toISOString(),
            pricing: { type: "Spot", marketPosition: "Market", currency: "USD", paymentTerms: "MT103" },
            logistics: { deliveryTerms: "FOB", shippingPort: "TBD", inspectionAgency: "SGS", insurance: "Full" },
            compliance: { kyc: "Required", aml: "Required", sellerStatus: "Verified" },
            conditions: { moq: "1 unit", contractDuration: "Spot", exclusivity: "None" },
            documents: []
          },
          {
            id: "DR-2024-005",
            type: "Industrial Minerals",
            title: "Rare Earth Minerals - 5,000 MT",
            location: "Australia",
            purity: "High Grade",
            quantity: "5,000 MT",
            price: "Negotiable",
            status: "Under Review",
            commodityType: "Rare Earth Minerals",
            created_at: new Date().toISOString(),
            pricing: { type: "Spot", marketPosition: "Market", currency: "USD", paymentTerms: "MT103" },
            logistics: { deliveryTerms: "FOB", shippingPort: "TBD", inspectionAgency: "SGS", insurance: "Full" },
            compliance: { kyc: "Required", aml: "Required", sellerStatus: "Verified" },
            conditions: { moq: "1 unit", contractDuration: "Spot", exclusivity: "None" },
            documents: []
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
            created_at: new Date().toISOString(),
            pricing: { type: "Spot", marketPosition: "Market", currency: "USD", paymentTerms: "MT103" },
            logistics: { deliveryTerms: "FOB", shippingPort: "TBD", inspectionAgency: "SGS", insurance: "Full" },
            compliance: { kyc: "Required", aml: "Required", sellerStatus: "Verified" },
            conditions: { moq: "1 unit", contractDuration: "Spot", exclusivity: "None" },
            documents: []
          }
        ];

        const { data: insertedData, error: insertError } = await supabase
          .from('deals')
          .upsert(seedDeals, { onConflict: 'id' })
          .select();

        if (insertError) {
          console.warn("Seeding failed:", insertError);
          setDeals([]);
        } else {
          setDeals(insertedData || []);
        }
      } else {
        setDeals(data);
      }
    } catch (error) {
      console.error("Error fetching deals:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDeals();
  }, []);

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
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
      alert("Failed to add deal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this deal? This action cannot be undone.")) return;
    
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setDeals(deals.filter(d => d.id !== id));
    } catch (error) {
      console.error("Error deleting deal:", error);
      alert("Failed to delete deal. Please try again.");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-serif text-white mb-2">Deal Management</h1>
            <p className="text-gray-400">Manage commodity listings and private deal room inventory.</p>
          </div>
          
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger render={<Button className="bg-gold text-background font-bold gap-2 h-12 px-6">
                <Plus className="w-5 h-5" /> Add New Deal
              </Button>} />
            <DialogContent className="bg-secondary border-white/10 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-serif text-gold">Create New Deal Listing</DialogTitle>
              </DialogHeader>
              
              {profile?.verification_status !== "verified" && (
                <div className="p-4 rounded-xl bg-red-400/10 border border-red-400/20 mb-4 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-white font-bold">Verification Required</p>
                    <p className="text-xs text-gray-400">You must be a verified broker to publish deals. Your current status is: <span className="text-gold capitalize">{profile?.verification_status || 'unverified'}</span></p>
                    <Button 
                      variant="link" 
                      className="text-gold p-0 h-auto text-xs font-bold mt-2"
                      onClick={() => navigate("/verify-broker")}
                    >
                      Complete Verification Now
                    </Button>
                  </div>
                </div>
              )}

              <form onSubmit={handleAddDeal} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input 
                      required 
                      placeholder="e.g. AU Bullion - 500kg Spot" 
                      className="bg-white/5 border-white/10"
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
                      <SelectTrigger className="bg-white/5 border-white/10">
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
                      className="bg-white/5 border-white/10"
                      value={newDeal.location}
                      onChange={e => setNewDeal({...newDeal, location: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input 
                      required 
                      placeholder="e.g. 500kg" 
                      className="bg-white/5 border-white/10"
                      value={newDeal.quantity}
                      onChange={e => setNewDeal({...newDeal, quantity: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Purity / Spec</Label>
                    <Input 
                      required 
                      placeholder="e.g. 99.99%" 
                      className="bg-white/5 border-white/10"
                      value={newDeal.purity}
                      onChange={e => setNewDeal({...newDeal, purity: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price / Discount</Label>
                    <Input 
                      required 
                      placeholder="e.g. Market -2%" 
                      className="bg-white/5 border-white/10"
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
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publish Deal Listing"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-secondary/20 border-white/5">
          <CardHeader className="border-b border-white/5">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input 
                  placeholder="Search deals by ID, title or commodity..." 
                  className="pl-10 bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button variant="outline" className="border-white/10 text-white gap-2 flex-grow md:flex-grow-0">
                  <Filter className="w-4 h-4" /> Filter
                </Button>
                <Button variant="outline" className="border-white/10 text-white flex-grow md:flex-grow-0">
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 text-gold animate-spin" />
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
                    <TableRow key={deal.id} className="border-white/5 hover:bg-white/5 transition-colors group">
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
    </AdminLayout>
  );
}
