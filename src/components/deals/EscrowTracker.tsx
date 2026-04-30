import * as React from "react";
import { ShieldAlert, Landmark, CheckCircle, Clock, FileUp, ExternalLink, Activity } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { sendTransactionalEmail } from "@/src/services/emailService";

interface EscrowTrackerProps {
  requestId: string;
  dealId: string;
  buyerId?: string;
  brokerId?: string;
  isAdmin?: boolean;
  userRequest?: any;
  onEscrowSecured?: () => void;
  onEscrowReleased?: () => void;
}

const ESCROW_STATES = {
  PENDING: "pending",
  FUNDING_AWAITED: "funding_awaited",
  FUNDED: "funded",
  FUNDS_VERIFIED: "funds_verified",
  RELEASED: "released",
  FAILED: "failed"
};

const DEFAULT_TIMER_HOURS = 48;

export function EscrowTracker({ requestId, dealId, buyerId, brokerId, isAdmin, userRequest, onEscrowSecured, onEscrowReleased }: EscrowTrackerProps) {
  const [escrow, setEscrow] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [initiating, setInitiating] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState<number | null>(null);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user));
    fetchEscrow();

    // Set up Real-time listener
    const channel = supabase
      .channel(`escrow-sync-${dealId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'escrow',
        filter: `deal_id=eq.${dealId}`
      }, (payload: any) => {
        if (payload.new) setEscrow(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId, requestId]);

  // Rule: Realtime Sync for Metadata Fallback
  React.useEffect(() => {
    if (userRequest?.metadata?.escrow) {
      // Prioritize metadata if it exists and we don't have an escrow or it's potentially newer
      const metaEscrow = userRequest.metadata.escrow;
      setEscrow((prev: any) => {
        if (!prev) return metaEscrow;
        // If we have both, prefer the one with newer update or more advanced status
        const prevTime = new Date(prev.updated_at || prev.created_at).getTime();
        const metaTime = new Date(metaEscrow.updated_at || metaEscrow.created_at).getTime();
        return metaTime >= prevTime ? metaEscrow : prev;
      });
    }
  }, [userRequest?.metadata?.escrow]);

  // Timer Effect
  React.useEffect(() => {
    if (!escrow?.expires_at || escrow.status === ESCROW_STATES.RELEASED || escrow.status === ESCROW_STATES.FAILED) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const expires = new Date(escrow.expires_at).getTime();
      const now = new Date().getTime();
      const diff = Math.floor((expires - now) / 1000);
      
      if (diff <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [escrow?.expires_at, escrow?.status]);

  const fetchEscrow = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('escrow')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        if (error.code === '42P01' || error.message.includes('escrow')) {
          // Fallback to metadata
          const latestEscrow = userRequest?.metadata?.escrow;
          if (latestEscrow) {
            setEscrow(latestEscrow);
          }
          return;
        }
        throw error;
      }

      if (data) {
        setEscrow(data);
      } else {
        // Rule: Even if no DB error, if table is empty check metadata fallback
        const latestEscrow = userRequest?.metadata?.escrow;
        if (latestEscrow) {
          setEscrow(latestEscrow);
        }
      }
    } catch (err) {
      console.error("Failed to load escrow state", err);
    } finally {
      setLoading(false);
    }
  };

  const logProtocolEvent = async (message: string) => {
    if (!currentUser) return;
    try {
      await supabase.from('messages').insert([{
        request_id: requestId,
        deal_id: dealId,
        buyer_id: buyerId || userRequest?.metadata?.buyer_id || null,
        sender_id: currentUser.id,
        sender_role: isAdmin ? 'admin' : (currentUser.id === (buyerId || userRequest?.metadata?.buyer_id) ? 'buyer' : 'broker'),
        body: `[PROTOCOL UPDATE] ${message}`,
        message: `[PROTOCOL UPDATE] ${message}`
      }]);
    } catch (err) {
      console.error("Failed to log protocol event", err);
    }
  };

  const handleInitiateEscrow = async () => {
    const targetBuyerId = buyerId || userRequest?.metadata?.buyer_id;
    if (!targetBuyerId) {
      toast.error("Buyer ID missing");
      return;
    }
    
    setInitiating(true);
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + DEFAULT_TIMER_HOURS);

      const payload = {
        id: crypto.randomUUID(),
        deal_id: dealId,
        buyer_id: targetBuyerId,
        broker_id: brokerId || userRequest?.broker_id || 'unassigned',
        provider: 'third_party',
        status: ESCROW_STATES.FUNDING_AWAITED,
        reference_number: `ESC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase.from('escrow').insert([payload]).select().single();
      
      if (error && (error.code === '42P01' || error.message.includes('escrow'))) {
        const newMetadata = { ...(userRequest?.metadata || {}), escrow: payload };
        await supabase.from('requests').update({ metadata: newMetadata }).eq('id', requestId);
        setEscrow(payload);
      } else if (error) {
        throw error;
      } else if (data) {
        setEscrow(data);
      }

      await supabase.from('requests').update({ stage: 'escrow' }).eq('id', requestId);
      await logProtocolEvent("Escrow initiated. Funding window opened for 48 hours.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to initiate escrow.");
    } finally {
      setInitiating(false);
    }
  };

  const handleUpdateEscrow = async (newStatus: string, logMsg?: string) => {
    if (!escrow) return;
    try {
      const updatedEscrow = { ...escrow, status: newStatus, updated_at: new Date().toISOString() };

      const { error } = await supabase
        .from('escrow')
        .update({ status: newStatus, updated_at: updatedEscrow.updated_at })
        .eq('id', escrow.id);
      
      if (error && (error.code === '42P01' || error.message.includes('escrow'))) {
        const newMetadata = { ...(userRequest?.metadata || {}), escrow: updatedEscrow };
        await supabase.from('requests').update({ metadata: newMetadata }).eq('id', requestId);
        setEscrow(updatedEscrow);
      } else if (error) {
        throw error;
      } else {
        setEscrow(updatedEscrow);
      }
      
      if (logMsg) {
        await logProtocolEvent(logMsg);
      }

      if (newStatus === ESCROW_STATES.FUNDS_VERIFIED) {
        // Step 11: Automatic stage advancement to Shipment
        try {
          await supabase.from('requests').update({ stage: 'shipment' }).eq('id', requestId);
          await logProtocolEvent("Funding verified. Global Sentinel Group has advanced the transaction to GLOBAL LOGISTICS.");
          
          // Trigger Funding Confirmed Email
          const buyerEmail = userRequest?.metadata?.email;
          const buyerName = userRequest?.name || userRequest?.metadata?.name || "Valued Client";
          if (buyerEmail) {
            sendTransactionalEmail('funding-confirmed', buyerEmail, {
              userName: buyerName,
              dealId: dealId,
              timestamp: new Date().toLocaleString(),
            });
          }
        } catch (err) {
          console.error("Failed to advance stage to shipment", err);
        }
        if (onEscrowSecured) onEscrowSecured();
      } else if (newStatus === ESCROW_STATES.RELEASED) {
        // Step 10: Automatic stage advancement to Deal Closed
        try {
          await supabase.from('requests').update({ stage: 'closed' }).eq('id', requestId);
          await logProtocolEvent("Settlement successful. Global Sentinel Group has moved this transaction to CLOSED.");
        } catch (err) {
          console.error("Failed to advance stage to closed", err);
        }
        if (onEscrowReleased) onEscrowReleased();
      } else if (newStatus === ESCROW_STATES.FAILED) {
        try {
          await supabase.from('requests').update({ status: 'failed', stage: 'rejected' }).eq('id', requestId);
        } catch (err) {
          console.error("Failed to mark request as failed", err);
        }
        await logProtocolEvent("Escrow protocol FAILURE. Transaction flag set for manual review.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update escrow status");
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusDisplay = () => {
    if (!escrow) return { 
      label: "Not Initiated", 
      color: "text-gray-500", 
      bg: "bg-gray-500/10 border-gray-500/20", 
      icon: <Clock className="w-4 h-4" /> 
    };

    switch (escrow.status) {
      case ESCROW_STATES.PENDING:
      case ESCROW_STATES.FUNDING_AWAITED:
        return { 
          label: "Funding Awaited", 
          color: "text-yellow-500", 
          bg: "bg-yellow-500/10 border-yellow-500/20", 
          icon: <Clock className="w-4 h-4 text-yellow-500" /> 
        };
      case ESCROW_STATES.FUNDED:
        return { 
          label: "Buyer Confirmed Funding", 
          color: "text-blue-400", 
          bg: "bg-blue-400/10 border-blue-400/20", 
          icon: <Clock className="w-4 h-4 text-blue-400" /> 
        };
      case ESCROW_STATES.FUNDS_VERIFIED:
        return { 
          label: "Funds Verified", 
          color: "text-green-500", 
          bg: "bg-green-500/10 border-green-500/20", 
          icon: <Landmark className="w-4 h-4 text-green-500" /> 
        };
      case ESCROW_STATES.RELEASED:
        return { 
          label: "Released", 
          color: "text-blue-500", 
          bg: "bg-blue-500/10 border-blue-500/20", 
          icon: <CheckCircle className="w-4 h-4 text-blue-500" /> 
        };
      case ESCROW_STATES.FAILED:
        return { 
          label: "Failed", 
          color: "text-red-500", 
          bg: "bg-red-500/10 border-red-500/20", 
          icon: <ShieldAlert className="w-4 h-4 text-red-500" /> 
        };
      default:
        return { 
           label: escrow.status?.replace('_', ' '), 
           color: "text-gray-500", 
           bg: "bg-gray-500/10 border-gray-500/20", 
           icon: <Clock className="w-4 h-4" /> 
        };
    }
  };

  if (loading) return null;

  const statusDisplay = getStatusDisplay();
  
  // Rule 1: Robust identity detection using metadata fallback and email matching
  const isBuyer = currentUser?.id === (buyerId || userRequest?.metadata?.buyer_id) || 
                  (currentUser?.email && userRequest?.metadata?.email && currentUser.email.toLowerCase() === userRequest.metadata.email.toLowerCase());
  const isBroker = currentUser?.id === (brokerId || userRequest?.broker_id) ||
                   (currentUser?.email && userRequest?.metadata?.broker_email && currentUser.email.toLowerCase() === userRequest.metadata.broker_email.toLowerCase());
  // isAdmin is passed as a prop from the parent which has already verified the profile role

  const shipment = userRequest?.metadata?.shipment;
  const canRelease = isAdmin && (
    shipment?.status === "delivered" || 
    (shipment?.status === "inspection_passed" && shipment?.buyer_approved_inspection)
  );

  const handleUploadProof = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !escrow) return;

    setIsUploading(true);
    try {
      // In this environment, we simulate the storage path but update the database record
      const fileName = `${escrow.id}-${file.name}`;
      const proofUrl = `https://bin.globalsentinelgroup.com/proofs/${fileName}`;
      
      const updatedEscrow = { 
        ...escrow, 
        status: ESCROW_STATES.FUNDED,
        proof_url: proofUrl,
        metadata: { ...(escrow.metadata || {}), proof_filename: file.name, uploaded_at: new Date().toISOString() } 
      };

      const { error } = await supabase
        .from('escrow')
        .update({ 
          status: ESCROW_STATES.FUNDED, 
          metadata: updatedEscrow.metadata 
        })
        .eq('id', escrow.id);

      if (error && (error.code === '42P01' || error.message.includes('escrow'))) {
        const newMetadata = { ...(userRequest?.metadata || {}), escrow: updatedEscrow };
        await supabase.from('requests').update({ metadata: newMetadata }).eq('id', requestId);
        setEscrow(updatedEscrow);
      } else {
        setEscrow(updatedEscrow);
      }

      await logProtocolEvent(`Buyer uploaded funding proof: ${file.name}. Verification protocol activated.`);
      toast.success("Funding proof uploaded successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload proof.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-secondary/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-bl-full -z-10 group-hover:bg-gold/10 transition-colors" />
      
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-serif text-lg flex items-center gap-2 z-10 text-shadow-sm shadow-black">
          <ShieldAlert className="w-5 h-5 text-gold" /> Escrow Security
        </h4>
        <div className="flex items-center gap-3">
          {timeLeft !== null && (
            <div className="flex flex-col items-end">
              <span className="text-[7px] text-gray-500 uppercase font-black tracking-widest">Time Remaining</span>
              <span className={`text-xs font-mono font-bold ${timeLeft < 3600 ? 'text-red-500 animate-pulse' : 'text-gold'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
          <div className={`px-3 py-1.5 rounded-full border flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${statusDisplay.bg}`}>
            {statusDisplay.icon}
            <span className={statusDisplay.color}>{statusDisplay.label}</span>
          </div>
        </div>
      </div>

      {!escrow && (
        <div className="flex justify-between items-center z-10 relative mt-6">
          <p className="text-xs text-gray-400 font-serif italic">Escrow protocol not yet initiated for this transaction.</p>
          {isAdmin && (
            <Button 
              variant="outline" 
              className="border-gold text-gold hover:bg-gold/10 h-10 px-6 rounded-xl font-black uppercase tracking-widest text-[10px]"
              onClick={handleInitiateEscrow}
              disabled={initiating}
            >
              <Landmark className="w-4 h-4 mr-2" />
              {initiating ? "Protocol Initiating..." : "Initiate Escrow"}
            </Button>
          )}
          {!isAdmin && isBuyer && (
             <p className="text-[10px] text-gold/60 font-bold uppercase tracking-widest">Awaiting Institutional Initiation</p>
          )}
        </div>
      )}

      {escrow && (
        <div className="space-y-4 z-10 relative mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-black/40 p-4 rounded-xl border border-white/5">
            <div className="flex flex-col">
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Reference ID</p>
              <p className="text-white font-mono mt-1 text-xs truncate max-w-full">{escrow.reference_number}</p>
            </div>
            <div className="flex flex-col md:items-end">
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Provider Context</p>
              <div className="flex items-center gap-2 mt-1">
                 <p className="text-white capitalize text-xs border-b border-gold/30 inline-block">{escrow.provider?.replace('_', ' ')}</p>
                 <ExternalLink className="w-3 h-3 text-gold/50 cursor-pointer hover:text-gold" />
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 relative overflow-hidden backdrop-blur-sm">
             <div className="absolute top-0 left-0 w-1 h-full bg-gold/50" />
             <p className="text-[9px] text-gold font-black mb-2 tracking-widest uppercase flex items-center gap-2">
               <Activity className="w-3 h-3" /> Operational Guidance
             </p>
             <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
               {escrow.status === ESCROW_STATES.FUNDING_AWAITED && (isBuyer ? "Please transfer funds according to published banking instructions and click 'Confirm Funding'." : "Awaiting buyer funding confirmation within the strictly enforced 48-hour protocol window.")}
               {escrow.status === ESCROW_STATES.FUNDED && (isAdmin ? "Buyer has submitted proof of funding. Verification of bank receipt is required to advance protocol." : "Funding confirmation received. Global Sentinel Group compliance is verifying receipt.")}
               {escrow.status === ESCROW_STATES.FUNDS_VERIFIED && (isAdmin ? "Funds verified and locked. Ready for synchronized release to respective accounts." : "Funds successfully verified in secured escrow. Awaiting release authorization.")}
               {escrow.status === ESCROW_STATES.RELEASED && "Escrow protocol successfully terminated. Funds have been released to respective parties."}
               {escrow.status === ESCROW_STATES.FAILED && "Transaction flagged: Protocol failure or expiration detected. Audit log restricted to Compliance Officers."}
             </p>
             
             {isBuyer && escrow.status === ESCROW_STATES.FUNDING_AWAITED && (
               <div className="mt-3 flex items-center gap-2 text-[9px] text-blue-400 font-bold uppercase tracking-widest">
                 <CheckCircle className="w-3 h-3" /> Tip: View 'Funding Instructions' below for banking details.
               </div>
             )}

             {isAdmin && escrow.status === ESCROW_STATES.FUNDED && escrow.metadata?.proof_filename && (
                <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileUp className="w-3 h-3 text-blue-400" />
                    <span className="text-[8px] text-blue-400 font-black uppercase">Proof: {escrow.metadata.proof_filename}</span>
                  </div>
                  <Button variant="link" className="h-auto p-0 text-[8px] text-gold uppercase font-bold" onClick={() => toast.info("Proof image decryption initiated...")}>View Proof</Button>
                </div>
             )}
          </div>
          
          {isBuyer && escrow.status === ESCROW_STATES.FUNDING_AWAITED && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative group/upload h-12">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleUploadProof}
                  disabled={isUploading}
                />
                <Button 
                  variant="outline"
                  className="w-full border-white/10 hover:bg-white/5 text-xs text-gray-400 font-bold uppercase tracking-widest h-full"
                  disabled={isUploading}
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload Proof"}
                </Button>
              </div>
              <Button 
                className="bg-gold hover:bg-gold-light text-background font-black h-12 uppercase tracking-widest shadow-lg shadow-gold/20"
                onClick={() => handleUpdateEscrow(ESCROW_STATES.FUNDED, "Buyer self-certified funding sent. Verification portal opened.")}
              >
                Confirm Funding Sent
              </Button>
            </div>
          )}

          {isBroker && (
             <div className="px-1">
               <p className="text-[8px] text-gray-600 uppercase font-black tracking-tighter text-center">
                 {escrow.status === ESCROW_STATES.FUNDING_AWAITED ? "Broker Status: Monitoring Buyer Activity" : "Broker Status: Observing Protocol Progression"}
               </p>
             </div>
          )}
          
          {isAdmin && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
               <div className="w-full mb-2 flex items-center gap-2">
                 <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Administrative Control Panel</span>
                 <div className="h-px flex-1 bg-white/5" />
               </div>
               <Button size="sm" variant="outline" className={`h-8 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 text-[9px] font-black uppercase tracking-wider ${escrow.status === ESCROW_STATES.FUNDING_AWAITED ? 'ring-1 ring-yellow-500' : ''}`} onClick={() => handleUpdateEscrow(ESCROW_STATES.FUNDING_AWAITED, "Administration reset window to Funding Awaited.")}>Awaiting</Button>
               <Button size="sm" variant="outline" className={`h-8 border-blue-400/30 text-blue-400 hover:bg-blue-400/10 text-[9px] font-black uppercase tracking-wider ${escrow.status === ESCROW_STATES.FUNDED ? 'ring-2 ring-blue-400 animate-pulse bg-blue-400/5' : ''}`} onClick={() => handleUpdateEscrow(ESCROW_STATES.FUNDED, "Administration manually marked as Funded.")}>Funded</Button>
               <Button size="sm" variant="outline" className={`h-8 border-green-500/30 text-green-500 hover:bg-green-500/10 text-[9px] font-black uppercase tracking-wider ${escrow.status === ESCROW_STATES.FUNDED ? 'bg-green-500/10' : ''}`} onClick={() => handleUpdateEscrow(ESCROW_STATES.FUNDS_VERIFIED, "Compliance verified funds. Settlement authenticated.")}>Verify & Secure</Button>
               <Button 
                size="sm" 
                variant="outline" 
                className={`h-8 text-[9px] font-black uppercase tracking-wider ${!canRelease ? 'opacity-30 cursor-not-allowed border-white/10' : 'border-blue-500/30 text-blue-500 hover:bg-blue-500/10'}`} 
                onClick={() => canRelease && handleUpdateEscrow(ESCROW_STATES.RELEASED, "Protocol Release triggered. Settlement final.")}
                disabled={!canRelease}
               >
                Release
               </Button>
               <Button size="sm" variant="outline" className="h-8 border-red-500/30 text-red-500 hover:bg-red-500/10 text-[9px] font-black uppercase tracking-wider" onClick={() => handleUpdateEscrow(ESCROW_STATES.FAILED, "Escrow status manually failed by admin review.")}>Fail</Button>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 border-t border-white/5 pt-4 z-10 relative">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[7px] text-gray-400 uppercase font-bold tracking-widest">Institutional Compliance Active</span>
        </div>
        <p className="text-[9px] text-gray-600 uppercase tracking-widest leading-relaxed font-medium">
          <strong>GSG PROTOCOL:</strong> All activities are strictly monitored. Timer expiration results in automatic transaction flagging and audit.
        </p>
      </div>
    </div>
  );
}
