import * as React from "react";
import { Landmark, ShieldAlert, CheckCircle, FileText, CheckCircle2, Lock, Unlock, Send, AlertTriangle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { supabase } from "@/src/lib/supabase";

interface FundingInstructionsProps {
  requestId: string;
  paymentMethod: string;
  isAdmin: boolean;
  buyerId?: string;
  stage?: string;
  userRequest?: any;
}

export function FundingInstructions({ requestId, paymentMethod, isAdmin, buyerId, stage, userRequest }: FundingInstructionsProps) {
  const [instructions, setInstructions] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState<any>({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetchInstructions();
  }, [requestId]);

  const fetchInstructions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('funding_instructions')
        .select('*')
        .eq('request_id', requestId)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        if (error.code === '42P01' || error.message.includes('funding_instructions')) {
          if (userRequest?.metadata?.funding_details) {
            setInstructions(userRequest.metadata.funding_details);
            setFormData(userRequest.metadata.funding_details.details || {});
          }
          return;
        }
        throw error;
      }

      if (data) {
        setInstructions(data);
        setFormData(data.details || {});
      }
    } catch (err) {
      console.error("Failed to load funding instructions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newVersion = instructions ? instructions.version + 1 : 1;
      
      let criticalChanged = false;
      if (instructions && instructions.details) {
        const old = instructions.details;
        const current = formData;
        if (
          old.beneficiary_name !== current.beneficiary_name ||
          old.iban !== current.iban ||
          old.swift !== current.swift ||
          old.wallet_address !== current.wallet_address ||
          old.bank_name !== current.bank_name ||
          old.receiving_bank !== current.receiving_bank ||
          old.advising_bank !== current.advising_bank
        ) {
          criticalChanged = true;
        }
      }

      const payload = {
        id: instructions?.id || crypto.randomUUID(),
        request_id: requestId,
        payment_method: paymentMethod,
        details: { ...formData, has_critical_changes: criticalChanged },
        locked: false,
        version: newVersion,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('funding_instructions')
        .insert([payload])
        .select()
        .single();
        
      if (error && (error.code === '42P01' || error.message.includes('funding_instructions'))) {
        const newMetadata = { ...(userRequest.metadata || {}), funding_details: payload };
        await supabase.from('requests').update({ metadata: newMetadata }).eq('id', requestId);
        setInstructions(payload);
      } else if (error) {
        throw error;
      } else if (data) {
        setInstructions(data);
      }
      
      setIsEditing(false);
      
      // Notify via secure room
      const { data: authData } = await supabase.auth.getUser();
      const senderId = authData.user?.id;
      const { data: reqData } = await supabase.from('requests').select('deal_id, metadata').eq('id', requestId).single();
      const dealId = reqData?.deal_id;
      const resolvedBuyerId = reqData?.metadata?.buyer_id || buyerId || null;
      
      if (dealId && senderId) {
        const messagesToInsert = [];
        if (!instructions) {
          messagesToInsert.push({
             deal_id: dealId,
             buyer_id: resolvedBuyerId,
             sender_id: senderId,
             message: `[PROTOCOL UPDATE] Initial funding instructions have been published by Administration.`
          });
        } else {
          messagesToInsert.push({
             deal_id: dealId,
             buyer_id: resolvedBuyerId,
             sender_id: senderId,
             message: `[PROTOCOL UPDATE] Funding instructions v${newVersion} have been issued. Buyer re-confirmation required.`
          });
          if (criticalChanged) {
            messagesToInsert.push({
               deal_id: dealId,
               buyer_id: resolvedBuyerId,
               sender_id: senderId,
               message: `[SECURITY ALERT] Critical payment routing or beneficiary details have been modified in v${newVersion}. Strict verification required.`
            });
          }
        }
        if (messagesToInsert.length > 0) {
          await supabase.from('messages').insert(messagesToInsert);
        }
      }

    } catch (err) {
      console.error(err);
      alert("Failed to save instructions.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!instructions) return;
    try {
      const updatedInstructions = { ...instructions, locked: true };

      const { error } = await supabase
        .from('funding_instructions')
        .update({ locked: true })
        .eq('id', instructions.id);
      
      if (error && (error.code === '42P01' || error.message.includes('funding_instructions'))) {
        const newMetadata = { ...(userRequest.metadata || {}), funding_details: updatedInstructions };
        await supabase.from('requests').update({ metadata: newMetadata }).eq('id', requestId);
        setInstructions(updatedInstructions);
      } else if (error) {
        throw error;
      } else {
        setInstructions(updatedInstructions);
      }
      
      // Broadcast to room
      const msg = `[COMPLIANCE] Funding instructions locked and confirmed by buyer. Ready for settlement.`;
      const { data: userData } = await supabase.auth.getUser();
      const sendId = userData.user?.id;
      const { data: rData } = await supabase.from('requests').select('deal_id').eq('id', requestId).single();

      await supabase.from('messages').insert([{
         deal_id: rData?.deal_id,
         buyer_id: buyerId || null,
         sender_id: sendId,
         message: msg
      }]);
      
    } catch (err) {
      console.error(err);
      alert("Failed to lock instructions.");
    }
  };

  const renderAdminFields = () => {
    const pm = paymentMethod.toLowerCase();
    
    if (pm.includes('wire') || pm.includes('mt103') || pm.includes('escrow')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase text-gray-500">Provider Name</Label>
            <Input className="bg-white/5 border-white/10 text-white" value={formData.provider_name || ''} onChange={(e) => setFormData({...formData, provider_name: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase text-gray-500">Beneficiary Name</Label>
            <Input className="bg-white/5 border-white/10 text-white" value={formData.beneficiary_name || ''} onChange={(e) => setFormData({...formData, beneficiary_name: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase text-gray-500">Bank Name</Label>
            <Input className="bg-white/5 border-white/10 text-white" value={formData.bank_name || ''} onChange={(e) => setFormData({...formData, bank_name: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase text-gray-500">SWIFT / BIC</Label>
            <Input className="bg-white/5 border-white/10 text-white" value={formData.swift || ''} onChange={(e) => setFormData({...formData, swift: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase text-gray-500">IBAN</Label>
            <Input className="bg-white/5 border-white/10 text-white" value={formData.iban || ''} onChange={(e) => setFormData({...formData, iban: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase text-gray-500">Reference Code</Label>
            <Input className="bg-white/5 border-white/10 text-white" value={formData.reference_code || ''} onChange={(e) => setFormData({...formData, reference_code: e.target.value})} required />
          </div>
        </div>
      );
    }
    
    if (pm.includes('lc') || pm.includes('sblc')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase text-gray-500">Receiving Bank</Label>
            <Input className="bg-white/5 border-white/10 text-white" value={formData.receiving_bank || ''} onChange={(e) => setFormData({...formData, receiving_bank: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase text-gray-500">Advising Bank</Label>
            <Input className="bg-white/5 border-white/10 text-white" value={formData.advising_bank || ''} onChange={(e) => setFormData({...formData, advising_bank: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase text-gray-500">SWIFT</Label>
            <Input className="bg-white/5 border-white/10 text-white" value={formData.swift || ''} onChange={(e) => setFormData({...formData, swift: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase text-gray-500">Instrument Terms</Label>
            <Input className="bg-white/5 border-white/10 text-white" value={formData.instrument_terms || ''} onChange={(e) => setFormData({...formData, instrument_terms: e.target.value})} />
          </div>
          <div className="col-span-1 md:col-span-2 space-y-2">
            <Label className="text-[10px] uppercase text-gray-500">Reference Number</Label>
            <Input className="bg-white/5 border-white/10 text-white" value={formData.reference_number || ''} onChange={(e) => setFormData({...formData, reference_number: e.target.value})} required />
          </div>
        </div>
      );
    }
    
    if (pm.includes('crypto') || pm.includes('usdt')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase text-gray-500">Asset Type (e.g. USDT)</Label>
            <Input className="bg-white/5 border-white/10 text-white" value={formData.asset || ''} onChange={(e) => setFormData({...formData, asset: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase text-gray-500">Network (e.g. ERC20, TRC20)</Label>
            <Input className="bg-white/5 border-white/10 text-white" value={formData.network || ''} onChange={(e) => setFormData({...formData, network: e.target.value})} required />
          </div>
          <div className="col-span-1 md:col-span-2 space-y-2">
            <Label className="text-[10px] uppercase text-gray-500">Wallet Address</Label>
            <Input className="bg-white/5 border-white/10 text-white" value={formData.wallet_address || ''} onChange={(e) => setFormData({...formData, wallet_address: e.target.value})} required />
          </div>
          <div className="col-span-1 md:col-span-2 space-y-2">
            <Label className="text-[10px] uppercase text-gray-500">Settlement Reference</Label>
            <Input className="bg-white/5 border-white/10 text-white" value={formData.settlement_reference || ''} onChange={(e) => setFormData({...formData, settlement_reference: e.target.value})} required />
          </div>
        </div>
      );
    }

    return (
      <div className="text-gray-400 text-sm">
        Unsupported payment method: {paymentMethod}.
      </div>
    );
  };

  const renderBuyerView = () => {
    if (!instructions) {
      return <div className="text-gray-500 text-sm py-4">Funding instructions not yet issued by Global Sentinel Group.</div>;
    }

    const details = instructions.details;
    const pm = paymentMethod.toLowerCase();
    const isWire = pm.includes('wire') || pm.includes('mt103') || pm.includes('escrow');
    const isLC = pm.includes('lc') || pm.includes('sblc');
    const isCrypto = pm.includes('crypto') || pm.includes('usdt');

    return (
      <div className="space-y-4 pt-4">
        {instructions.details?.has_critical_changes && !instructions.locked && (
          <div className="flex items-center gap-3 text-red-500 bg-red-500/10 p-4 rounded-lg border border-red-500/30 text-xs tracking-widest font-bold shadow-sm shadow-red-500/10">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>CRITICAL REQUIRED: Beneficiary details have changed. Re-verification of these instructions is mandatory before any transaction.</span>
          </div>
        )}
        {instructions.locked ? (
          <div className="flex items-center gap-2 text-green-500 bg-green-500/10 p-3 rounded-lg border border-green-500/20 text-xs uppercase tracking-widest font-bold">
            <Lock className="w-4 h-4" /> INSTRUCTIONS LOCKED & CONFIRMED
          </div>
        ) : (
          <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20 text-xs tracking-widest font-bold">
            <AlertTriangle className="w-4 h-4" /> REVIEW AND CONFIRM INSTRUCTIONS
          </div>
        )}

        <div className="grid grid-cols-2 gap-y-6 gap-x-4 p-5 rounded-xl bg-black/40 border border-white/5 relative mt-4">
          <div className="absolute top-2 right-4 text-[10px] text-gray-500 font-mono tracking-widest uppercase">
            v{instructions.version}.0
          </div>
          
          {isWire && (
             <>
               <div><p className="text-[10px] text-gray-500 uppercase tracking-widest">Beneficiary</p><p className="text-white font-medium">{details.beneficiary_name}</p></div>
               <div><p className="text-[10px] text-gray-500 uppercase tracking-widest">Bank Name</p><p className="text-white font-medium">{details.bank_name}</p></div>
               <div><p className="text-[10px] text-gray-500 uppercase tracking-widest">IBAN</p><p className="text-white font-mono">{details.iban}</p></div>
               <div><p className="text-[10px] text-gray-500 uppercase tracking-widest">SWIFT</p><p className="text-white font-mono">{details.swift}</p></div>
               <div><p className="text-[10px] text-gray-500 uppercase tracking-widest">REF CODE</p><p className="text-gold font-bold font-mono">{details.reference_code}</p></div>
             </>
          )}

          {isLC && (
             <>
               <div><p className="text-[10px] text-gray-500 uppercase tracking-widest">Advising Bank</p><p className="text-white font-medium">{details.advising_bank}</p></div>
               <div><p className="text-[10px] text-gray-500 uppercase tracking-widest">Receiving Bank</p><p className="text-white font-medium">{details.receiving_bank}</p></div>
               <div><p className="text-[10px] text-gray-500 uppercase tracking-widest">SWIFT</p><p className="text-white font-mono">{details.swift}</p></div>
               <div><p className="text-[10px] text-gray-500 uppercase tracking-widest">REF #</p><p className="text-gold font-bold font-mono">{details.reference_number}</p></div>
             </>
          )}

          {isCrypto && (
             <>
               <div><p className="text-[10px] text-gray-500 uppercase tracking-widest">Asset</p><p className="text-white font-medium">{details.asset} on {details.network}</p></div>
               <div className="col-span-2"><p className="text-[10px] text-gray-500 uppercase tracking-widest">Deposit Address</p><p className="text-white font-mono break-all">{details.wallet_address}</p></div>
               <div><p className="text-[10px] text-gray-500 uppercase tracking-widest">REF CODE</p><p className="text-gold font-bold font-mono">{details.settlement_reference}</p></div>
             </>
          )}
        </div>
        
        {!isAdmin && !instructions.locked && (
           <Button onClick={handleConfirm} className="w-full bg-gold hover:bg-gold-light text-background font-bold h-12 uppercase tracking-widest">
              Confirm Application of Funds
           </Button>
        )}
      </div>
    );
  };

  if (loading) return null;

  return (
    <div className="bg-secondary/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -z-10 transition-colors" />
      
      <div className="flex items-center justify-between mb-4 z-10 relative border-b border-white/5 pb-4">
        <div>
           <h4 className="text-white font-serif text-lg flex items-center gap-2">
             <Landmark className="w-5 h-5 text-blue-400" /> Funding Instructions
           </h4>
           <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Method: <span className="text-white">{paymentMethod}</span></p>
        </div>
        
        {isAdmin && instructions?.locked && (
          <div className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 border border-red-500/20">
            <Lock className="w-3 h-3" /> Anti-Fraud Lock Enabled
          </div>
        )}
      </div>

      <div className="z-10 relative">
        {isAdmin ? (
          <div>
            {!isEditing && instructions ? (
              <div className="space-y-4">
                {renderBuyerView()}
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(true)} 
                  className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10 uppercase tracking-widest text-xs h-10 mt-6"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" /> Revise Instructions (Triggers New Version)
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6 pt-4">
                {renderAdminFields()}
                <div className="flex gap-4">
                  {instructions && <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="flex-1 text-gray-400">Cancel</Button>}
                  <Button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 uppercase tracking-widest">
                    {saving ? "Publishing..." : (instructions ? "Issue New Version" : "Publish Instructions")}
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : (
          renderBuyerView()
        )}
      </div>
      
      <div className="mt-6 pt-4 z-10 relative">
        <p className="text-[9px] text-gray-500 uppercase tracking-widest leading-relaxed">
          <strong>SECURITY WARNING:</strong> Instructions are dynamically generated based on protocol requirements and anti-fraud lock. Never send funds to addresses communicated via email or third-party chat.
        </p>
      </div>
    </div>
  );
}
