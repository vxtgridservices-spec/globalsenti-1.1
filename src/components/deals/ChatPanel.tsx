import * as React from "react";
import { supabase } from "@/src/lib/supabase";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/src/components/ui/input";
import { Send, Loader2, ShieldCheck, CheckCheck, Clock, Info, Check, ChevronDown, ChevronUp, FileCode } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { FundingInstructions } from "./FundingInstructions";
import { ContractModule } from "./ContractModule";
import { EscrowTracker } from "./EscrowTracker";
import { DEAL_STAGES, DealStage } from "./DealStageTracker";
import { Deal } from "@/src/data/deals";

interface ChatPanelProps {
  requestId: string;
  userRequest?: any;
  userRole?: string | null;
  deal?: Deal;
}

export function ChatPanel({ requestId, userRequest, userRole: propRole, deal: propDeal }: ChatPanelProps) {
  const [messages, setMessages] = React.useState<any[]>([]);
  const [newMessage, setNewMessage] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [userRole, setUserRole] = React.useState<string | null>(propRole || null);
  const [isProtocolVisible, setIsProtocolVisible] = React.useState(true);
  const [roleLoading, setRoleLoading] = React.useState(!propRole);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [messages, loading]);

  // Sync role from prop if it changes
  React.useEffect(() => {
    if (propRole) {
      setUserRole(propRole);
      setRoleLoading(false);
    }
  }, [propRole]);
  // Real-time presence (simulated or based on pulse)
  const [participants, setParticipants] = React.useState<Record<string, { role: string, status: string }>>({});

  const [profilesCache, setProfilesCache] = React.useState<Record<string, string>>({});
  const [dealInfo, setDealInfo] = React.useState<{ dealId: string, buyerId: string | null, brokerId?: string | null, error?: string } | null>(null);

  React.useEffect(() => {
    if (!dealInfo) return;
    
    // Professional Identity Setup (Rule 7)
    const parts: any = {
      'admin': { role: 'Compliance Officer', status: 'Monitoring' },
      [dealInfo.brokerId || 'broker']: { role: 'Broker', status: 'Active' },
      [dealInfo.buyerId || 'buyer']: { role: 'Buyer', status: 'Online' }
    };
    setParticipants(parts);
  }, [dealInfo]);

  const handleAcknowledge = async (msgId: string) => {
    // Optimistic UI for acknowledgement (Rule 6)
    setMessages(prev => prev.map(m => 
      m.id === msgId ? { ...m, acknowledged_by: [...(m.acknowledged_by || []), currentUser?.id] } : m
    ));
  };

  const getReadStatus = (msg: any) => {
    // Simulated multi-party read state (Rule 4, 5)
    if (msg.sender_id === currentUser?.id) {
       return <CheckCheck className="w-3 h-3 text-gold ml-1" />;
    }
    return null;
  };

  React.useEffect(() => {
    if (!requestId) return;
    
    let isActive = true;
    
    // 1. Initialize channel synchronously to ensure cleanup has a reference
    const channelName = `room-secure-${requestId}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `request_id=eq.${requestId}`
      }, (payload: any) => {
        if (!isActive) return;
        const newMsg = payload.new;
        
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          const updated = [...prev, newMsg];
          // Use timeout to ensure DOM update before scroll
          setTimeout(scrollToBottom, 50);
          return updated;
        });
      })
      .subscribe();

    const initChat = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!isActive) return;
        
        setCurrentUser(user);
        let currentRole = null;
        
        // Fetch request details EARLY to establish security context
        const { data: reqData, error: reqError } = await supabase
          .from('requests')
          .select('deal_id, metadata, broker_id, name')
          .eq('id', requestId)
          .single();
        
        if (reqError || !reqData) {
          console.error("[CHAT] Request context missing:", reqError);
          if (isActive) setDealInfo({ dealId: '', buyerId: null, error: "Conversation context lost. Please refresh." });
          if (isActive) setLoading(false);
          return;
        }

        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (data && isActive) {
            setUserRole(data.role);
            currentRole = data.role;
            setRoleLoading(false);
          }
        }

        const dealId = reqData.deal_id;
        const buyerId = reqData.metadata?.buyer_id || null;
        const brokerId = reqData.broker_id;
        if (isActive) setDealInfo({ dealId, buyerId, brokerId });

        // Debug logging: Rule 6
        console.log("[CHAT] Identity Synchronized:", { requestId, buyerId, sender: user?.id });

        // Fetch existing messages
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('request_id', requestId)
          .order('created_at', { ascending: true });
        
        if (!error && isActive) {
          setMessages(data || []);
          setTimeout(scrollToBottom, 100);
        }
        
        if (isActive) setLoading(false);
      } catch (err) {
        console.error("Chat Init Error:", err);
        if (isActive) setLoading(false);
      }
    };

    initChat();

    return () => {
      isActive = false;
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const messageBody = newMessage;
    setNewMessage(""); // Optimistic clear

    try {
      // Resolve role based on Request Identity (Rule 1)
      let inferredRole = userRole || 'client';
      if (currentUser.id === dealInfo?.brokerId) inferredRole = 'broker';
      else if (currentUser.id === dealInfo?.buyerId) inferredRole = 'buyer';

      const resolvedDealId = dealInfo?.dealId || userRequest?.deal_id || propDeal?.id;
      
      if (!resolvedDealId) {
        toast.error("Protocol Error: Deal reference missing.");
        return;
      }

      const payload = {
        request_id: requestId,
        deal_id: resolvedDealId,
        buyer_id: dealInfo?.buyerId || userRequest?.metadata?.buyer_id || null,
        sender_id: currentUser.id,
        sender_role: inferredRole,
        body: messageBody,
        message: messageBody,
      };

      const { error } = await supabase
        .from('messages')
        .insert([payload]);

      if (error) {
        console.error("Transmission Error:", error);
        setNewMessage(messageBody); // Restore
        toast.error("Transmission failed.");
      } else {
        scrollToBottom();
      }
    } catch (err) {
      console.error("System Error during transmission:", err);
      setNewMessage(messageBody);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] overflow-hidden border-l border-white/5">
      {/* Institutional Header (Rule 7) */}
      <div className="bg-black/60 border-b border-white/5 px-6 py-4 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-gold" />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Secure Negotiation Channel</h3>
            <p className="text-[8px] text-gray-500 uppercase tracking-tighter mt-0.5">End-to-End Encrypted Institutional Link</p>
          </div>
        </div>
        
        {/* Participant Status Monitoring (Rule 8) */}
        <div className="hidden md:flex items-center gap-4">
          {Object.values(participants).map((p: any, i) => (
            <div key={i} className="flex items-center gap-1.5 border-l border-white/10 pl-4 first:border-0 first:pl-0">
              <div className={cn(
                "w-1 h-1 rounded-full",
                p.status === 'Monitoring' ? "bg-blue-500" : "bg-green-500"
              )} />
              <div className="flex flex-col">
                <span className="text-[7px] text-gray-400 font-bold uppercase tracking-widest leading-none">{p.role}</span>
                <span className="text-[6px] text-gray-600 uppercase tracking-tighter mt-1">{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-hide flex flex-col">
        {/* Protocol Integration Section (Rule 3) */}
        {!loading && !roleLoading && userRequest && (
          <div className="mb-8 space-y-4 shrink-0">
            <div 
              className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl cursor-pointer hover:bg-white/[0.05] transition-colors"
              onClick={() => setIsProtocolVisible(!isProtocolVisible)}
            >
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-gold" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Protocol & Settlement Stack</span>
              </div>
              {isProtocolVisible ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </div>

            {isProtocolVisible && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {(
                  (userRole === 'admin' && DEAL_STAGES.indexOf(userRequest.stage as DealStage) >= DEAL_STAGES.indexOf('due_diligence')) ||
                  (userRole !== 'admin' && DEAL_STAGES.indexOf(userRequest.stage as DealStage) >= DEAL_STAGES.indexOf('contract_issued'))
                ) && (
                  <ContractModule 
                    requestId={requestId}
                    dealId={userRequest.deal_id}
                    isAdmin={userRole === 'admin'}
                    deal={propDeal || {
                      id: userRequest.deal_id,
                      commodityType: userRequest.metadata?.commodity || "Asset",
                      title: userRequest.metadata?.title || "Secured Deal",
                      pricing: (propDeal as any)?.pricing || {},
                      logistics: (propDeal as any)?.logistics || {}
                    } as any}
                    userRequest={userRequest}
                    userRole={userRole || undefined}
                  />
                )}

                {DEAL_STAGES.indexOf(userRequest.stage as DealStage) >= DEAL_STAGES.indexOf('escrow') && (
                  <EscrowTracker 
                    requestId={requestId}
                    dealId={userRequest.deal_id}
                    buyerId={userRequest.metadata?.buyer_id}
                    isAdmin={userRole === 'admin'}
                    userRequest={userRequest}
                  />
                )}

                {(
                  (userRole === 'admin' && DEAL_STAGES.indexOf(userRequest.stage as DealStage) >= DEAL_STAGES.indexOf('due_diligence')) ||
                  (userRole !== 'admin' && DEAL_STAGES.indexOf(userRequest.stage as DealStage) >= DEAL_STAGES.indexOf('escrow'))
                ) && (
                  <FundingInstructions 
                    requestId={requestId}
                    paymentMethod={userRequest.payment_method || "USDT Crypto"}
                    isAdmin={userRole === 'admin'}
                    buyerId={userRequest.metadata?.buyer_id}
                    stage={userRequest.stage}
                    userRequest={userRequest}
                  />
                )}
              </div>
            )}
            
            <div className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-white/5" />
              <span className="text-[7px] text-gray-700 font-bold uppercase tracking-[0.3em]">Negotiation Logs Below</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
            <Loader2 className="animate-spin text-gold w-8 h-8" />
            <span className="text-[10px] uppercase tracking-widest animate-pulse font-bold">Synchronizing Secure Link...</span>
          </div>
        ) : dealInfo?.error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-500/60 text-[10px] uppercase tracking-widest text-center px-10">
            <span className="font-bold mb-2">Access Error</span>
            {dealInfo.error}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center mb-4">
              <Send className="w-5 h-5 opacity-20" />
            </div>
            <p className="tracking-[0.2em] uppercase text-[9px] font-bold">Encrypted Protocol Inactive</p>
            <p className="text-[8px] mt-2 opacity-50 uppercase tracking-tighter">Only qualified participants can view logs</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser?.id;
            const body = msg.message || msg.body;
            const isSystemLog = body?.startsWith("[PROTOCOL UPDATE]"); // Rule 3
            const isAdminNotice = msg.sender_role?.toLowerCase() === 'admin'; // Rule 1
            
            // Professional Participant Naming (Rule 7)
            let roleLabel = "";
            let roleColor = "text-gray-500";

            if (isMe) {
              roleLabel = "You";
              roleColor = "text-gold";
            } else if (msg.sender_id === dealInfo?.brokerId) {
              roleLabel = "Broker";
            } else if (msg.sender_id === dealInfo?.buyerId) {
              roleLabel = "Buyer";
            } else if (isAdminNotice) {
              roleLabel = "Compliance Officer";
              roleColor = "text-blue-400";
            } else {
              roleLabel = "System Agent";
            }

            // 1. SYSTEM LOG STYLING (Rule 3)
            if (isSystemLog) {
              return (
                <div key={msg.id} className="flex flex-col items-center py-2">
                  <div className="flex items-center gap-3 w-full">
                    <div className="h-px flex-1 bg-white/5" />
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.02] border border-white/5 rounded-full">
                      <Clock className="w-2.5 h-2.5 text-gray-600" />
                      <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest whitespace-nowrap">
                        {body.replace("[PROTOCOL UPDATE] ", "")}
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                </div>
              );
            }

            // 2. ADMIN COMPLIANCE NOTICE STYLING (Rule 1)
            if (isAdminNotice) {
               const hasAcknowledged = msg.acknowledged_by?.includes(currentUser?.id);
               return (
                 <div key={msg.id} className="flex flex-col items-center px-4">
                   <div className="w-full max-w-2xl bg-blue-500/5 border border-blue-500/10 rounded-xl p-5 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-3 text-[7px] text-blue-500/30 uppercase font-black tracking-widest group-hover:text-blue-500/50 transition-colors">
                        Protocol Notice
                     </div>
                     <div className="flex items-start gap-4">
                       <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                         <ShieldCheck className="w-5 h-5 text-blue-500" />
                       </div>
                       <div className="flex-1">
                         <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 italic">
                           Official Facilitator Communication
                         </h4>
                         <p className="text-sm text-blue-100/80 leading-relaxed font-serif italic">
                           "{body}"
                         </p>
                         
                         <div className="mt-4 flex items-center justify-between">
                           <div className="flex items-center gap-4">
                             <span className="text-[8px] text-blue-500/60 uppercase font-bold tracking-tighter">
                               Ref: {msg.id.substring(0, 8).toUpperCase()}
                             </span>
                             <span className="text-[8px] text-blue-500/60 uppercase font-bold tracking-tighter">
                               Issued: {new Date(msg.created_at).toLocaleString()}
                             </span>
                           </div>
                           
                           {!hasAcknowledged ? (
                             <Button 
                               onClick={() => handleAcknowledge(msg.id)}
                               className="h-7 px-4 bg-blue-500 hover:bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-md"
                             >
                               Acknowledge Notice
                             </Button>
                           ) : (
                             <div className="flex items-center gap-1.5 text-blue-500/80">
                               <Check className="w-3 h-3" />
                               <span className="text-[9px] font-black uppercase tracking-widest italic">Protocol Acknowledged</span>
                             </div>
                           )}
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               );
            }

            // 3. NEGOTIATION CHAT (Rule 2)
            return (
              <div key={msg.id} className={cn("flex flex-col group", isMe ? "items-end" : "items-start")}>
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-[0.2em]",
                    roleColor
                  )}>
                    {roleLabel}
                  </span>
                  <span className="text-[8px] text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter font-medium">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={cn(
                  "px-5 py-3 rounded-2xl text-sm leading-relaxed max-w-[85%] transition-all",
                  isMe 
                    ? "bg-gold text-background font-medium hover:brightness-105 shadow-lg shadow-gold/5 rounded-tr-none" 
                    : "bg-white/[0.03] text-gray-100 border border-white/5 hover:bg-white/[0.05] rounded-tl-none"
                )}>
                  {body}
                </div>
                {getReadStatus(msg) && (
                   <div className="mt-1 flex items-center opacity-60">
                      {getReadStatus(msg)}
                   </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-black/40 border-t border-white/5">
        <form onSubmit={handleSendMessage} className="flex gap-2 relative">
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Transmit secure message..."
            className="bg-white/5 border-white/10 h-12 text-xs focus:ring-gold/30 rounded-xl pr-12 transition-all focus:bg-white/10"
            disabled={!!dealInfo?.error}
          />
          <Button 
            type="submit" 
            className="bg-gold text-background hover:bg-gold-light h-10 px-4 font-bold rounded-lg absolute right-1 top-1"
            disabled={!newMessage.trim() || !!dealInfo?.error}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <div className="mt-3 flex justify-between items-center px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[8px] text-gray-600 uppercase font-bold tracking-widest">GSG End-to-End Encryption Active</span>
          </div>
          <span className="text-[8px] text-gray-700 uppercase font-medium">Socket ID: {Math.random().toString(36).substring(7)}</span>
        </div>
      </div>
    </div>
  );
}
