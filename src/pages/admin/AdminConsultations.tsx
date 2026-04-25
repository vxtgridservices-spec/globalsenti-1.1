import * as React from "react";
import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/src/components/ui/table";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { 
  Users, 
  Mail, 
  CheckCircle2, 
  Trash2, 
  Clock,
  Eye,
  MessageSquare,
  Shield,
  Send,
  Loader2
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/src/components/ui/dialog";
import { Textarea } from "@/src/components/ui/textarea";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";

export function AdminConsultations() {
  const [consultations, setConsultations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedInquiry, setSelectedInquiry] = React.useState<any>(null);
  const [replyText, setReplyText] = React.useState("");
  const [isReplying, setIsReplying] = React.useState(false);

  const fetchConsultations = async () => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .in('type', ['consultation', 'support'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      console.error("Error fetching consultations:", error);
      toast.error("Failed to fetch consultations.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchConsultations();

    const channel = supabase
      .channel('admin-consultations-sync')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'requests'
      }, () => {
        fetchConsultations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(`Consultation marked as ${newStatus}`);
      setConsultations(consultations.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this consultation record?")) return;
    
    try {
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success("Consultation record deleted.");
      setConsultations(consultations.filter(c => c.id !== id));
      if (selectedInquiry?.id === id) setSelectedInquiry(null);
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record.");
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      toast.error("Please enter a response.");
      return;
    }

    setIsReplying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: defaultDeal } = await supabase.from('deals').select('id').limit(1).single();
      const fallbackDealId = defaultDeal?.id || "DR-2024-001";
      
      // We must have a buyer_id for the messages table constraint.
      // If the inquiry doesn't have one (e.g. anonymous submission), we try to find a profile by email
      let targetBuyerId = selectedInquiry.buyer_id || selectedInquiry.metadata?.buyer_id;
      
      if (!targetBuyerId && selectedInquiry.metadata?.email) {
        const { data: pData } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', selectedInquiry.metadata.email)
          .single();
        
        if (pData) {
          targetBuyerId = pData.id;
          // Update the request as well so it's linked permanently
          await supabase.from('requests').update({ buyer_id: targetBuyerId }).eq('id', selectedInquiry.id);
        }
      }

      // Default to admin if still no buyer_id found to satisfy constraint, 
      // but ideally this shouldn't happen for client replies
      targetBuyerId = targetBuyerId || user.id;

      const { error } = await supabase.from('messages').insert([{
        request_id: selectedInquiry.id,
        deal_id: selectedInquiry.deal_id || fallbackDealId,
        buyer_id: targetBuyerId,
        sender_id: user.id,
        sender_role: 'admin',
        body: `[SYSTEM RESPONSE] ${replyText.trim()}`,
        message: `[SYSTEM RESPONSE] ${replyText.trim()}`
      }]);
      if (error) throw error;

      await handleStatusUpdate(selectedInquiry.id, 'contacted');
      toast.success("Secure response transmitted.");
      setReplyText("");
      fetchHistory(selectedInquiry.id); // Refresh logs
    } catch (err) {
      console.error(err);
      toast.error("Failed to transmit response.");
    } finally {
      setIsReplying(false);
    }
  };

  const [history, setHistory] = React.useState<any[]>([]);

  const fetchHistory = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });
      if (!error) setHistory(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (!selectedInquiry) return;

    fetchHistory(selectedInquiry.id);

    const channel = supabase
      .channel(`admin-history-${selectedInquiry.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `request_id=eq.${selectedInquiry.id}`
      }, () => {
        fetchHistory(selectedInquiry.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedInquiry]);

  const openInquiry = (inquiry: any) => {
    setSelectedInquiry(inquiry);
    setReplyText("");
  };

  return (
    <AdminLayout title="Consultations & Support" icon={Users}>
      <div className="space-y-8">
        <div>
          <p className="text-gray-400 -mt-6 mb-8 text-sm">
            Manage inquiries and private consultation requests from potential clients and partners across security, trade, chemicals and investments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-secondary/20 border-white/5">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Total Inquiries</p>
                <p className="text-2xl font-serif text-white">{consultations.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-secondary/20 border-white/5">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Pending Review</p>
                <p className="text-2xl font-serif text-white">
                  {consultations.filter(c => c.status === 'pending').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-secondary/20 border-white/5">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Processed</p>
                <p className="text-2xl font-serif text-white">
                  {consultations.filter(c => c.status === 'contacted').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-secondary/20 border-white/5">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Support Protocols</p>
                <p className="text-2xl font-serif text-white">{consultations.filter(c => c.type === 'support').length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-secondary/20 border-white/5">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 text-gold animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Prospect/Client</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Category</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Inquiry Type</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Status</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Received</TableHead>
                    <TableHead className="text-right text-gray-400 font-bold uppercase tracking-widest text-[10px]">Operations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consultations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-gray-500 font-serif">
                        No active consultation or support inquiries.
                      </TableCell>
                    </TableRow>
                  ) : (
                    consultations.map((con) => (
                      <TableRow key={con.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                        <TableCell>
                          <div>
                            <p className="text-white font-medium">{con.name || con.metadata?.sender_name || "Confidential"}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                              {con.metadata?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${con.type === 'support' ? 'bg-blue-500/10 text-blue-400' : 'bg-gold/10 text-gold'}`}>
                            {con.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="text-white text-xs font-medium capitalize">
                            {con.metadata?.commodity || "General"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            con.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 
                            con.status === 'contacted' ? 'bg-green-500/20 text-green-500' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {con.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-500 text-[10px]">
                          {new Date(con.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-gray-400 hover:text-gold"
                              onClick={() => openInquiry(con)}
                              title="View Full Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-gray-400 hover:text-red-400"
                              onClick={() => handleDelete(con.id)}
                              title="Secure Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inquiry Detail Modal */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="bg-secondary border-white/10 text-white sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-white flex items-center gap-2">
              <MessageSquare className="text-gold w-6 h-6" /> Inquiry Details
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Secure protocol review for {selectedInquiry?.type} acquisition/consultation.
            </DialogDescription>
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Sender</p>
                  <p className="text-sm font-bold text-white">{selectedInquiry.name || selectedInquiry.metadata?.sender_name || "Confidential"}</p>
                  <p className="text-xs text-gold truncate">{selectedInquiry.metadata?.email}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Inquiry Type</p>
                  <p className="text-sm font-bold text-white capitalize">{selectedInquiry.metadata?.commodity || "General Inquiry"}</p>
                  <p className="text-xs text-gray-400">{selectedInquiry.company || "Private Individual"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Secure Protocol Log</p>
                <div className="bg-background border border-white/10 rounded-lg p-4 max-h-[250px] overflow-y-auto space-y-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-[9px] text-gold uppercase tracking-widest font-bold">Client Initial Transmission</p>
                    <p className="text-sm text-gray-300 italic">"{selectedInquiry.metadata?.message || "No message body provided."}"</p>
                  </div>
                  
                  {history.map((msg) => (
                    <div key={msg.id} className={`flex flex-col gap-1 p-2 rounded ${msg.sender_role === 'admin' ? 'bg-gold/5 border-l-2 border-gold ml-4' : 'bg-white/5 mr-4'}`}>
                      <div className="flex justify-between items-center">
                        <p className={`text-[8px] uppercase tracking-widest font-black ${msg.sender_role === 'admin' ? 'text-gold' : 'text-blue-400'}`}>
                          {msg.sender_role === 'admin' ? 'Strategic Advisor' : 'Client'}
                        </p>
                        <p className="text-[8px] text-gray-600">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <p className="text-xs text-white">
                        {msg.body.replace('[SYSTEM RESPONSE] ', '').replace('[SYSTEM] ', '').replace('[System] ', '')}
                      </p>
                    </div>
                  ))}

                  {history.length === 0 && (
                     <p className="text-[10px] text-center text-gray-600 uppercase tracking-tighter">No administrative responses logged for this protocol.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Administrative Response</p>
                <Textarea 
                  placeholder={selectedInquiry.type === 'support' ? "Enter secure response..." : "Draft follow-up notes or click 'Email' below..."}
                  className="bg-background border-white/10 text-white min-h-[100px] resize-none text-sm"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
              </div>
            </div>
          )}

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setSelectedInquiry(null)}
                className="border-white/10 hover:bg-white/5 text-xs h-10 px-6 font-bold"
              >
                LATER
              </Button>
              
              <Button 
                asChild
                variant="outline"
                className="border-blue-500/30 text-blue-400 hover:bg-blue-400/10 text-xs h-10 px-4 font-bold gap-2"
              >
                <a href={`mailto:${selectedInquiry?.metadata?.email}?subject=GSG Follow-up: ${selectedInquiry?.metadata?.commodity}`}>
                  <Mail className="w-4 h-4" /> EMAIL
                </a>
              </Button>

              <Button 
                onClick={handleSendReply}
                disabled={isReplying}
                className="bg-gold hover:bg-gold-dark text-background text-xs h-10 px-6 font-bold gap-2 flex-grow"
              >
                {isReplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                TRANSMIT RESPONSE
              </Button>
            </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

