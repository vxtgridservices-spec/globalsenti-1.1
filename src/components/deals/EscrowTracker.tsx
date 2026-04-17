import * as React from "react";
import { ShieldAlert, Landmark, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { supabase } from "@/src/lib/supabase";

interface EscrowTrackerProps {
  dealId: string;
  buyerId?: string;
  brokerId?: string;
  isAdmin?: boolean;
  onEscrowSecured?: () => void;
  onEscrowReleased?: () => void;
}

export function EscrowTracker({ dealId, buyerId, brokerId, isAdmin, onEscrowSecured, onEscrowReleased }: EscrowTrackerProps) {
  const [escrow, setEscrow] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [initiating, setInitiating] = React.useState(false);

  React.useEffect(() => {
    fetchEscrow();
  }, [dealId]);

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

      if (!error && data) {
        setEscrow(data);
      }
    } catch (err) {
      console.error("Failed to load escrow state", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateEscrow = async () => {
    if (!buyerId) return alert("Buyer ID missing");
    setInitiating(true);
    try {
      const payload = {
        deal_id: dealId,
        buyer_id: buyerId,
        broker_id: brokerId || 'unassigned',
        provider: 'third_party',
        status: 'pending',
        reference_number: `ESC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      };

      const { data, error } = await supabase.from('escrow').insert([payload]).select().single();
      if (error) {
        if (error.code === '42P01') {
           alert("Escrow table not yet created. Please run the SQL setup script first.");
           return;
        }
        throw error;
      };
      
      setEscrow(data);
    } catch (err) {
      console.error(err);
      alert("Failed to initiate escrow.");
    } finally {
      setInitiating(false);
    }
  };

  const handleUpdateEscrow = async (newStatus: string) => {
    if (!escrow) return;
    try {
      const { error } = await supabase
        .from('escrow')
        .update({ status: newStatus })
        .eq('id', escrow.id);
      
      if (error) throw error;
      setEscrow({ ...escrow, status: newStatus });
      
      if (newStatus === "funded" && onEscrowSecured) {
        onEscrowSecured();
      } else if (newStatus === "released" && onEscrowReleased) {
        onEscrowReleased();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update escrow status");
    }
  };

  const getStatusDisplay = () => {
    if (!escrow) return { 
      label: "Not Initiated", 
      color: "text-gray-500", 
      bg: "bg-gray-500/10 border-gray-500/20", 
      icon: <Clock className="w-4 h-4" /> 
    };

    switch (escrow.status) {
      case "pending":
        return { 
          label: "Pending Funding", 
          color: "text-yellow-500", 
          bg: "bg-yellow-500/10 border-yellow-500/20", 
          icon: <Clock className="w-4 h-4 text-yellow-500" /> 
        };
      case "funded":
        return { 
          label: "Funds Secured", 
          color: "text-green-500", 
          bg: "bg-green-500/10 border-green-500/20", 
          icon: <Landmark className="w-4 h-4 text-green-500" /> 
        };
      case "released":
        return { 
          label: "Released", 
          color: "text-blue-500", 
          bg: "bg-blue-500/10 border-blue-500/20", 
          icon: <CheckCircle className="w-4 h-4 text-blue-500" /> 
        };
      case "failed":
        return { 
          label: "Failed", 
          color: "text-red-500", 
          bg: "bg-red-500/10 border-red-500/20", 
          icon: <ShieldAlert className="w-4 h-4 text-red-500" /> 
        };
      default:
        return { 
           label: escrow.status, 
           color: "text-gray-500", 
           bg: "bg-gray-500/10 border-gray-500/20", 
           icon: <Clock className="w-4 h-4" /> 
        };
    }
  };

  if (loading) return null;

  const statusDisplay = getStatusDisplay();

  return (
    <div className="bg-secondary/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-bl-full -z-10 group-hover:bg-gold/10 transition-colors" />
      
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-serif text-lg flex items-center gap-2 z-10">
          <ShieldAlert className="w-5 h-5 text-gold" /> Escrow Security
        </h4>
        <div className={`px-3 py-1.5 rounded-full border flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${statusDisplay.bg}`}>
          {statusDisplay.icon}
          <span className={statusDisplay.color}>{statusDisplay.label}</span>
        </div>
      </div>

      {!escrow && (
        <div className="flex justify-between items-center z-10 relative mt-6">
          <p className="text-xs text-gray-400">Escrow account not yet configured.</p>
          <Button 
            variant="outline" 
            className="border-gold text-gold hover:bg-gold/10 h-10 px-6 rounded-xl font-bold uppercase tracking-wider text-[10px]"
            onClick={handleInitiateEscrow}
            disabled={initiating}
          >
            {initiating ? "Initiating..." : "Initiate Escrow"}
          </Button>
        </div>
      )}

      {escrow && (
        <div className="space-y-4 z-10 relative mt-4">
          <div className="grid grid-cols-2 gap-4 text-sm bg-black/40 p-4 rounded-xl border border-white/5">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Reference ID</p>
              <p className="text-white font-mono mt-1">{escrow.reference_number}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Provider Type</p>
              <p className="text-white capitalize mt-1 border-b border-gold/30 inline-block">{escrow.provider.replace('_', ' ')}</p>
            </div>
          </div>
          
          {isAdmin && (
            <div className="flex gap-2 pt-2 border-t border-white/5">
               <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-9 mr-2">Admin:</span>
               <Button size="sm" variant="outline" className="h-8 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 text-[10px]" onClick={() => handleUpdateEscrow('pending')}>Pending</Button>
               <Button size="sm" variant="outline" className="h-8 border-green-500/30 text-green-500 hover:bg-green-500/10 text-[10px]" onClick={() => handleUpdateEscrow('funded')}>Funded</Button>
               <Button size="sm" variant="outline" className="h-8 border-blue-500/30 text-blue-500 hover:bg-blue-500/10 text-[10px]" onClick={() => handleUpdateEscrow('released')}>Released</Button>
               <Button size="sm" variant="outline" className="h-8 border-red-500/30 text-red-500 hover:bg-red-500/10 text-[10px]" onClick={() => handleUpdateEscrow('failed')}>Failed</Button>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 border-t border-white/5 pt-4 z-10 relative">
        <p className="text-[9px] text-gray-500 uppercase tracking-widest leading-relaxed">
          <strong>IMPORTANT NOTICE:</strong> We do not hold or process funds. All escrow transactions are handled via verified third-party providers. This module strictly tracks progression state.
        </p>
      </div>
    </div>
  );
}
