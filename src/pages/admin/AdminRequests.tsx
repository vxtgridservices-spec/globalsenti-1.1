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
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { 
  MessageSquare, 
  ShoppingBag, 
  CheckCircle2, 
  Trash2, 
  Eye,
  Clock,
  ShieldCheck,
  Users,
  Search
} from "lucide-react";

import { supabase } from "@/src/lib/supabase";
import { Loader2, MessageCircle } from "lucide-react";
import { DealStageModal } from "@/src/components/deals/DealModals";
import { sendTransactionalEmail } from "@/src/services/emailService";

export function AdminRequests() {
  const [requests, setRequests] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [profiles, setProfiles] = React.useState<Record<string, any>>({});
  const [selectedRequest, setSelectedRequest] = React.useState<any>(null);
  const [isChatModalOpen, setIsChatModalOpen] = React.useState(false);
  const [viewTab, setViewTab] = React.useState<'all' | 'admin' | 'broker'>('all');

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setUserProfile(profile);

      let query = supabase.from('requests').select('*')
        .not('type', 'in', '("consultation","support")');

      // If user is a broker, only show their deals
      if (profile?.role === 'broker') {
        query = query.eq('broker_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setRequests(data || []);

      // Fetch unique broker profiles to display names
      const brokerIds = Array.from(new Set((data || []).map(r => r.broker_id).filter(Boolean)));
      if (brokerIds.length > 0) {
        const { data: pData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', brokerIds);
        
        if (pData) {
          const pMap = pData.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
          setProfiles(pMap);
        }
      }

    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('admin-requests-sync')
      .on('postgres_changes', {
        event: '*', // Listen to inserts, updates, deletes
        schema: 'public',
        table: 'requests'
      }, () => {
        fetchRequests(); // Refresh list on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const openChat = (req: any) => {
    setSelectedRequest(req);
    setIsChatModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return;
    
    try {
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setRequests(requests.filter(r => r.id !== id));
    } catch (error) {
      console.error("Error deleting request:", error);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updateData: any = { status: newStatus };
      if (newStatus === 'qualified') {
        updateData.stage = 'qualified';
      } else if (newStatus === 'rejected') {
        updateData.stage = 'rejected';
      }
      
      const { error } = await supabase
        .from('requests')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;

      // Send Emails based on status update
      const targetReq = requests.find(r => r.id === id);
      if (targetReq) {
        const buyerEmail = targetReq.metadata?.email;
        const buyerName = targetReq.name || targetReq.metadata?.name || "Valued Client";

        if (newStatus === 'qualified') {
          if (buyerEmail) {
            sendTransactionalEmail('deal-invitation', buyerEmail, {
              userName: buyerName,
              dealId: targetReq.deal_id,
              dealType: targetReq.metadata?.commodity || "Private Deal",
              timestamp: new Date().toLocaleString(),
            });
          }
        } else if (newStatus === 'rejected') {
          if (buyerEmail) {
            sendTransactionalEmail('deal-rejected', buyerEmail, {
               userName: buyerName,
               dealId: targetReq.deal_id,
               reason: "Your request does not meet the current qualification requirements for this institutional-grade opportunity.",
               timestamp: new Date().toLocaleString(),
            });
          }
        }

        // Log system message
        let targetBuyerId = targetReq.buyer_id || targetReq.metadata?.buyer_id || null;
        
        if (!targetBuyerId && targetReq.metadata?.email) {
          const { data: pData } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', targetReq.metadata.email)
            .single();
          if (pData) {
            targetBuyerId = pData.id;
            // Link it via metadata
            const newMetadata = { ...targetReq.metadata, buyer_id: targetBuyerId };
            await supabase.from('requests').update({ metadata: newMetadata }).eq('id', targetReq.id);
          }
        }

        await supabase.from('messages').insert([{
          request_id: targetReq.id,
          deal_id: targetReq.deal_id,
          buyer_id: targetBuyerId,
          sender_id: user.id,
          sender_role: userProfile?.role || 'admin',
          body: `[PROTOCOL UPDATE] Administration updated status to: ${newStatus.toUpperCase()}`,
          message: `[PROTOCOL UPDATE] Administration updated status to: ${newStatus.toUpperCase()}`
        }]);
      }

      setRequests(requests.map(r => r.id === id ? { ...r, ...updateData } : r));
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <AdminLayout title="Request Management" icon={MessageSquare}>
      <div className="space-y-8">
        <div>
          <p className="text-gray-400 -mt-6 mb-8">Review purchase requests and broker inquiries from the platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-secondary/20 border-white/5">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest">Deal Requests</p>
                <p className="text-2xl font-serif text-white">
                  {requests.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-secondary/20 border-white/5">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest">Internal (HQ)</p>
                <p className="text-2xl font-serif text-white">
                  {requests.filter(r => r.broker_id === 'admin' || !r.broker_id).length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-secondary/20 border-white/5">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest">Broker Network</p>
                <p className="text-2xl font-serif text-white">
                  {requests.filter(r => r.broker_id && r.broker_id !== 'admin').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {userProfile?.role === 'admin' && (
          <div className="flex gap-4 p-1 bg-black/40 border border-white/5 rounded-2xl w-fit">
            <Button 
              variant={viewTab === 'all' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setViewTab('all')}
              className="rounded-xl h-10 px-6 font-bold uppercase tracking-widest text-[10px]"
            >
              All Activity
            </Button>
            <Button 
              variant={viewTab === 'admin' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setViewTab('admin')}
              className="rounded-xl h-10 px-6 font-bold uppercase tracking-widest text-[10px]"
            >
              Direct GSG
            </Button>
            <Button 
              variant={viewTab === 'broker' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setViewTab('broker')}
              className="rounded-xl h-10 px-6 font-bold uppercase tracking-widest text-[10px]"
            >
              Partner Network
            </Button>
          </div>
        )}

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
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Type</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Requester</TableHead>
                    {userProfile?.role === 'admin' && (
                      <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Facilitator</TableHead>
                    )}
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Deal Reference</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Status</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Submitted</TableHead>
                    <TableHead className="text-right text-gray-400 font-bold uppercase tracking-widest text-[10px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests
                    .filter(r => {
                      if (viewTab === 'admin') return r.broker_id === 'admin' || !r.broker_id;
                      if (viewTab === 'broker') return r.broker_id && r.broker_id !== 'admin';
                      return true;
                    })
                    .map((req) => (
                    <TableRow key={req.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {req.type === "purchase" ? (
                            <ShoppingBag className="w-4 h-4 text-gold" />
                          ) : (
                            <MessageSquare className="w-4 h-4 text-blue-400" />
                          )}
                          <span className="text-white text-sm font-medium capitalize">{req.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-white font-medium">{req.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">{req.company}</p>
                        </div>
                      </TableCell>
                      {userProfile?.role === 'admin' && (
                        <TableCell>
                          {req.broker_id && req.broker_id !== 'admin' ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                                <Users className="w-3 h-3 text-blue-400" />
                              </div>
                              <span className="text-xs text-blue-400 truncate max-w-[120px]">
                                {profiles[req.broker_id]?.full_name || profiles[req.broker_id]?.email || "Partner Broker"}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-gold/10 rounded-full flex items-center justify-center border border-gold/20">
                                <ShieldCheck className="w-3 h-3 text-gold" />
                              </div>
                              <span className="text-xs text-gold">GSG Principal</span>
                            </div>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="font-mono text-xs text-gold">
                        <a href={`/deal/${req.deal_id}?rid=${req.id}`} target="_blank" className="hover:underline">
                          {req.deal_id}
                        </a>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 
                          req.status === 'qualified' ? 'bg-green-500/20 text-green-500' :
                          req.status === 'due_diligence' ? 'bg-blue-500/20 text-blue-500' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {req.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-500 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(req.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {req.status !== 'pending' && req.status !== 'rejected' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-gray-400 hover:text-blue-500"
                              onClick={() => openChat(req)}
                              title="Open Deal Room"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-gray-400 hover:text-green-500"
                            onClick={() => handleStatusUpdate(req.id, 'qualified')}
                            title="Qualify Request"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-gray-400 hover:text-red-400"
                            onClick={() => handleStatusUpdate(req.id, 'rejected')}
                            title="Reject Request"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      {selectedRequest && (
        <DealStageModal 
          isOpen={isChatModalOpen}
          onClose={() => setIsChatModalOpen(false)}
          deal={{ 
            id: selectedRequest.deal_id, 
            title: "Requested Deal", 
            broker_id: selectedRequest.broker_id || "admin",
            buyer_id: selectedRequest.buyer_id || selectedRequest.metadata?.buyer_id
          } as any}
          userRequest={selectedRequest}
        />
      )}
    </AdminLayout>
  );
}
