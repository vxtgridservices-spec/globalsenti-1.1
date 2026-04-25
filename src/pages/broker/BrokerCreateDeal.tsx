import * as React from "react";
import { BrokerLayout } from "@/src/components/broker/BrokerLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/src/components/ui/select";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ShieldCheck, Briefcase, Scale, Truck, History, FileText, Plus } from "lucide-react";

export function BrokerCreateDeal() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    title: "",
    type: "Gold",
    location: "",
    quantity: "",
    purity: "",
    price: "",
    status: "Under Review",
    commodityType: "Gold Bullion",
    origin: "",
    form: "",
    pricing_type: "Spot",
    market_position: "",
    currency: "USD",
    payment_terms: "",
    delivery_terms: "FOB",
    shipping_port: "",
    inspection_agency: "SGS",
    insurance: "Included",
    moq: "",
    contract_duration: "Spot",
    exclusivity: "Non-Exclusive",
    documents: [] as { name: string; size: string; url?: string }[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Fetch profile and current deals for limit check
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const { data: existingDeals } = await supabase.from('deals').select('status').eq('broker_id', user.id);
      
      const tier = profile?.tier || 'basic';
      const activeDealsCount = (existingDeals || []).filter(d => d.status === 'Available').length;

      if (tier === 'verified' && activeDealsCount >= 3) {
        toast.error("Verification tier limit reached (Max 3 active deals). Upgrade to Premium for 10 deals.");
        setIsSubmitting(false);
        return;
      }
      if (tier === 'premium' && activeDealsCount >= 10) {
        toast.error("Premium tier limit reached (Max 10 active deals). Upgrade to Elite for unlimited.");
        setIsSubmitting(false);
        return;
      }
      if (tier === 'basic') {
        toast.error("Basic brokers cannot publish deals. Complete verification first.");
        setIsSubmitting(false);
        return;
      }

      const dealToInsert = {
        id: `DR-${Date.now().toString().slice(-6)}`,
        broker_id: user.id,
        created_at: new Date().toISOString(),
        title: formData.title,
        type: formData.type,
        commodityType: formData.commodityType,
        location: formData.location,
        origin: formData.origin,
        form: formData.form,
        quantity: formData.quantity,
        purity: formData.purity,
        price: formData.price,
        status: formData.status,
        pricing: {
          type: formData.pricing_type,
          marketPosition: formData.market_position,
          currency: formData.currency,
          paymentTerms: formData.payment_terms
        },
        logistics: {
          deliveryTerms: formData.delivery_terms,
          shippingPort: formData.shipping_port,
          inspectionAgency: formData.inspection_agency,
          insurance: formData.insurance
        },
        compliance: { kyc: "Required", aml: "Required", sellerStatus: "Verified" },
        conditions: {
          moq: formData.moq,
          contractDuration: formData.contract_duration,
          exclusivity: formData.exclusivity
        },
        documents: formData.documents.length > 0 ? formData.documents : [
          { name: "Certificate of Origin", size: "Verified" },
          { name: "Assay Report", size: "Verified" },
          { name: "Export License", size: "Verified" }
        ]
      };

      const { error } = await supabase
        .from('deals')
        .insert([dealToInsert]);
      
      if (error) throw error;
      
      toast.success("Deal created successfully.");
      navigate("/broker/deals");
    } catch (error) {
      console.error("Error creating deal:", error);
      toast.error("Failed to create deal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BrokerLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/broker/deals")}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-serif text-white">Create New Listing</h1>
            <p className="text-gray-400 text-sm">Fill in the details for your new commodity offering.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
          <Card className="bg-secondary/20 border-white/5">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-gold" />
                Commodity Details
              </CardTitle>
              <CardDescription className="text-gray-500">Provide the core specifications of the trade.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Deal Title</Label>
                  <Input 
                    required 
                    placeholder="e.g. AU Bullion - 500kg Spot" 
                    className="bg-white/5 border-white/10 text-white h-12"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Commodity Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={v => setFormData({...formData, type: v, commodityType: v === 'Gold' ? 'Gold Bullion' : v})}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-12">
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
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Location / Origin</Label>
                  <Input 
                    required 
                    placeholder="e.g. Dubai, UAE" 
                    className="bg-white/5 border-white/10 text-white h-12"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Quantity Offered</Label>
                  <Input 
                    required 
                    placeholder="e.g. 500kg" 
                    className="bg-white/5 border-white/10 text-white h-12"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Purity / Grade / Specification</Label>
                  <Input 
                    required 
                    placeholder="e.g. 99.99% (24K)" 
                    className="bg-white/5 border-white/10 text-white h-12"
                    value={formData.purity}
                    onChange={e => setFormData({...formData, purity: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Commodity Form</Label>
                  <Input 
                    required 
                    placeholder="e.g. 1kg Bars, Concentrate, Bulk" 
                    className="bg-white/5 border-white/10 text-white h-12"
                    value={formData.form}
                    onChange={e => setFormData({...formData, form: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Origin Country</Label>
                  <Input 
                    required 
                    placeholder="e.g. Ghana, Australia" 
                    className="bg-white/5 border-white/10 text-white h-12"
                    value={formData.origin}
                    onChange={e => setFormData({...formData, origin: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/20 border-white/5">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Scale className="w-5 h-5 text-gold" />
                Pricing Structure
              </CardTitle>
              <CardDescription className="text-gray-500">Define the financial terms of the deal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Pricing Type</Label>
                  <Select value={formData.pricing_type} onValueChange={v => setFormData({...formData, pricing_type: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-12">
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
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Market Position / Target Price</Label>
                  <Input 
                    required 
                    placeholder="e.g. Market - 2%" 
                    className="bg-white/5 border-white/10 text-white h-12"
                    value={formData.market_position}
                    onChange={e => setFormData({...formData, market_position: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Currency</Label>
                  <Input 
                    required 
                    placeholder="USD" 
                    className="bg-white/5 border-white/10 text-white h-12"
                    value={formData.currency}
                    onChange={e => setFormData({...formData, currency: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Payment Terms</Label>
                  <Select value={formData.payment_terms} onValueChange={v => {
                    if (v === "ALL") {
                      setFormData({...formData, payment_terms: "MT103, SBLC, Escrow, USDT"});
                    } else {
                      setFormData({...formData, payment_terms: v});
                    }
                  }}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-12">
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
            </CardContent>
          </Card>

          <Card className="bg-secondary/20 border-white/5">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-gold" />
                Logistics & Delivery
              </CardTitle>
              <CardDescription className="text-gray-500">Shipping and insurance details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Incoterms (Delivery Terms)</Label>
                  <Select value={formData.delivery_terms} onValueChange={v => setFormData({...formData, delivery_terms: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-secondary border-white/10 text-white">
                      <SelectItem value="FOB">FOB (Free On Board)</SelectItem>
                      <SelectItem value="CIF">CIF (Cost, Insurance, Freight)</SelectItem>
                      <SelectItem value="EXW">EXW (Ex Works)</SelectItem>
                      <SelectItem value="DAP">DAP (Delivered at Place)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Shipping Port / Terminal</Label>
                  <Input 
                    placeholder="e.g. Port of Rotterdam" 
                    className="bg-white/5 border-white/10 text-white h-12"
                    value={formData.shipping_port}
                    onChange={e => setFormData({...formData, shipping_port: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Inspection Agency</Label>
                  <Input 
                    placeholder="e.g. SGS, Alex Stewart" 
                    className="bg-white/5 border-white/10 text-white h-12"
                    value={formData.inspection_agency}
                    onChange={e => setFormData({...formData, inspection_agency: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Insurance Provisions</Label>
                  <Input 
                    placeholder="e.g. 110% CIF Value" 
                    className="bg-white/5 border-white/10 text-white h-12"
                    value={formData.insurance}
                    onChange={e => setFormData({...formData, insurance: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/20 border-white/5">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-gold" />
                Transaction Conditions
              </CardTitle>
              <CardDescription className="text-gray-500">Contractual requirements.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Minimum Order Quantity (MOQ)</Label>
                  <Input 
                    placeholder="e.g. 50kg, 10,000 Barrels" 
                    className="bg-white/5 border-white/10 text-white h-12"
                    value={formData.moq}
                    onChange={e => setFormData({...formData, moq: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Contract Duration</Label>
                  <Input 
                    placeholder="e.g. Spot, 12 Months R&E" 
                    className="bg-white/5 border-white/10 text-white h-12"
                    value={formData.contract_duration}
                    onChange={e => setFormData({...formData, contract_duration: e.target.value})}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Exclusivity Terms</Label>
                  <Input 
                    placeholder="e.g. Non-exclusive until LOI issued" 
                    className="bg-white/5 border-white/10 text-white h-12"
                    value={formData.exclusivity}
                    onChange={e => setFormData({...formData, exclusivity: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/20 border-white/5">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold" />
                Documentation Upload
              </CardTitle>
              <CardDescription className="text-gray-500">Upload mandatory trade documents (PDF, JPG, PNG).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {["Certificate of Origin", "Assay Report", "Export License", "Proof of Product"].map((docName) => (
                    <div key={docName} className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-white font-medium">{docName}</Label>
                        {formData.documents?.find(d => d.name === docName) && (
                          <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Uploaded
                          </span>
                        )}
                      </div>
                      <Input 
                        type="file" 
                        className="bg-transparent border-white/10 text-xs text-gray-400 file:text-gold file:bg-gold/10 file:border-none file:rounded file:px-2 file:py-1 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const newDoc = { 
                              name: docName, 
                              size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                              url: URL.createObjectURL(file) 
                            };
                            setFormData(prev => ({
                              ...prev,
                              documents: [...(prev.documents || []).filter(d => d.name !== docName), newDoc]
                            }));
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-white/5">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full border-dashed border-white/20 text-gray-400 hover:text-gold hover:border-gold/50"
                    onClick={() => {
                      const demoDocs = [
                        { name: "Full Corporate Offer (FCO)", size: "1.2 MB", url: "#" },
                        { name: "Draft Contract", size: "2.4 MB", url: "#" },
                        { name: "KYC Package", size: "3.1 MB", url: "#" }
                      ];
                      setFormData(prev => ({
                        ...prev,
                        documents: [...(prev.documents || []), ...demoDocs]
                      }));
                    }}
                  >
                   <Plus className="w-4 h-4 mr-2" /> Quick Add Demo Documents
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/20 border-white/5">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-gold" />
                Compliance & Verification
              </CardTitle>
              <CardDescription className="text-gray-500">Listings are subject to administrative review before being public.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl bg-gold/5 border border-gold/10 flex gap-4">
                <ShieldCheck className="w-6 h-6 text-gold shrink-0 mt-1" />
                <div className="text-sm">
                  <p className="text-white font-bold mb-1">Standardized Protocol</p>
                  <p className="text-gray-400">By creating this listing, you confirm that you have valid ATS (Authority to Sell) and that the commodity is fully compliant with international trade laws.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="ghost" 
              className="text-gray-400 hover:text-white"
              onClick={() => navigate("/broker/deals")}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-gold text-background font-bold px-12 h-14 text-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  PUBLISHING...
                </>
              ) : "PUBLISH MANIFEST"}
            </Button>
          </div>
        </form>
      </div>
    </BrokerLayout>
  );
}
