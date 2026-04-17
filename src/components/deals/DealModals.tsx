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
import { Textarea } from "@/src/components/ui/textarea";
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
  Send,
  FileUp,
  CheckCircle2,
  Loader2,
  Settings2,
  Activity,
  UserCheck
} from "lucide-react";
import { Deal } from "@/src/data/deals";
import { supabase } from "@/src/lib/supabase";
import { DEAL_STAGES, STAGE_LABELS, ALLOWED_TRANSITIONS, ROLE_PERMISSIONS, DealStage } from "./DealStageTracker";

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
                onValueChange={(value) =>
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
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed border-white/20 bg-white/5 text-gray-400 hover:text-white gap-2"
                >
                  <FileUp className="w-4 h-4" /> Upload Document
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

export function DealRoomModal({
  isOpen,
  onClose,
  deal,
  userRequest,
}: ModalProps & { userRequest?: any }) {
  const [messages, setMessages] = React.useState<any[]>([]);
  const [newMessage, setNewMessage] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [participantRoles, setParticipantRoles] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const fetchParticipantRoles = async () => {
       const buyerId = userRequest?.metadata?.buyer_id || userRequest?.buyer_id;
       const participantIds = [deal.broker_id, currentUser?.id, buyerId].filter(d => d && d !== 'unassigned');
       
       if(participantIds.length === 0) return;

       const { data: profiles } = await supabase
         .from('profiles')
         .select('id, role')
         .in('id', [...new Set(participantIds)]);
         
       if (profiles) {
         setParticipantRoles(profiles.reduce((acc, p) => ({ ...acc, [p.id]: p.role }), {}));
       }
    };
    
    if (deal && userRequest && currentUser) fetchParticipantRoles();
  }, [deal, userRequest, currentUser]);
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [currentStage, setCurrentStage] = React.useState<string>(userRequest?.stage || "interest");
  const scrollRef = React.useRef<HTMLDivElement>(null);

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
    if (!userRequest?.id) return;
    
    // Validate transition
    const validTransitions = ALLOWED_TRANSITIONS[currentStage as DealStage] || [];
    if (!validTransitions.includes(newStage as DealStage)) {
      console.warn("Invalid transition attempted");
      return;
    }

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

      // Send system message
      const conversationBuyerId = userRequest?.metadata?.buyer_id || userRequest?.buyer_id;
      
      await supabase.from("messages").insert([{
        deal_id: deal.id,
        buyer_id: conversationBuyerId,
        broker_id: deal.broker_id || "admin",
        sender_id: currentUser.id,
        message: `[PROTOCOL UPDATE] Stage updated: ${oldLabel} → ${newLabel}`,
        is_read: false,
      }]);
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  React.useEffect(() => {
    let channel: any;

    if (isOpen && currentUser) {
      fetchMessages();

      const conversationBuyerId = userRequest?.metadata?.buyer_id || userRequest?.buyer_id || currentUser.id;

      // Subscribe to real-time changes
      channel = supabase
        .channel(`deal-room-${deal.id}-${conversationBuyerId}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE)
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            const newMsg = payload.new as any;
            
            // Critical filter check in JS for reliability
            if (newMsg.deal_id === deal.id && newMsg.buyer_id === conversationBuyerId) {
              if (payload.eventType === 'INSERT') {
                setMessages((current) => {
                  if (current.some(m => m.id === newMsg.id)) return current;
                  const updatedList = [...current, newMsg];
                  
                  // Auto-mark as read if it's someone else's message and chat is open
                  if (newMsg.sender_id !== currentUser.id) {
                    markMessagesAsRead(newMsg.id);
                  }
                  
                  return updatedList;
                });
              } else if (payload.eventType === 'UPDATE') {
                setMessages((current) => current.map(m => m.id === newMsg.id ? newMsg : m));
              }
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isOpen, deal.id, currentUser, userRequest]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const markMessagesAsRead = async (messageId?: string) => {
    if (!currentUser) return;
    try {
      const conversationBuyerId = userRequest?.metadata?.buyer_id || userRequest?.buyer_id || currentUser.id;
      
      const query = supabase
        .from("messages")
        .update({ is_read: true })
        .eq("deal_id", deal.id)
        .eq("buyer_id", conversationBuyerId)
        .neq("sender_id", currentUser.id);

      if (messageId) {
        await query.eq("id", messageId);
      } else {
        await query.eq("is_read", false);
      }
    } catch (err) {
      console.warn("Read status update failed (column might not exist):", err);
    }
  };

  const fetchMessages = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // We associate messages with the deal_id and buyer_id to keep rooms isolated
      const conversationBuyerId = userRequest?.metadata?.buyer_id || userRequest?.buyer_id || currentUser.id;

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("deal_id", deal.id)
        .eq("buyer_id", conversationBuyerId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data);
        // Mark all fetched messages from others as read
        markMessagesAsRead();
      }
    } catch (err) {
      console.error("Error fetching messages", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    setSending(true);
    try {
      const conversationBuyerId = userRequest?.metadata?.buyer_id || userRequest?.buyer_id || currentUser.id;

      const msg = {
        deal_id: deal.id,
        buyer_id: conversationBuyerId,
        broker_id: deal.broker_id || "unassigned",
        sender_id: currentUser.id,
        message: newMessage,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("messages").insert([msg]);
      if (error) throw error;

      setNewMessage("");
      fetchMessages();
    } catch (err) {
      console.error("Error sending message", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        showCloseButton={false}
        className="fixed top-0 left-0 translate-x-0 translate-y-0 bg-secondary border-none text-white w-screen h-[100dvh] max-w-none p-0 m-0 rounded-none flex flex-col z-[100] sm:max-w-none sm:rounded-none"
      >
        <DialogHeader className="p-6 border-b border-white/10 bg-black/60 backdrop-blur-xl shrink-0 flex flex-row items-center justify-between space-y-0 z-10 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center border border-gold/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
              <Lock className="text-gold w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-serif tracking-tight text-white">
                {deal.title}
              </DialogTitle>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-gray-400 font-mono uppercase tracking-[0.2em]">
                    Encrypted Channel • REF-{deal.id.slice(0, 8)}
                  </span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3 text-gold" />
                  <span className="text-[10px] text-gold font-bold uppercase tracking-widest">
                    {STAGE_LABELS[currentStage as keyof typeof STAGE_LABELS] || "Live Session"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {userRequest && (
              <Select onValueChange={handleUpdateStatus} value={currentStage}>
                <SelectTrigger className="w-[200px] h-10 bg-white/5 border-white/10 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-3 h-3" />
                    <SelectValue placeholder="Update Status" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-secondary border-white/10 text-white">
                  {(ALLOWED_TRANSITIONS[currentStage as DealStage] || [])
                    .filter(s => (ROLE_PERMISSIONS[userRole] || []).includes(s) || userRole === 'admin')
                    .map((s) => (
                    <SelectItem key={s} value={s} className={`text-[10px] font-bold uppercase tracking-widest ${s === 'reject_transaction' ? 'text-red-500' : ''}`}>
                      {STAGE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClose}
              className="border-white/10 text-gray-400 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[10px] h-10 px-4 rounded-xl"
            >
              Terminal Exit
            </Button>
          </div>
        </DialogHeader>

        <div
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-[radial-gradient(circle_at_top_right,_var(--color-black)_0%,_transparent_100%)]"
          ref={scrollRef}
        >
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 h-full flex flex-col items-center justify-center space-y-3">
              <Shield className="w-12 h-12 text-white/10" />
              <p>The secure deal room is open. Send a message to begin.</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMine = msg.sender_id === currentUser?.id;

              // Determine sender label
              const role = participantRoles[msg.sender_id] || 'User';
              const formattedRole = role.charAt(0).toUpperCase() + role.slice(1);
              const senderLabel = isMine ? `You (${formattedRole})` : formattedRole;

              return (
                <div
                  key={i}
                  className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                >
                  <div className="text-[10px] text-gray-500 mb-1 ml-1 mr-1 uppercase tracking-wider">
                    {senderLabel}
                  </div>
                  <div
                    className={`max-w-[85%] md:max-w-[70%] rounded-3xl px-6 py-4 text-sm shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/5 relative ${
                      isMine
                        ? "bg-gold text-background font-medium rounded-tr-sm"
                        : "bg-white/5 text-white rounded-tl-sm backdrop-blur-md"
                    }`}
                  >
                    {msg.message}
                    {isMine && (
                      <div className="absolute bottom-2 right-4 flex items-center gap-1">
                        {msg.is_read ? (
                          <div className="flex -space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-background/60" />
                            <CheckCircle2 className="w-3 h-3 text-background/60" />
                          </div>
                        ) : (
                          <CheckCircle2 className="w-3 h-3 text-background/40" />
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-gray-600 mt-1 uppercase tracking-widest ml-1 mr-1">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={handleSendMessage}
          className="p-6 pb-8 border-t border-white/10 flex gap-4 bg-black/40 backdrop-blur-xl shrink-0 items-center shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
        >
          <div className="flex-1 relative group">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="System prompt: enter secure message..."
              className="w-full bg-white/5 border-white/10 hover:border-gold/30 focus:border-gold/50 text-white h-14 rounded-2xl px-6 transition-all font-mono placeholder:text-gray-600"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-50">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-tighter">AES-256</span>
            </div>
          </div>
          <Button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-gold text-background hover:bg-gold-dark hover:scale-105 active:scale-95 transition-all shrink-0 h-14 px-8 rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(212,175,55,0.2)]"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-6 h-6" />
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
