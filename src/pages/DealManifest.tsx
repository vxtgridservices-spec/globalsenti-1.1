import * as React from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { Deal } from "@/src/data/deals";
import { Loader2, ShieldCheck, Lock, FileText, Download, ArrowLeft, CheckCircle2, Globe, Scale, Truck, BadgeCheck, Briefcase, History, FileSearch, Users } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PageLayout } from "@/src/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { motion } from "motion/react";
import { DealStageTracker, DealStage, DEAL_STAGES } from "@/src/components/deals/DealStageTracker";
import { EscrowTracker } from "@/src/components/deals/EscrowTracker";
import { FundingInstructions } from "@/src/components/deals/FundingInstructions";
import { ContractModule } from "@/src/components/deals/ContractModule";
import { PurchaseRequestModal, DealStageModal } from "@/src/components/deals/DealModals";

export function DealManifest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const ridOverride = queryParams.get('rid');
  
  const [dealData, setDealData] = React.useState<Deal | null>(null);
  const [userRequest, setUserRequest] = React.useState<any>(null);
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [brokerProfile, setBrokerProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = React.useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = React.useState(false);

  const generatePDF = () => {
    if (!dealData) return;

    const doc = new jsPDF();
    const gold: [number, number, number] = [197, 165, 114]; // #C5A572 (Gold brand color relative)
    const black: [number, number, number] = [20, 20, 20];

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
    doc.text("CONFIDENTIAL COMMODITY MANIFEST", 20, 30);
    
    doc.text(`ID: ${dealData.id}`, 190, 20, { align: "right" });
    doc.text(`DATE: ${new Date().toLocaleDateString()}`, 190, 30, { align: "right" });

    let currentY = 55;

    // SECTION 1: Commodity Details
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("SECTION 1: COMMODITY SPECIFICATIONS", 20, currentY);
    currentY += 10;
    
    autoTable(doc, {
      startY: currentY,
      head: [["Attribute", "Specification"]],
      body: [
        ["Commodity Type", dealData.commodityType || dealData.type],
        ["Form / Appearance", dealData.form],
        ["Quantity", dealData.quantity],
        ["Purity / Grade", dealData.purity],
        ["Origin", dealData.origin],
        ["Current Location", dealData.location]
      ],
      theme: "striped",
      headStyles: { fillColor: gold, textColor: black, fontStyle: "bold" },
      styles: { fontSize: 10, cellPadding: 3 },
      margin: { left: 20, right: 20 }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;

    // SECTION 2: Pricing
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.setFontSize(14);
    doc.text("SECTION 2: PRICING & TERMS", 20, currentY);
    currentY += 10;
    
    autoTable(doc, {
      startY: currentY,
      head: [["Financial Field", "Details"]],
      body: [
        ["Pricing Type", dealData.pricing?.type || "Standard"],
        ["Market Position", dealData.pricing?.marketPosition || "Market Value"],
        ["Currency", dealData.pricing?.currency || "USD"],
        ["Payment Terms", dealData.pricing?.paymentTerms || "Wire Transfer"]
      ],
      theme: "striped",
      headStyles: { fillColor: gold, textColor: black, fontStyle: "bold" },
      styles: { fontSize: 10, cellPadding: 3 },
      margin: { left: 20, right: 20 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // SECTION 3: Logistics
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.setFontSize(14);
    doc.text("SECTION 3: LOGISTICS & DELIVERY", 20, currentY);
    currentY += 10;

    autoTable(doc, {
      startY: currentY,
      head: [["Logistics Component", "Protocol"]],
      body: [
        ["Delivery Terms", dealData.logistics?.deliveryTerms || "TBD"],
        ["Shipping Port", dealData.logistics?.shippingPort || "TBD"],
        ["Inspection Agency", dealData.logistics?.inspectionAgency || "TBD"],
        ["Insurance", dealData.logistics?.insurance || "Standard"]
      ],
      theme: "striped",
      headStyles: { fillColor: gold, textColor: black, fontStyle: "bold" },
      styles: { fontSize: 10, cellPadding: 3 },
      margin: { left: 20, right: 20 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Check if we need a new page
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    // SECTION 4: Documentation
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.setFontSize(14);
    doc.text("SECTION 4: VERIFIED DOCUMENTATION", 20, currentY);
    currentY += 10;

    const docItems = (dealData.documents || []).map(d => [d.name, d.size]);
    autoTable(doc, {
      startY: currentY,
      head: [["Document Name", "Status / Size"]],
      body: docItems.length > 0 ? docItems : [["No documents listed", "N/A"]],
      theme: "plain",
      headStyles: { fillColor: [240, 240, 240], textColor: black, fontStyle: "bold" },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 20 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // SECTION 5: Conditions
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.setFontSize(14);
    doc.text("SECTION 5: TRANSACTION CONDITIONS", 20, currentY);
    currentY += 10;

    autoTable(doc, {
      startY: currentY,
      head: [["Condition", "Requirement"]],
      body: [
        ["Minimum Order (MOQ)", dealData.conditions?.moq || "TBD"],
        ["Contract Duration", dealData.conditions?.contractDuration || "TBD"],
        ["Exclusivity Terms", dealData.conditions?.exclusivity || "TBD"]
      ],
      theme: "striped",
      headStyles: { fillColor: gold, textColor: black, fontStyle: "bold" },
      styles: { fontSize: 10, cellPadding: 3 },
      margin: { left: 20, right: 20 }
    });

    // FOOTER
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(black[0], black[1], black[2]);
        doc.rect(0, 280, 210, 20, "F");
        
        doc.setTextColor(gold[0], gold[1], gold[2]);
        doc.setFontSize(8);
        doc.text("CONFIDENTIAL DOCUMENT - GLOBAL SENTINEL GROUP", 105, 288, { align: "center" });
        
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(6);
        const disclaimer = "This document is property of Global Sentinel Group. Unauthorized distribution, copying, or disclosure is strictly prohibited by law. All data provided is confidential and for intended recipient use only.";
        doc.text(disclaimer, 105, 293, { align: "center" });
    }

    doc.save(`Manifest-${dealData.id}.pdf`);
  };

  React.useEffect(() => {
    const fetchDeal = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
          .from('deals')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setDealData(data);

        // Fetch Broker Profile
        if (data.broker_id && data.broker_id !== 'admin' && data.broker_id !== 'admin-system') {
          const { data: bProfile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', data.broker_id)
            .single();
          setBrokerProfile(bProfile);
        }

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          setUserProfile(profile);

          let reqQuery = supabase
             .from('requests')
             .select('*')
             .eq('deal_id', id);
          
          if (ridOverride) {
            // Admin/Broker override to view specific request
            reqQuery = reqQuery.eq('id', ridOverride);
          } else {
            // Buyer view: fetch their own request
            const orQuery = `buyer_id.eq.${user.id},metadata->>buyer_id.eq.${user.id}${user.email ? `,metadata->>email.eq.${user.email}` : ''}`;
            reqQuery = reqQuery.or(orQuery);
          }

          const { data: reqData } = await reqQuery
             .order('created_at', { ascending: false })
             .limit(1)
             .maybeSingle();

          if (reqData) {
            setUserRequest(reqData);
          }
        }
      } catch (error) {
        console.error("Error fetching deal:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, [id]);

  // Realtime stage sync
  React.useEffect(() => {
    if (!userRequest?.id) return;

    // Section: Real-time Protocol Synchronization
    const channel = supabase
      .channel(`manifest-sync-${userRequest.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'requests',
        filter: `id=eq.${userRequest.id}`
      }, (payload) => {
        // Rule 3: Direct state injection from DB source of truth
        setUserRequest(payload.new);
        console.log("[PROTOCOL SYNC] Stage Advanced:", payload.new.stage);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRequest?.id]);

  const handleInitiateDueDiligence = async () => {
    if (!userRequest || userRequest.status !== "qualified") return;
    
    // Permission check: Only Facilitators can initiate due diligence
    if (userProfile?.role !== 'admin' && userProfile?.role !== 'broker') {
      toast.error("Permission denied: Only Global Sentinel Group officers or assigned brokers can initiate this protocol.");
      return;
    }

    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: 'due_diligence', stage: 'due_diligence' })
        .eq('id', userRequest.id);
      
      if (error) throw error;
      
      setUserRequest((prev: any) => ({ ...prev, status: 'due_diligence', stage: 'due_diligence' }));

      // Protocol Log
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("messages").insert([{
          request_id: userRequest.id,
          deal_id: userRequest.deal_id,
          buyer_id: userRequest.metadata?.buyer_id || null,
          sender_id: user.id,
          sender_role: userProfile?.role || 'admin',
          body: `[PROTOCOL UPDATE] System initiated Due Diligence protocol.`,
          message: `[PROTOCOL UPDATE] System initiated Due Diligence protocol.`
        }]);
      }

      toast.success("Due diligence process initiated. Our compliance team will proceed.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to initiate due diligence.");
    }
  };

  const handleOpenDealRoom = () => {
    setIsContactModalOpen(true);
    // REMOVED auto-update for buyers. Brokers/Admins can update stages manually.
  };

  const handleUpdateStage = async (newStage: DealStage) => {
    if (!userRequest) return;

    // Permission check
    if (userProfile?.role !== 'admin' && userProfile?.role !== 'broker') {
      // In the case of handleOpenDealRoom, we allow it to auto-update if it's the right transition for a buyer
      // but maybe we should still be strict. 
      // Actually, handleOpenDealRoom triggers handleUpdateStage("deal_negotiation").
      // If we want to be strict, we don't automatically update stage just by opening a modal.
    }

    try {
      const { error } = await supabase
        .from('requests')
        .update({ stage: newStage })
        .eq('id', userRequest.id);
      
      if (error) throw error;
      setUserRequest((prev: any) => ({ ...prev, stage: newStage }));

      // Protocol Log
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let logMessage = `[PROTOCOL UPDATE] Manual stage transition to: ${newStage.toUpperCase().replace('_', ' ')}`;
        if (newStage === 'escrow') {
          logMessage = `[System] Execution & Escrow activated`;
        } else if (newStage === 'closed') {
          logMessage = `[System] Deal Closed. Transaction successfully settled.`;
        }

        await supabase.from("messages").insert([{
          request_id: userRequest.id,
          deal_id: userRequest.deal_id,
          buyer_id: userRequest.metadata?.buyer_id || null,
          sender_id: user.id,
          sender_role: userProfile?.role || 'admin',
          body: logMessage,
          message: logMessage
        }]);
      }
    } catch (err) {
      console.error("Failed to update stage:", err);
      toast.error("Failed to update deal stage.");
    }
  };

  const currentStage = userRequest?.stage || "interest";
  const isAdmin = userProfile?.role === "admin";

  if (loading) {
    return (
      <PageLayout title="Loading..." subtitle="Retrieving secure manifest data.">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-gold animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (!dealData) {
    return (
      <PageLayout 
        title="Access Restricted" 
        subtitle="The requested deal manifest could not be found or your access level is insufficient."
      >
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-red-500 w-10 h-10" />
          </div>
          <h2 className="text-3xl font-serif text-white mb-4">Deal Not Found</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            This deal may have been closed, archived, or requires a higher security clearance to view.
          </p>
          <Button 
            className="bg-gold text-background font-bold gap-2"
            onClick={() => navigate("/deal-room")}
          >
            <ArrowLeft className="w-4 h-4" /> Return to Deal Room
          </Button>
        </div>
      </PageLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available": return "bg-green-500/20 text-green-500 border-green-500/50";
      case "Under Review": return "bg-blue-500/20 text-blue-500 border-blue-500/50";
      case "Closed": return "bg-red-500/20 text-red-500 border-red-500/50";
      default: return "bg-gray-500/20 text-gray-500 border-gray-500/50";
    }
  };

  const getStageBadgeText = (stage: string) => {
    switch(stage) {
      case "interest": return "Expression of Interest";
      case "review": return "Under Review";
      case "qualified": return "Prospect Qualified";
      case "negotiation": return "Negotiation in Progress";
      case "due_diligence": return "Due Diligence Ongoing";
      case "terms_agreed": return "Terms Agreed";
      case "contract_issued": return "Contract Issued";
      case "escrow": return "Execution & Escrow";
      case "closed": return "Deal Closed";
      case "rejected": return "Request Terminated";
      default: return stage;
    }
  };

  return (
    <PageLayout 
      title="Deal Manifest" 
      subtitle="Confidential investor-grade documentation for high-value commodity transactions."
    >
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="text-gold hover:text-gold-light hover:bg-gold/10 mb-8 gap-2"
          onClick={() => navigate("/deal-room")}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Deal Room
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-secondary/20 border border-white/5 rounded-3xl p-8 backdrop-blur-xl"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(dealData.status)}`}>
                      {dealData.status}
                    </span>
                    {userRequest && userRequest.stage && (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gold/50 bg-gold/10 text-gold shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                        {getStageBadgeText(userRequest.stage)}
                      </span>
                    )}
                    
                    {brokerProfile ? (
                       <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-500/30 bg-blue-500/10 text-blue-400 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Partner: {brokerProfile.full_name || brokerProfile.email.split('@')[0]}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gold/30 bg-gold/10 text-gold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-gold" /> GSG Principal
                      </span>
                    )}

                    <span className="text-gray-500 text-[10px] font-mono tracking-[0.2em] uppercase">REF: {dealData.id}</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-serif text-white leading-tight">{dealData.title}</h1>
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] mb-2">Security Level</p>
                  <p className="text-gold font-bold text-xs flex items-center gap-2 justify-end tracking-widest">
                    <Lock className="w-3.5 h-3.5" /> HIGHLY RESTRICTED
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-4 pt-8 border-t border-white/5">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Commodity Type</p>
                  <p className="text-lg text-white font-serif">{dealData.commodityType}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Quantity</p>
                  <p className="text-lg text-white font-serif">{dealData.quantity}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Purity / Spec</p>
                  <p className="text-lg text-white font-serif">{dealData.purity}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Form</p>
                  <p className="text-lg text-white font-serif">{dealData.form}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Origin</p>
                  <p className="text-lg text-white font-serif flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gold/50" /> {dealData.origin}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Current Location</p>
                  <p className="text-lg text-white font-serif">{dealData.location}</p>
                </div>
              </div>
            </motion.div>

            {/* Pricing & Logistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-secondary/20 border-white/5">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Scale className="w-5 h-5 text-gold" /> Pricing Structure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400 text-sm">Pricing Type</span>
                    <span className="text-white font-medium">{dealData.pricing?.type || "Standard"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400 text-sm">Market Position</span>
                    <span className="text-gold font-bold">{dealData.pricing?.marketPosition || "Market Value"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400 text-sm">Currency</span>
                    <span className="text-white font-medium">{dealData.pricing?.currency || "USD"}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400 text-sm">Payment Terms</span>
                    <span className="text-white font-medium">{dealData.pricing?.paymentTerms || "Wire Transfer"}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-secondary/20 border-white/5">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Truck className="w-5 h-5 text-gold" /> Logistics & Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400 text-sm">Delivery Terms</span>
                    <span className="text-white font-medium">{dealData.logistics?.deliveryTerms || "TBD"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400 text-sm">Shipping Port</span>
                    <span className="text-white font-medium">{dealData.logistics?.shippingPort || "TBD"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400 text-sm">Inspection Agency</span>
                    <span className="text-white font-medium">{dealData.logistics?.inspectionAgency || "TBD"}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400 text-sm">Insurance</span>
                    <span className="text-white font-medium">{dealData.logistics?.insurance || "Standard"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Documents Section */}
            <section>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold" /> Verified Documentation
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dealData.documents.map((doc, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-gold/30 transition-all group cursor-pointer"
                    onClick={() => {
                        const link = document.createElement('a');
                        // Creating a dummy file to represent the download since we don't have real files
                        const blob = new Blob(["This is a securely encrypted placeholder for: " + doc.name], { type: "text/plain" });
                        link.href = URL.createObjectURL(blob);
                        link.download = doc.name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{doc.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{doc.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-gray-400 group-hover:text-gold">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </section>

            {/* Deal Conditions */}
            <Card className="bg-secondary/20 border-white/5">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-gold" /> Transaction Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Min Order Quantity</p>
                  <p className="text-white font-bold">{dealData.conditions?.moq || "TBD"}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Contract Duration</p>
                  <p className="text-white font-bold">{dealData.conditions?.contractDuration || "TBD"}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Exclusivity</p>
                  <p className="text-white font-bold">{dealData.conditions?.exclusivity || "TBD"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar / Action Panel */}
          <div className="space-y-8">
            {/* Compliance Section */}
            <Card className="bg-secondary/20 border-white/5">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-gold" /> Compliance Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-white font-medium">KYC Verification</span>
                  </div>
                  <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">{dealData.compliance.kyc}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-white font-medium">AML Compliance</span>
                  </div>
                  <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">{dealData.compliance.aml}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gold/5 border border-gold/10">
                  <div className="flex items-center gap-3">
                    <BadgeCheck className="w-4 h-4 text-gold" />
                    <span className="text-sm text-white font-medium">Seller Status</span>
                  </div>
                  <span className="text-[10px] font-bold text-gold uppercase tracking-widest">TIER-1</span>
                </div>
              </CardContent>
            </Card>


            {/* Stage Tracker - Appears above actions if there is a request - Facilitators ONLY */}
            {userRequest && userProfile?.role !== 'buyer' && (
              <DealStageTracker 
                currentStage={currentStage} 
                isAdmin={isAdmin || userProfile?.role === 'broker'}
                onUpdateStage={handleUpdateStage}
              />
            )}

            {/* Action Panel */}
            <Card className="bg-gold border-none overflow-hidden relative lg:sticky lg:top-32 z-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2)_0%,_transparent_70%)]" />
              <CardContent className="p-8 relative z-10 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <BadgeCheck className="w-6 h-6 text-background" />
                  <h3 className="text-background font-bold uppercase tracking-widest text-sm">Initiate Transaction</h3>
                </div>
                
                <div className="space-y-3">
                  {!userRequest && (
                    <Button 
                      className="w-full bg-background text-white hover:bg-background/90 font-bold h-14 text-lg"
                      onClick={() => setIsPurchaseModalOpen(true)}
                    >
                      Express Interest
                    </Button>
                  )}
                  {userRequest?.status === "pending" && (
                    <Button 
                      className="w-full bg-background/50 text-background/80 font-bold h-14 text-lg cursor-not-allowed border-none"
                      disabled
                    >
                      Under Review
                    </Button>
                  )}
                  {userRequest?.status === "due_diligence" && (
                    <div className="w-full min-h-14 py-2 bg-blue-900/20 text-blue-900 font-bold text-center text-lg flex items-center justify-center rounded-md border border-blue-900/30 mb-2">
                      Due Diligence in Progress
                    </div>
                  )}
                  {userRequest && userRequest.status !== "pending" && userRequest.status !== "rejected" && (
                    <Button 
                      variant="outline" 
                      className="w-full border-background/20 bg-transparent text-background hover:bg-background/10 font-bold h-12"
                      onClick={handleOpenDealRoom}
                    >
                      Open Deal Room
                    </Button>
                  )}
                  {userRequest?.status === "rejected" && (
                    <Button 
                      variant="outline" 
                      className="w-full border-red-500/10 bg-transparent text-red-500/50 font-bold h-12 cursor-not-allowed"
                      disabled
                    >
                      Request Rejected
                    </Button>
                  )}
                </div>

                <div className="pt-6 border-t border-background/10 space-y-4">
                  <button 
                    onClick={generatePDF}
                    className="flex items-center gap-3 text-background/80 hover:text-background transition-colors text-sm font-bold w-full"
                  >
                    <Download className="w-4 h-4" /> Download Full Manifest (PDF)
                  </button>
                  <button 
                    className={`flex items-center gap-3 text-sm font-bold w-full transition-colors ${
                      userRequest && userRequest.status !== "pending" && userRequest.status !== "rejected"
                        ? "text-background/80 hover:text-background cursor-pointer" 
                        : "text-background/40 cursor-not-allowed"
                    }`}
                    onClick={handleInitiateDueDiligence}
                    disabled={!userRequest || userRequest.status === "pending" || userRequest.status === "rejected"}
                  >
                    <FileSearch className="w-4 h-4" /> Initiate Due Diligence
                  </button>
                </div>
                
                <p className="text-[10px] text-background/60 font-medium text-center italic">
                  * All engagements follow compliance and qualification procedures.
                </p>
              </CardContent>
            </Card>

            {/* Confidential Label */}
            <div className="text-center p-4 border border-white/5 rounded-xl bg-white/5">
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-bold">
                Confidential Deal Document
              </p>
              <p className="text-[8px] text-gray-600 mt-1 uppercase">
                Property of Global Sentinel Group. Unauthorized distribution is prohibited.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PurchaseRequestModal 
        isOpen={isPurchaseModalOpen} 
        onClose={() => {
          setIsPurchaseModalOpen(false);
          // Simple optimistic check to refresh request logic if they submitted
          setUserRequest((prev: any) => prev || { status: 'pending', type: 'EOI' });
        }} 
        deal={dealData} 
      />
      <DealStageModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
        deal={dealData}
        userRequest={userRequest}
      />
    </PageLayout>
  );
}
