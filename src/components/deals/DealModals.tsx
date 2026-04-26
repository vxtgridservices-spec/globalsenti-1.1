import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Shield,
  Lock,
  FileUp,
  CheckCircle2,
  Loader2,
  Activity,
  Truck,
} from "lucide-react";
import { Deal } from "@/src/data/deals";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { ALLOWED_TRANSITIONS, STAGE_LABELS, DealStage, ROLE_PERMISSIONS } from "./DealStageTracker";
import { ChatPanel } from "./ChatPanel";
import { ShipmentTracker } from "./ShipmentTracker";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
}

export function PurchaseRequestModal({ isOpen, onClose, deal }: ModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [pofFile, setPofFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = React.useState({
    name: "",
    company: "",
    quantity: "",
    paymentMethod: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase.from("requests").insert([
        {
          name: formData.name,
          company: formData.company,
          deal_id: deal.id,
          broker_id: deal.broker_id || "admin",
          quantity: formData.quantity,
          payment_method: formData.paymentMethod,
          type: "EOI",
          status: "pending",
          stage: "interest",
          metadata: {
            commodity: deal.commodityType,
            title: deal.title,
            buyer_id: user?.id,
            broker_id: deal.broker_id,
          },
        },
      ]);

      if (error) throw error;
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting interest:", error);
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
            <h2 className="text-2xl font-serif font-bold">
              Interest Submitted
            </h2>
            <p className="text-gray-400">
              Your interest has been submitted for review.
            </p>
            <Button
              onClick={onClose}
              className="bg-gold text-background font-bold px-8 mt-4"
            >
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
            <Shield className="text-gold w-6 h-6" /> Express Interest
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            All communications are encrypted and confidential.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-gray-500">
                Deal Reference
              </Label>
              <Input
                value={deal.id}
                disabled
                className="bg-white/5 border-white/10 text-gold font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-gray-500">
                Commodity
              </Label>
              <Input
                value={deal.commodityType}
                disabled
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-gray-500">
                Buyer Full Name
              </Label>
              <Input
                required
                placeholder="John Doe"
                className="bg-white/5 border-white/10 text-white"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-gray-500">
                Company / Entity
              </Label>
              <Input
                required
                placeholder="Global Assets Ltd"
                className="bg-white/5 border-white/10 text-white"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-gray-500">
                Requested Quantity
              </Label>
              <Input
                required
                placeholder={`Min: ${deal.conditions.moq}`}
                className="bg-white/5 border-white/10 text-white"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-gray-500">
                Payment Method
              </Label>
              <Select
                required
                onValueChange={(value: string) =>
                  setFormData({ ...formData, paymentMethod: value })
                }
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
              <Label className="text-[10px] uppercase tracking-widest text-gray-500">
                Proof of Funds (POF)
              </Label>
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      setPofFile(files[0]);
                    }
                  }}
                  accept=".pdf,.doc,.docx,.jpg,.png"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full border-dashed ${pofFile ? 'border-green-500/50 text-green-400 bg-green-500/10' : 'border-white/20 bg-white/5 text-gray-400'} hover:text-white gap-2`}
                >
                  <FileUp className="w-4 h-4" /> 
                  {pofFile ? pofFile.name : 'Upload Document'}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 pt-4">
            <Checkbox
              id="compliance"
              required
              className="mt-1 border-gold data-[state=checked]:bg-gold data-[state=checked]:text-background"
            />
            <label
              htmlFor="compliance"
              className="text-xs text-gray-400 leading-relaxed"
            >
              I confirm that the funds used for this transaction are of legal
              origin and comply with international AML/KYC regulations. I
              authorize Global Sentinel Group to perform initial due diligence.
            </label>
          </div>

          <DialogFooter className="pt-6">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-dark text-background font-bold h-14 text-lg gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
              Submit Expression of Interest
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DealStageModal({
  isOpen,
  onClose,
  deal,
  userRequest,
}: ModalProps & { userRequest?: any }) {
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [currentStage, setCurrentStage] = React.useState<string>(userRequest?.stage || "interest");
  const [activeTab, setActiveTab] = React.useState<'chat' | 'stage' | 'shipment'>('chat');

  const escrowStatus = userRequest?.metadata?.escrow?.status;
  const isFunded = escrowStatus === 'funded' || escrowStatus === 'funds_verified' || escrowStatus === 'released';

  // Realtime stage sync
  React.useEffect(() => {
    if (!userRequest?.id || !isOpen) return;

    const channel = supabase
      .channel(`request-sync-${userRequest.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'requests',
        filter: `id=eq.${userRequest.id}`
      }, (payload) => {
        if (payload.new.stage && payload.new.stage !== currentStage) {
          setCurrentStage(payload.new.stage);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRequest?.id, isOpen, currentStage]);

  // Side effect: force switch if role becomes known and is buyer
  React.useEffect(() => {
    if (userRole === 'buyer') {
      setActiveTab('chat');
    }
  }, [userRole]);

  React.useEffect(() => {
    if (userRequest?.stage) {
      setCurrentStage(userRequest.stage);
    }
  }, [userRequest]);

  React.useEffect(() => {
    const fetchUserAndRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (data) setUserRole(data.role);
      }
    };
    fetchUserAndRole();
  }, []);

  const handleUpdateStatus = async (newStage: string) => {
    if (!userRequest?.id || !currentUser) return;
    
    // Permission check: Buyers cannot update deal stage
    if (userRole === 'buyer') {
      toast.error("Permission denied: Buyers cannot modify the transaction stage.");
      return;
    }
    
    // Validate transition
    const validTransitions = ALLOWED_TRANSITIONS[currentStage as DealStage] || [];
    if (!validTransitions.includes(newStage as DealStage)) return;

    try {
      const { error } = await supabase
        .from('requests')
        .update({ stage: newStage })
        .eq('id', userRequest.id);
      
      if (error) throw error;
      
      setCurrentStage(newStage);

      // Audit Log
      const oldLabel = STAGE_LABELS[currentStage as DealStage];
      const newLabel = STAGE_LABELS[newStage as DealStage];

      // Send system message with correct sender role
      await supabase.from("messages").insert([{
        request_id: userRequest.id,
        deal_id: userRequest.deal_id,
        buyer_id: userRequest.metadata?.buyer_id || null,
        sender_id: currentUser.id,
        sender_role: userRole || 'admin',
        body: `[PROTOCOL UPDATE] Transaction stage advanced: ${newLabel.toUpperCase()}`,
        message: `[PROTOCOL UPDATE] Transaction stage advanced: ${newLabel.toUpperCase()}`
      }]);
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        showCloseButton={false}
        className="w-screen h-screen max-w-none sm:max-w-none bg-secondary border-none text-white rounded-none flex flex-col p-0 top-0 left-0 translate-x-0 translate-y-0"
      >
        <DialogHeader className="p-4 md:p-6 border-b border-white/10 shrink-0">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <DialogTitle className="text-xl font-serif text-white">
                {deal.title} - Deal Room
              </DialogTitle>
              <div className="flex items-center gap-2 text-gold font-bold uppercase tracking-widest text-[10px] mt-1">
                 <Activity className="w-3 h-3" />
                 {STAGE_LABELS[currentStage as keyof typeof STAGE_LABELS] || "Live Session"}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-white/5 rounded-lg p-1">
                <Button 
                  variant={activeTab === 'chat' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setActiveTab('chat')}
                  className="text-xs"
                >
                  Chat
                </Button>
                {isFunded && (
                  <Button 
                    variant={activeTab === 'shipment' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setActiveTab('shipment')}
                    className="text-xs gap-2"
                  >
                    <Truck className="w-3 h-3" /> Shipment
                  </Button>
                )}
                {userRole !== 'buyer' && (
                  <Button 
                    variant={activeTab === 'stage' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setActiveTab('stage')}
                    className="text-xs"
                  >
                    Stage
                  </Button>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-white border border-white/10"
              >
                Exit
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-0">
          {activeTab === 'chat' ? (
            <ChatPanel 
              requestId={userRequest?.id} 
              userRequest={userRequest}
              userRole={userRole}
              deal={deal}
            />
          ) : activeTab === 'shipment' ? (
            <div className="p-4 md:p-6 h-full overflow-y-auto bg-black/20">
              <ShipmentTracker 
                requestId={userRequest?.id}
                dealId={deal.id}
                userRole={userRole}
                userRequest={userRequest}
              />
            </div>
          ) : (
            <div className="space-y-6 p-6">
              {userRequest && (
                <div className="space-y-4">
                  <Label className="text-xs uppercase text-gray-500">Update Deal Stage</Label>
                  <Select onValueChange={handleUpdateStatus} value={currentStage}>
                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white rounded-xl">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-secondary border-white/10 text-white">
                      {(ALLOWED_TRANSITIONS[currentStage as DealStage] || [])
                        .filter(s => !userRole || (ROLE_PERMISSIONS[userRole] || []).includes(s) || userRole === 'admin')
                        .map((s) => (
                        <SelectItem key={s} value={s} className={`text-[10px] font-bold uppercase tracking-widest ${s === 'rejected' ? 'text-red-500' : ''}`}>
                          {STAGE_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
