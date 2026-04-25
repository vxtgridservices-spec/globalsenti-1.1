import * as React from "react";
import { FileText, Download, CheckCircle, Clock, AlertTriangle, FileUp, Loader2, ShieldCheck, PenTool } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/src/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Deal } from "@/src/data/deals";

interface ContractModuleProps {
  requestId: string;
  dealId: string;
  deal: Deal;
  userRequest: any;
  isAdmin: boolean;
  userRole?: string;
}

export function ContractModule({ requestId, dealId, deal, userRequest, isAdmin, userRole }: ContractModuleProps) {
  const [contract, setContract] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [approving, setApproving] = React.useState(false);

  React.useEffect(() => {
    fetchContract();
  }, [requestId]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('request_id', requestId)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        if (error.code === '42P01' || error.message.includes('contracts')) {
          if (userRequest?.metadata?.active_contract) {
            setContract(userRequest.metadata.active_contract);
          }
          return;
        }
        throw error;
      }
      if (data) setContract(data);
    } catch (err) {
      console.error("Failed to load contract", err);
    } finally {
      setLoading(false);
    }
  };

  const generateContractPDF = (contractData?: any) => {
    const doc = new jsPDF();
    const gold: [number, number, number] = [197, 165, 114];
    const black: [number, number, number] = [20, 20, 20];
    const version = contractData?.version || 1;

    // Header
    doc.setFillColor(black[0], black[1], black[2]);
    doc.rect(0, 0, 210, 40, "F");
    
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("GLOBAL SENTINEL GROUP", 20, 20);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("PURCHASE & SALE AGREEMENT (PSA)", 20, 30);
    
    doc.text(`REF: ${deal.id}`, 190, 20, { align: "right" });
    doc.text(`VERSION: ${version}.0`, 190, 30, { align: "right" });

    let currentY = 55;

    // SECTION 1: PARTICIPANTS
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("SECTION 1: CONTRACTING PARTIES", 20, currentY);
    currentY += 10;

    autoTable(doc, {
      startY: currentY,
      head: [["Role", "Entity Details"]],
      body: [
        ["Buyer", userRequest.company || "Confidential Entity"],
        ["Seller", "Global Sentinel Principal / Managed Asset"],
        ["Broker / Facilitator", deal.broker_id || "Global Sentinel Support"],
        ["Platform", "Global Sentinel Group (Facilitator)"]
      ],
      theme: "striped",
      headStyles: { fillColor: gold, textColor: black },
      styles: { fontSize: 10 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // SECTION 2: COMMODITY & QUANTITY
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text("SECTION 2: COMMODITY SPECIFICATIONS", 20, currentY);
    currentY += 10;

    autoTable(doc, {
      startY: currentY,
      head: [["Item", "Description"]],
      body: [
        ["Commodity", deal.commodityType],
        ["Contracted Quantity", userRequest.quantity || deal.quantity],
        ["Quality / Purity", deal.purity],
        ["Origin", deal.origin],
        ["Form", deal.form]
      ],
      theme: "striped",
      headStyles: { fillColor: gold, textColor: black },
      styles: { fontSize: 10 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // SECTION 3: COMMERCIAL TERMS
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text("SECTION 3: COMMERCIAL TERMS", 20, currentY);
    currentY += 10;

    autoTable(doc, {
      startY: currentY,
      head: [["Term", "Provisions"]],
      body: [
        ["Pricing", deal.pricing?.type || "Standard"],
        ["Currency", deal.pricing?.currency || "USD"],
        ["Payment Method", userRequest.payment_method || deal.pricing?.paymentTerms || "Wire Transfer"],
        ["Delivery Terms", deal.logistics?.deliveryTerms || "TBD"],
        ["Inspection Agency", deal.logistics?.inspectionAgency || "TBD"]
      ],
      theme: "striped",
      headStyles: { fillColor: gold, textColor: black },
      styles: { fontSize: 10 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // SECTION 4: LEGAL CLAUSES
    if (currentY > 220) { doc.addPage(); currentY = 20; }
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text("SECTION 4: PROTOCOL & COMPLIANCE", 20, currentY);
    currentY += 10;

    autoTable(doc, {
      startY: currentY,
      body: [
        ["Compliance", "All parties warrant compliance with International AML and KYC regulations."],
        ["Escrow", "Execution and settlement via Global Sentinel Group verified Escrow channels only."],
        ["Insurance", `Coverage to be provided by ${deal.logistics?.insurance || "TBD"}.`],
        ["Dispute Resolution", "Arbitration in neutral international jurisdiction as per ICC standards."]
      ],
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 2 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 25;

    // SIGNATURES
    doc.setTextColor(black[0], black[1], black[2]);
    doc.line(20, currentY, 80, currentY);
    doc.line(130, currentY, 190, currentY);
    currentY += 5;
    doc.setFontSize(8);
    doc.text("BUYER SIGNATURE / SEAL", 20, currentY);
    doc.text("SELLER SIGNATURE / SEAL", 130, currentY);

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(black[0], black[1], black[2]);
        doc.rect(0, 280, 210, 20, "F");
        doc.setTextColor(gold[0], gold[1], gold[2]);
        doc.setFontSize(8);
        doc.text("OFFICIAL PURCHASE & SALE AGREEMENT - GSG PROTOCOL", 105, 288, { align: "center" });
    }

    doc.save(`PSA-${deal.id}-v${version}.pdf`);
  };

  const handleGenerateContract = async () => {
    setGenerating(true);
    try {
      const nextVersion = contract ? contract.version + 1 : 1;
      const { data: userData } = await supabase.auth.getUser();
      
      const payload = {
        id: contract?.id || crypto.randomUUID(),
        request_id: requestId,
        deal_id: deal.id,
        version: nextVersion,
        status: 'draft',
        content: {
          buyer: userRequest.company,
          quantity: userRequest.quantity,
          pricing: deal.pricing,
          logistics: deal.logistics
        },
        metadata: {
          generated_by: userData.user?.id,
          generated_role: userRole,
          created_at: new Date().toISOString()
        }
      };

      const { data, error } = await supabase
        .from('contracts')
        .insert([payload])
        .select()
        .single();

      if (error && (error.code === '42P01' || error.message.includes('contracts'))) {
        const newMetadata = { ...(userRequest.metadata || {}), active_contract: payload };
        await supabase.from('requests').update({ metadata: newMetadata }).eq('id', requestId);
        setContract(payload);
      } else if (error) {
        throw error;
      } else if (data) {
        setContract(data);
      }

      await supabase.from("messages").insert([{
        request_id: requestId,
        deal_id: deal.id,
        buyer_id: userRequest.metadata?.buyer_id || null,
        sender_id: userData.user?.id,
        sender_role: userRole || 'admin',
        message: `[PROTOCOL UPDATE] Draft Contract v${nextVersion} issued by Administration.`
      }]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate contract.");
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveContract = async () => {
    if (!contract || userRole !== 'buyer') return;
    setApproving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const updatedContract = { ...contract, status: 'approved', buyer_approved_at: new Date().toISOString() };

      const { error } = await supabase
        .from('contracts')
        .update({ status: 'approved', buyer_approved_at: updatedContract.buyer_approved_at })
        .eq('id', contract.id);

      if (error && (error.code === '42P01' || error.message.includes('contracts'))) {
        const newMetadata = { ...(userRequest.metadata || {}), active_contract: updatedContract };
        await supabase.from('requests').update({ metadata: newMetadata }).eq('id', requestId);
        setContract(updatedContract);
      } else if (error) {
        throw error;
      } else {
        setContract(updatedContract);
      }

      await supabase.from("messages").insert([{
        request_id: requestId,
        deal_id: deal.id,
        buyer_id: userRequest.metadata?.buyer_id || null,
        sender_id: userData.user?.id,
        sender_role: 'buyer',
        message: `[COMPLIANCE] Contract v${contract.version} officially approved and accepted by Buyer.`
      }]);
    } catch (err) {
      console.error(err);
      toast.error("Approval failed.");
    } finally {
      setApproving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-secondary/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-bl-full -z-10" />
      
      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
        <div>
           <h4 className="text-white font-serif text-lg flex items-center gap-2">
             <FileText className="w-5 h-5 text-gold" /> Contract Issuance
           </h4>
           <div className="flex items-center gap-2 mt-1">
             <span className="text-[10px] text-gray-500 uppercase tracking-widest leading-none">Status:</span>
             <span className={`text-[10px] font-bold uppercase tracking-widest ${contract?.status === 'approved' ? 'text-green-500' : 'text-yellow-500'}`}>
               {contract?.status || "Pending Issuance"}
             </span>
           </div>
        </div>
        {contract && (
          <div className="bg-white/5 px-3 py-1 rounded text-[9px] text-gray-500 font-mono">
            REF: PSA-v{contract.version}.0
          </div>
        )}
      </div>

      {!contract ? (
        <div className="py-8 text-center">
          {isAdmin ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-400 max-w-xs mx-auto">Generate the official Purchase & Sale Agreement (PSA) based on negotiated terms.</p>
              <Button 
                onClick={handleGenerateContract} 
                disabled={generating}
                className="bg-gold text-background font-bold tracking-widest uppercase text-xs h-12 px-8 rounded-xl"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PenTool className="w-4 h-4 mr-2" />}
                Generate Draft Contract
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-serif italic text-center">Contract generation pending administrative review.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-start gap-4 bg-black/40 p-5 rounded-xl border border-white/5">
             <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-gold" />
             </div>
             <div className="space-y-1">
                <p className="text-sm text-white font-medium">Purchase & Sale Agreement</p>
                <p className="text-xs text-gray-500 leading-relaxed">Official GSG Protocol Agreement v{contract.version}.0</p>
                <div className="flex items-center gap-4 mt-3">
                  <button onClick={() => generateContractPDF(contract)} className="text-[10px] text-gold hover:text-gold-light font-bold uppercase tracking-widest flex items-center gap-1 group">
                    <Download className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" /> Download PDF
                  </button>
                </div>
             </div>
          </div>

          <div className="flex flex-col gap-3">
            {userRole === 'buyer' && contract.status !== 'approved' && (
              <Button 
                onClick={handleApproveContract} 
                disabled={approving}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold h-12 uppercase tracking-widest text-xs"
              >
                {approving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Approve & Accept Terms
              </Button>
            )}

            {isAdmin && (
              <Button 
                onClick={handleGenerateContract} 
                disabled={generating}
                variant="outline"
                className="w-full border-white/10 text-gray-400 hover:text-white h-10 uppercase tracking-widest text-[10px]"
              >
                {generating ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <FileUp className="w-3 h-3 mr-2" />}
                Issue Revised Contract
              </Button>
            )}
          </div>
        </div>
      )}

      {contract?.status === 'approved' && (
        <div className="mt-6 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-green-500/80">
            <BadgeCheck className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Digitally Secured via Protocol</span>
          </div>
        </div>
      )}
    </div>
  );
}

function BadgeCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
