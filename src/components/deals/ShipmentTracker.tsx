import * as React from "react";
import { 
  Truck, 
  MapPin, 
  Search, 
  Calendar, 
  Award, 
  Flag, 
  ArrowRight, 
  Clock,
  LocateFixed,
  PackageCheck,
  Timer,
  CheckCircle
} from "lucide-react";
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
import { supabase } from "@/src/lib/supabase";

interface ShipmentTrackerProps {
  requestId: string;
  dealId: string;
  userRole: string | null;
  userRequest: any;
  isAdmin?: boolean;
}

export const SHIPMENT_STATUSES = {
  DISPATCH_PENDING: "dispatch_pending",
  CARGO_LOADED: "cargo_loaded",
  IN_TRANSIT: "in_transit",
  PORT_ARRIVAL: "port_arrival",
  INSPECTION_SCHEDULED: "inspection_scheduled",
  INSPECTION_PASSED: "inspection_passed",
  BUYER_ACCEPTANCE_PENDING: "buyer_acceptance_pending",
  DELIVERED: "delivered"
};

export const STATUS_LABELS: Record<string, string> = {
  dispatch_pending: "Dispatch Pending",
  cargo_loaded: "Cargo Loaded",
  in_transit: "In Transit",
  port_arrival: "Port Arrival",
  inspection_scheduled: "Inspection Scheduled",
  inspection_passed: "Inspection Passed",
  buyer_acceptance_pending: "Buyer Acceptance Pending",
  delivered: "Delivered"
};

