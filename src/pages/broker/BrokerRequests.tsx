import * as React from "react";
import { BrokerLayout } from "@/src/components/broker/BrokerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/src/components/ui/table";
import { Button } from "@/src/components/ui/button";
import { 
  MessageSquare, 
  User, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  MoreHorizontal,
  Loader2,
  ExternalLink,
  Mail,
  Phone
} from "lucide-react";
import { supabase } from "@/src/lib/supabase";

export function BrokerRequests() {
  const [requests, setRequests] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchRequests = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Get broker's deals first to find associated requests
        const { data: deals } = await supabase
          .from('deals')
          .select('id, title')
          .eq('broker_id', user.id);

        if (!deals || deals.length === 0) {
          setRequests([]);
          setLoading(false);
          return;
        }

        const dealIds = deals.map(d => d.id);
        const dealMap = deals.reduce((acc, d) => ({ ...acc, [d.id]: d.title }), {});

        // 2. Fetch requests for these deal IDs
        const { data, error } = await supabase
          .from('requests')
          .select('*')
          .in('deal_id', dealIds)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Enhance requests with deal title
        const enhancedRequests = (data || []).map(req => ({
          ...req,
          dealTitle: dealMap[req.deal_id] || req.deal_id
        }));

        setRequests(enhancedRequests);
      } catch (error) {
        console.error("Error fetching broker requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (error) {
      console.error("Error updating request status:", error);
    }
  };

  return (
    <BrokerLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-serif text-white mb-2">Inquiries & Leads</h1>
          <p className="text-gray-400">Manage purchase requests and contact inquiries from verified prospects.</p>
        </div>

        <Card className="bg-secondary/20 border-white/5 font-sans">
          <CardHeader className="border-b border-white/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg font-serif">Incoming Engagement</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" className="text-xs h-8 border-white/10 text-gray-400 h-8">
                  Filter: Newest
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 text-gold animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-20">
                <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 font-serif text-lg">No active inquiries at this time.</p>
                <p className="text-xs text-gray-600 mt-2 lowercase tracking-[0.2em]">Platform is monitoring incoming leads 24/7</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Prospect</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Target Deal</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Message Preview</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Date</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Status</TableHead>
                    <TableHead className="text-right text-gray-400 font-bold uppercase tracking-widest text-[10px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white">
                            {req.name?.charAt(0) || <User className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{req.name || "Confidential Prospect"}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Mail className="w-3 h-3 text-gray-600" />
                              <span className="text-[10px] text-gray-500">{req.email || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-xs text-gold font-bold">{req.dealTitle}</p>
                          <p className="text-[9px] text-gray-500 uppercase tracking-tighter">REF: {req.deal_id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-xs text-gray-400 line-clamp-2 italic">{req.message || "Requested manifest documentation and pricing details."}</p>
                      </TableCell>
                      <TableCell className="text-gray-500 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(req.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                          req.status === 'approved' ? 'bg-green-500/10 text-green-500' : 
                          req.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 
                          'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {req.status || 'new'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white" title="Mark as Reviewed" onClick={() => handleStatusUpdate(req.id, 'reviewed')}>
                              <CheckCircle className="w-4 h-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-400" title="Archive Lead" onClick={() => handleStatusUpdate(req.id, 'archived')}>
                              <XCircle className="w-4 h-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gold">
                              <ExternalLink className="w-4 h-4" />
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
    </BrokerLayout>
  );
}
