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
import { Loader2, ArrowLeft, ShieldCheck, Briefcase } from "lucide-react";

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
    status: "Available",
    commodityType: "Gold Bullion"
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
        alert("Verification tier limit reached (Max 3 active deals). Upgrade to Premium for 10 deals.");
        setIsSubmitting(false);
        return;
      }
      if (tier === 'premium' && activeDealsCount >= 10) {
        alert("Premium tier limit reached (Max 10 active deals). Upgrade to Elite for unlimited.");
        setIsSubmitting(false);
        return;
      }
      if (tier === 'basic') {
        alert("Basic brokers cannot publish deals. Complete verification first.");
        setIsSubmitting(false);
        return;
      }

      const dealToInsert = {
        ...formData,
        id: `DR-${Date.now().toString().slice(-6)}`,
        broker_id: user.id,
        created_at: new Date().toISOString(),
        pricing: { type: "Spot", marketPosition: "Market", currency: "USD", paymentTerms: "MT103" },
        logistics: { deliveryTerms: "FOB", shippingPort: "TBD", inspectionAgency: "SGS", insurance: "Full" },
        compliance: { kyc: "Required", aml: "Required", sellerStatus: "Verified" },
        conditions: { moq: "1 unit", contractDuration: "Spot", exclusivity: "None" },
        documents: []
      };

      const { error } = await supabase
        .from('deals')
        .insert([dealToInsert]);
      
      if (error) throw error;
      
      navigate("/broker/deals");
    } catch (error) {
      console.error("Error creating deal:", error);
      alert("Failed to create deal.");
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
                  <Label className="text-xs uppercase tracking-widest text-gray-400">Target Pricing (e.g. Market - %)</Label>
                  <Input 
                    required 
                    placeholder="e.g. LBMA - 2%" 
                    className="bg-white/5 border-white/10 text-white h-12"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                  />
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