export function ShipmentTracker({ requestId, dealId, userRole, userRequest, isAdmin }: ShipmentTrackerProps) {
  const [shipment, setShipment] = React.useState<any>(userRequest?.metadata?.shipment || null);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [countdown, setCountdown] = React.useState<string>("");
  const [currentUser, setCurrentUser] = React.useState<any>(null);

  const canUpdate = userRole === 'admin' || userRole === 'broker' || isAdmin;
  const isBuyer = currentUser?.id === (userRequest?.metadata?.buyer_id || userRequest?.buyer_id);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user));

    // Realtime Sync
    const channelName = `shipment-sync-${requestId}`;
    
    // Safety: ensure no duplicate channel exists before subscribing
    supabase.removeChannel(supabase.channel(channelName));

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'requests',
        filter: `id=eq.${requestId}`
      }, (payload) => {
        if (payload.new.metadata?.shipment) {
          setShipment(payload.new.metadata.shipment);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  // Delivery Performance Timer (48h window typical or based on expected_date)
  React.useEffect(() => {
    if (!shipment?.delivery_started_at || shipment.status === SHIPMENT_STATUSES.DELIVERED) {
      setCountdown("");
      return;
    }

    const timer = setInterval(() => {
      const start = new Date(shipment.delivery_started_at).getTime();
      const expected = shipment.expected_date ? new Date(shipment.expected_date).getTime() : start + (14 * 24 * 60 * 60 * 1000); // Default 14 days
      const now = new Date().getTime();
      const diff = expected - now;

      if (diff <= 0) {
        setCountdown("WINDOW EXPIRED");
        clearInterval(timer);
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setCountdown(`${d}d ${h}h ${m}m`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [shipment?.delivery_started_at, shipment?.expected_date, shipment?.status]);

  const logProtocolEvent = async (message: string) => {
    if (!currentUser) return;
    try {
      await supabase.from('messages').insert([{
        request_id: requestId,
        deal_id: dealId,
        buyer_id: userRequest?.metadata?.buyer_id || null,
        sender_id: currentUser.id,
        sender_role: userRole || (isAdmin ? 'admin' : 'system'),
        body: `[SYSTEM] ${message}`,
        message: `[SYSTEM] ${message}`
      }]);
    } catch (err) {
      console.error("Failed to log tracking event", err);
    }
  };

  const handleUpdate = async (updates: any) => {
    setIsUpdating(true);
    try {
      const newShipment = { 
        ...(shipment || {}), 
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Set start time if first movement
      if (!shipment?.delivery_started_at && updates.status === SHIPMENT_STATUSES.IN_TRANSIT) {
        newShipment.delivery_started_at = new Date().toISOString();
      }

      const newMetadata = {
        ...(userRequest?.metadata || {}),
        shipment: newShipment
      };

      const { error } = await supabase
        .from('requests')
        .update({ metadata: newMetadata })
        .eq('id', requestId);

      if (error) throw error;

      setShipment(newShipment);

      // Log specific events
      if (updates.status) {
        await logProtocolEvent(`${userRole === 'admin' ? 'Admin' : 'Broker'} updated cargo status to ${STATUS_LABELS[updates.status]}`);
      }
      if (updates.inspection_status) {
         await logProtocolEvent(`Admin updated inspection status to ${updates.inspection_status}`);
      }

    } catch (err) {
      console.error("Failed to update shipment", err);
      alert("Update failed. Check connectivity.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!shipment && !canUpdate) return null;

  return (
    <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-gold/10 to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center">
              <Truck className="w-4 h-4 text-gold" />
            </div>
          </div>
          <div>
            <h3 className="text-white font-serif text-lg leading-tight">Commodity Tracking</h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-0.5">Shipment Monitoring Active</p>
          </div>
        </div>
        
        {countdown && (
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Timer className="w-3 h-3 text-gold" />
              <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest leading-none pt-0.5">Performance Window</span>
            </div>
            <span className="text-sm font-mono font-bold text-gold tabular-nums">{countdown}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Progress Tracker (Visual) */}
        <div className="relative pt-4 pb-8">
           <div className="absolute top-[22px] left-0 right-0 h-0.5 bg-white/5 flex justify-between px-2">
             <div className="h-full bg-gold transition-all duration-1000" style={{ width: `${(Object.keys(SHIPMENT_STATUSES).indexOf((shipment?.status || 'dispatch_pending').toUpperCase()) / (Object.keys(SHIPMENT_STATUSES).length - 1)) * 100}%` }} />
           </div>
           <div className="flex justify-between relative z-10 px-0">
             {[SHIPMENT_STATUSES.CARGO_LOADED, SHIPMENT_STATUSES.IN_TRANSIT, SHIPMENT_STATUSES.PORT_ARRIVAL, SHIPMENT_STATUSES.DELIVERED].map((s) => (
                <div key={s} className="flex flex-col items-center gap-2">
                  <div className={`w-3 h-3 rounded-full border-2 border-[#0A0A0A] shadow-[0_0_0_2px_rgba(255,255,255,0.05)] ${Object.keys(SHIPMENT_STATUSES).indexOf((shipment?.status || '').toUpperCase()) >= Object.keys(SHIPMENT_STATUSES).indexOf(s.toUpperCase()) ? 'bg-gold' : 'bg-gray-800'}`} />
                  <span className="text-[7px] uppercase font-black tracking-[0.2em] text-gray-600">{STATUS_LABELS[s].split(' ')[0]}</span>
                </div>
             ))}
           </div>
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <Label className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-black">Status</Label>
            <div className="flex items-center gap-2 text-white font-serif">
              <PackageCheck className="w-4 h-4 text-gold/50" />
              <span className="text-sm">{STATUS_LABELS[shipment?.status || 'dispatch_pending']}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-black">Location</Label>
            <div className="flex items-center gap-2 text-white font-serif">
              <MapPin className="w-4 h-4 text-gold/50" />
              <span className="text-sm">{shipment?.location || "Awaiting Departure"}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-black">Transport Ref</Label>
            <div className="flex items-center gap-2 text-white font-mono text-xs">
              <Search className="w-3 h-3 text-gold/50" />
              <span>{shipment?.reference || "---"}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-black">Expected Date</Label>
            <div className="flex items-center gap-2 text-white font-serif">
              <Calendar className="w-4 h-4 text-gold/50" />
              <span className="text-sm">{shipment?.expected_date ? new Date(shipment.expected_date).toLocaleDateString() : "TBD"}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-black">Inspection</Label>
            <div className="flex items-center gap-2 text-white font-serif">
              <Award className="w-4 h-4 text-gold/50" />
              <span className="text-sm">{shipment?.inspection_status || "Pending"}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-black">Next Milestone</Label>
            <div className="flex items-center gap-2 text-white font-serif">
              <Flag className="w-4 h-4 text-gold/50" />
              <span className="text-sm">{shipment?.next_milestone || "Cargo Loading"}</span>
            </div>
          </div>
        </div>

        {/* Buyer Approval for Inspection */}
        {isBuyer && shipment?.status === SHIPMENT_STATUSES.INSPECTION_PASSED && !shipment?.buyer_approved_inspection && (
          <div className="bg-gold/10 border border-gold/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-6 h-6 text-gold" />
               </div>
               <div>
                  <h4 className="text-white font-serif text-lg">Approve Inspection Report</h4>
                  <p className="text-xs text-gray-400">Cargo has passed initial inspection. Your verification allows the protocol to proceed toward DISPATCH. This is a REQUIRED step for fund release if opting for inspection-based settlement.</p>
               </div>
             </div>
             <Button 
               className="bg-gold hover:bg-gold-light text-background font-black h-12 px-8 uppercase tracking-widest shadow-xl shadow-gold/20 shrink-0"
               onClick={() => handleUpdate({ buyer_approved_inspection: true, status: SHIPMENT_STATUSES.BUYER_ACCEPTANCE_PENDING })}
               disabled={isUpdating}
             >
               Confirm & Approve
             </Button>
          </div>
        )}

        {/* Update Controls (Admin/Broker only) */}
        {canUpdate && (
          <div 
            className="mt-8 pt-8 border-t border-white/5 space-y-6 bg-white/[0.02] -mx-6 p-6"
            key={`logistics-panel-${requestId}-${shipment?.reference || 'empty'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <LocateFixed className="w-4 h-4 text-gold" />
              <h4 className="text-xs uppercase tracking-[0.3em] font-black text-white">Logistics Control Panel</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-gray-500">Update Status</Label>
                <Select 
                  disabled={isUpdating}
                  value={shipment?.status || SHIPMENT_STATUSES.DISPATCH_PENDING}
                  onValueChange={(v) => handleUpdate({ status: v })}
                >
                  <SelectTrigger className="bg-black/50 border-white/10 rounded-xl h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/10">
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val} className="text-xs uppercase font-bold tracking-widest">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-gray-500">Current Location / Port</Label>
                <Input 
                  className="bg-black/50 border-white/10 rounded-xl h-10 text-xs focus:ring-gold/20"
                  placeholder="e.g. Port of Rotterdam"
                  defaultValue={shipment?.location || ""}
                  onBlur={(e) => handleUpdate({ location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-gray-500">Transport Reference</Label>
                <Input 
                  className="bg-black/50 border-white/10 rounded-xl h-10 text-xs focus:ring-gold/20"
                  placeholder="AWB / BOL Number"
                  defaultValue={shipment?.reference || ""}
                  onBlur={(e) => handleUpdate({ reference: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-gray-500">Inspection Status / Agency</Label>
                <Input 
                  className="bg-black/50 border-white/10 rounded-xl h-10 text-xs focus:ring-gold/20"
                  placeholder="e.g. SGS Passed"
                  defaultValue={shipment?.inspection_status || ""}
                  onBlur={(e) => handleUpdate({ inspection_status: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-gray-500">Next Milestone</Label>
                <Input 
                  className="bg-black/50 border-white/10 rounded-xl h-10 text-xs focus:ring-gold/20"
                  placeholder="e.g. Port Clearance"
                  defaultValue={shipment?.next_milestone || ""}
                  onBlur={(e) => handleUpdate({ next_milestone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-gray-500">Expected Delivery</Label>
                <Input 
                  type="date"
                  className="bg-black/50 border-white/10 rounded-xl h-10 text-xs focus:ring-gold/20"
                  defaultValue={shipment?.expected_date ? new Date(shipment.expected_date).toISOString().split('T')[0] : ""}
                  onChange={(e) => handleUpdate({ expected_date: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white/[0.02] border-t border-white/5">
        <p className="text-[8px] text-gray-600 uppercase tracking-widest leading-relaxed text-center font-black">
          Global Sentinel Logistics Integrity Protocol: Synchronized Satellite Tracking Active
        </p>
      </div>
    </div>
  );
}
