import * as React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Checkbox } from "@/src/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/src/components/ui/select";
import { Shield, Lock, Send, FileUp, CheckCircle2, Loader2 } from "lucide-react";
import { Deal } from "@/src/data/deals";
import { supabase } from "@/src/lib/supabase";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
}

export function PurchaseRequestModal({ isOpen, onClose, deal }: ModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    company: "",
    quantity: "",
    paymentMethod: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.from('requests').insert([
        {
          name: formData.name,
          company: formData.company,
          deal_id: deal.id,
          quantity: formData.quantity,
          payment_method: formData.paymentMethod,
          type: "purchase",
          status: "pending",
          metadata: {
            commodity: deal.commodityType,
            title: deal.title
          }
        }
      ]);

      if (error) throw error;
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting purchase request:", error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-secondary border-white/10 text-white max-w-md">
          <div className="py-12 text-center space-y-4">
            <div className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="text-green-500 w-10 h-10" />
            </div>
            <h2 className="text-2xl font-serif font-bold">Request Submitted</h2>
            <p className="text-gray-400">
              Your secure purchase request for <span className="text-gold">{deal.title}</span> has been received. 
              Our compliance team will review your Proof of Funds and contact you within 24 hours.
            </p>
            <Button onClick={onClose} className="bg-gold text-background font-bold px-8 mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-secondary border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif flex items-center gap-2">
            <Shield className="text-gold w-6 h-6" /> Secure Purchase Request
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            All communications are encrypted and confidential.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-gray-500">Deal Reference</Label>
              <Input value={deal.id} disabled className="bg-white/5 border-white/10 text-gold font-mono" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-gray-500">Commodity</Label>
              <Input value={deal.commodityType} disabled className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-gray-500">Buyer Full Name</Label>
              <Input 
                required 
                placeholder="John Doe" 
                className="bg-white/5 border-white/10 text-white"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-gray-500">Company / Entity</Label>
              <Input 
                required 
                placeholder="Global Assets Ltd" 
                className="bg-white/5 border-white/10 text-white"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-gray-500">Requested Quantity</Label>
              <Input 
                required 
                placeholder={`Min: ${deal.conditions.moq}`} 
                className="bg-white/5 border-white/10 text-white"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-gray-500">Payment Method</Label>
              <Select 
                required 
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent className="bg-secondary border-white/10 text-white">
                  <SelectItem value="mt103">MT103 Wire Transfer</SelectItem>
                  <SelectItem value="sblc">SBLC (Standby LC)</SelectItem>
                  <SelectItem value="escrow">Bank Escrow</SelectItem>
                  <SelectItem value="crypto">USDT / USDC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-gray-500">Proof of Funds (POF)</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" className="w-full border-dashed border-white/20 bg-white/5 text-gray-400 hover:text-white gap-2">
                  <FileUp className="w-4 h-4" /> Upload Document
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 pt-4">
            <Checkbox id="compliance" required className="mt-1 border-gold data-[state=checked]:bg-gold data-[state=checked]:text-background" />
            <label htmlFor="compliance" className="text-xs text-gray-400 leading-relaxed">
              I confirm that the funds used for this transaction are of legal origin and comply with international AML/KYC regulations. 
              I authorize Global Sentinel Group to perform initial due diligence.
            </label>
          </div>

          <DialogFooter className="pt-6">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-dark text-background font-bold h-14 text-lg gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
              Submit Secure Purchase Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ContactBrokerModal({ isOpen, onClose, deal }: ModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    company: "",
    email: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.from('requests').insert([
        {
          name: formData.name,
          company: formData.company,
          email: formData.email,
          message: formData.message,
          deal_id: deal.id,
          type: "broker",
          status: "pending",
          metadata: {
            commodity: deal.commodityType,
            title: deal.title
          }
        }
      ]);

      if (error) throw error;
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting broker request:", error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-secondary border-white/10 text-white max-w-md">
          <div className="py-12 text-center space-y-4">
            <div className="w-20 h-20 bg-gold/20 border border-gold/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Send className="text-gold w-10 h-10" />
            </div>
            <h2 className="text-2xl font-serif font-bold">Message Sent</h2>
            <p className="text-gray-400">
              Your inquiry regarding <span className="text-gold">{deal.id}</span> has been routed to the assigned broker. 
              Expect a response via secure channel shortly.
            </p>
            <Button onClick={onClose} className="bg-gold text-background font-bold px-8 mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-secondary border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif flex items-center gap-2">
            <Send className="text-gold w-6 h-6" /> Contact Assigned Broker
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Encrypted communication for deal <span className="text-gold font-mono">{deal.id}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-gray-500">Your Name</Label>
              <Input 
                required 
                className="bg-white/5 border-white/10 text-white"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-gray-500">Company</Label>
              <Input 
                required 
                className="bg-white/5 border-white/10 text-white"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-gray-500">Secure Email</Label>
            <Input 
              type="email" 
              required 
              className="bg-white/5 border-white/10 text-white"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-gray-500">Message</Label>
            <Textarea 
              required 
              placeholder={`I am interested in ${deal.title}. Please provide more details regarding...`}
              className="bg-white/5 border-white/10 text-white min-h-[120px]" 
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>

          <p className="text-[10px] text-gray-500 italic text-center">
            "All communications are encrypted and confidential"
          </p>

          <DialogFooter>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-dark text-background font-bold h-12 gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Secure Message
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
