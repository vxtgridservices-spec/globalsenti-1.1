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
  ShieldAlert,
  Loader2,
  BadgeCheck,
  FileText,
  CheckCircle2
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
    title: "",
    origin: "",
    commodity_form: "",
    documents: [] as { name: string; size: string; url?: string }[],
    pricing: { type: "Spot", marketPosition: "", currency: "USD", paymentTerms: "MT103 Wire Transfer" },
    logistics: { deliveryTerms: "FOB", shippingPort: "", inspectionAgency: "SGS", insurance: "Included" },
    conditions: { moq: "", contractDuration: "Spot", exclusivity: "Non-Exclusive" }
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
            source_type: "admin",
            type: "Gold",
            title: "AU Bullion - 500kg Spot",
            location: "Dubai, UAE",
            purity: "99.99%",
            quantity: "500kg",
            price: "Market -2%",
            status: "Available",
            commodityType: "Gold Bullion",
            origin: "Ghana / Mali",
            commodity_form: "1kg Standard Bars",
            created_at: new Date().toISOString(),
            pricing: { type: "Spot Purchase", marketPosition: "Market - 2%", currency: "USD", paymentTerms: "MT103 Wire Transfer" },
            logistics: { deliveryTerms: "FOB", shippingPort: "Dubai DXB", inspectionAgency: "SGS", insurance: "Full Transit" },
            compliance: { kyc: "Verified", aml: "Compliant", sellerStatus: "Tier-1" },
            conditions: { moq: "50kg", contractDuration: "Spot", exclusivity: "Non-Exclusive" },
            documents: []
          },
          {
            id: "DR-2024-002",
            source_type: "admin",
            type: "Diamonds",
            title: "Rough Diamonds - 12,000 Carats",
            location: "Antwerp, Belgium",
            purity: "Mixed Clarity",
            quantity: "12,000 Carats",
            price: "Private Offer",
            status: "Under Review",
            commodityType: "Rough Diamonds",
            origin: "Botswana / Namibia",
            commodity_form: "Rough Uncut stones",
            created_at: new Date().toISOString(),
            pricing: { type: "Spot", marketPosition: "Rapaport - 12%", currency: "USD", paymentTerms: "SBLC (Standby LC)" },
            logistics: { deliveryTerms: "CIF", shippingPort: "Antwerp", inspectionAgency: "GIA / HRD", insurance: "Full" },
            compliance: { kyc: "Verified", aml: "Compliant", sellerStatus: "Sightholder" },
            conditions: { moq: "2,000 Carats", contractDuration: "Spot", exclusivity: "Exclusive 30 days" },
            documents: []
          },
          {
            id: "DR-2024-003",
            source_type: "admin",
            type: "Crude Oil",
            title: "Bonny Light Crude - 2M Barrels",
            location: "Nigeria",
            purity: "API 35",
            quantity: "2M Barrels",
            price: "Spot Contract",
            status: "Available",
            commodityType: "Crude Oil",
            origin: "Nigeria (NNPC)",
            commodity_form: "Bulk Liquid",
            created_at: new Date().toISOString(),
            pricing: { type: "Spot", marketPosition: "Platts Dated Brent - $4", currency: "USD", paymentTerms: "MT103 Wire Transfer" },
            logistics: { deliveryTerms: "TTO", shippingPort: "Bonny Terminal", inspectionAgency: "SGS", insurance: "Standard" },
            compliance: { kyc: "Verified", aml: "Compliant", sellerStatus: "Government Registered" },
            conditions: { moq: "1,000,000 Barrels", contractDuration: "Spot / Contract", exclusivity: "Subject to allocation" },
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
            pricing: { type: "Spot", marketPosition: "Market", currency: "USD", paymentTerms: "MT103 Wire Transfer" },
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
            pricing: { type: "Spot", marketPosition: "Market", currency: "USD", paymentTerms: "MT103 Wire Transfer" },
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
            pricing: { type: "Spot", marketPosition: "Market", currency: "USD", paymentTerms: "MT103 Wire Transfer" },
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
        source_type: "admin",
        created_at: new Date().toISOString(),
        compliance: { kyc: "Verified", aml: "Compliant", sellerStatus: "Direct Supply" },
        documents: newDeal.documents && newDeal.documents.length > 0 ? newDeal.documents : [
          { name: "Full Corporate Offer (FCO)", size: "Verified" },
          { name: "Draft Contract", size: "Verified" },
          { name: "KYC Package", size: "Verified" }
        ]
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
        title: "",
        origin: "",
        commodity_form: "",
        documents: [],
        pricing: { type: "Spot", marketPosition: "", currency: "USD", paymentTerms: "MT103 Wire Transfer" },
        logistics: { deliveryTerms: "FOB", shippingPort: "", inspectionAgency: "SGS", insurance: "Included" },
        conditions: { moq: "", contractDuration: "Spot", exclusivity: "Non-Exclusive" }
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
              
              <form onSubmit={handleAddDeal} className="space-y-6 py-4 overflow-y-auto max-h-[70vh] pr-2">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gold/60 border-b border-white/5 pb-2">Basic Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input 
                        required 
                        placeholder="AU Bullion - 500kg" 
                        className="bg-white/5 border-white/10"
                        value={newDeal.title}
                        onChange={e => setNewDeal({...newDeal, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Commodity Type</Label>
                      <Select 
                        value={newDeal.type} 
                        onValueChange={v => setNewDeal({...newDeal, type: v, commodityType: v === 'Gold' ? 'Gold Bullion' : v})}
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
                      <Label>Origin</Label>
                      <Input 
                        required 
                        placeholder="Ghana / Mali" 
                        className="bg-white/5 border-white/10"
                        value={newDeal.origin}
                        onChange={e => setNewDeal({...newDeal, origin: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Form</Label>
                      <Input 
                        required 
                        placeholder="1kg Standard Bars" 
                        className="bg-white/5 border-white/10"
                        value={newDeal.commodity_form}
                        onChange={e => setNewDeal({...newDeal, commodity_form: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input 
                        required 
                        placeholder="Dubai, UAE" 
                        className="bg-white/5 border-white/10"
                        value={newDeal.location}
                        onChange={e => setNewDeal({...newDeal, location: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input 
                        required 
                        placeholder="500kg" 
                        className="bg-white/5 border-white/10"
                        value={newDeal.quantity}
                        onChange={e => setNewDeal({...newDeal, quantity: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Purity / Spec</Label>
                      <Input 
                        required 
                        placeholder="99.99%" 
                        className="bg-white/5 border-white/10"
                        value={newDeal.purity}
                        onChange={e => setNewDeal({...newDeal, purity: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price / Discount</Label>
                      <Input 
                        required 
                        placeholder="Market -2%" 
                        className="bg-white/5 border-white/10"
                        value={newDeal.price}
                        onChange={e => setNewDeal({...newDeal, price: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gold/60 border-b border-white/5 pb-2">Pricing Structure</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Pricing Type</Label>
                      <Select 
                        value={newDeal.pricing?.type} 
                        onValueChange={v => setNewDeal({...newDeal, pricing: {...newDeal.pricing!, type: v}})}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-secondary border-white/10 text-white">
                          <SelectItem value="Spot">Spot Purchase</SelectItem>
                          <SelectItem value="Contract">Fixed Contract</SelectItem>
                          <SelectItem value="Formula">Formula Based</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Market Position</Label>
                      <Input 
                        placeholder="Market - 2% Gross" 
                        className="bg-white/5 border-white/10"
                        value={newDeal.pricing?.marketPosition}
                        onChange={e => setNewDeal({...newDeal, pricing: {...newDeal.pricing!, marketPosition: e.target.value}})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Terms</Label>
                      <Select 
                        value={newDeal.pricing?.paymentTerms} 
                        onValueChange={v => {
                          const current = newDeal.pricing?.paymentTerms || "";
                          if (v === "ALL") {
                            setNewDeal({...newDeal, pricing: {...newDeal.pricing!, paymentTerms: "MT103, SBLC, Escrow, USDT"}});
                          } else {
                            setNewDeal({...newDeal, pricing: {...newDeal.pricing!, paymentTerms: v}});
                          }
                        }}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue placeholder="Select Payment Terms" />
                        </SelectTrigger>
                        <SelectContent className="bg-secondary border-white/10 text-white">
                          <SelectItem value="MT103 Wire Transfer">MT103 Wire Transfer</SelectItem>
                          <SelectItem value="SBLC (Standby LC)">SBLC (Standby LC)</SelectItem>
                          <SelectItem value="Bank Escrow">Bank Escrow</SelectItem>
                          <SelectItem value="USDT / USDC">USDT / USDC</SelectItem>
                          <SelectItem value="ALL">All Above Methods</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gold/60 border-b border-white/5 pb-2">Documents</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {["Certificate of Origin", "Assay Report", "Export License"].map((docName) => (
                      <div key={docName} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/10">
                        <span className="text-xs text-white">{docName}</span>
                        <div className="flex items-center gap-2">
                          {newDeal.documents?.find(d => d.name === docName) && (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                          <Input 
                            type="file" 
                            className="w-32 h-8 text-[10px] bg-transparent border-none"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const newDoc = { 
                                  name: docName, 
                                  size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                                  url: URL.createObjectURL(file) 
                                };
                                setNewDeal(prev => ({
                                  ...prev,
                                  documents: [...(prev.documents || []).filter(d => d.name !== docName), newDoc]
                                }));
                              }
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="text-[10px] text-gold h-8"
                      onClick={() => {
                        const demoDocs = [
                          { name: "FCO", size: "1.0 MB", url: "#" },
                          { name: "Draft Contract", size: "1.5 MB", url: "#" }
                        ];
                        setNewDeal(prev => ({
                          ...prev,
                          documents: [...(prev.documents || []), ...demoDocs]
                        }));
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Demo Docs (Testing)
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gold/60 border-b border-white/5 pb-2">Logistics & Delivery</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Delivery Terms</Label>
                      <Select 
                        value={newDeal.logistics?.deliveryTerms} 
                        onValueChange={v => setNewDeal({...newDeal, logistics: {...newDeal.logistics!, deliveryTerms: v}})}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-secondary border-white/10 text-white">
                          <SelectItem value="FOB">FOB (Free On Board)</SelectItem>
                          <SelectItem value="CIF">CIF (Cost, Insurance, Freight)</SelectItem>
                          <SelectItem value="EXW">EXW (Ex Works)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Shipping Port</Label>
                      <Input 
                        placeholder="Dubai DXB" 
                        className="bg-white/5 border-white/10"
                        value={newDeal.logistics?.shippingPort}
                        onChange={e => setNewDeal({...newDeal, logistics: {...newDeal.logistics!, shippingPort: e.target.value}})}
                      />
                    </div>
                    <div className="space-y-2">
                       <Label>Inspection Agency / Lab</Label>
                       <Input 
                         placeholder="SGS / Alex Stewart" 
                         className="bg-white/5 border-white/10"
                         value={newDeal.logistics?.inspectionAgency}
                         onChange={e => setNewDeal({...newDeal, logistics: {...newDeal.logistics!, inspectionAgency: e.target.value}})}
                       />
                    </div>
                    <div className="space-y-2">
                       <Label>Insurance Provisions</Label>
                       <Input 
                         placeholder="110% CIF Value" 
                         className="bg-white/5 border-white/10"
                         value={newDeal.logistics?.insurance}
                         onChange={e => setNewDeal({...newDeal, logistics: {...newDeal.logistics!, insurance: e.target.value}})}
                       />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gold/60 border-b border-white/5 pb-2">Conditions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Min Order Quantity (MOQ)</Label>
                      <Input 
                        placeholder="50kg" 
                        className="bg-white/5 border-white/10"
                        value={newDeal.conditions?.moq}
                        onChange={e => setNewDeal({...newDeal, conditions: {...newDeal.conditions!, moq: e.target.value}})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contract Duration</Label>
                      <Input 
                        placeholder="Spot / 12 Months" 
                        className="bg-white/5 border-white/10"
                        value={newDeal.conditions?.contractDuration}
                        onChange={e => setNewDeal({...newDeal, conditions: {...newDeal.conditions!, contractDuration: e.target.value}})}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Exclusivity Terms</Label>
                      <Input 
                        placeholder="Non-exclusive until ICPO" 
                        className="bg-white/5 border-white/10"
                        value={newDeal.conditions?.exclusivity}
                        onChange={e => setNewDeal({...newDeal, conditions: {...newDeal.conditions!, exclusivity: e.target.value}})}
                      />
                    </div>
                    <div className="space-y-2 text-right flex items-end col-span-2">
                       <Button 
                        type="submit" 
                        className="bg-gold text-background font-bold w-full h-12"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publish Admin Listing"}
                      </Button>
                    </div>
                  </div>
                </div>
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
                          deal.status === 'Available' ? 'bg-green-500/20 text-green-500' : 
                          deal.status === 'Under Review' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-blue-500/20 text-blue-500'
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
