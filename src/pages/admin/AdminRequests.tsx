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
  ShieldCheck
} from "lucide-react";

import { supabase } from "@/src/lib/supabase";
import { Loader2 } from "lucide-react";

export function AdminRequests() {
  const [requests, setRequests] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRequests();
  }, []);

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
      const { error } = await supabase
        .from('requests')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-serif text-white mb-2">Request Management</h1>
          <p className="text-gray-400">Review purchase requests and broker inquiries from the platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-secondary/20 border-white/5">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest">Purchase Requests</p>
                <p className="text-2xl font-serif text-white">
                  {requests.filter(r => r.type === 'purchase').length}
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
                <p className="text-xs text-gray-500 uppercase tracking-widest">Broker Inquiries</p>
                <p className="text-2xl font-serif text-white">
                  {requests.filter(r => r.type === 'broker').length}
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
                <p className="text-xs text-gray-500 uppercase tracking-widest">Pending</p>
                <p className="text-2xl font-serif text-white">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
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
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Type</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Requester</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Deal ID</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Status</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Submitted</TableHead>
                    <TableHead className="text-right text-gray-400 font-bold uppercase tracking-widest text-[10px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
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
                      <TableCell className="font-mono text-xs text-gold">{req.deal_id}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 
                          req.status === 'responded' ? 'bg-green-500/20 text-green-500' :
                          'bg-blue-500/20 text-blue-500'
                        }`}>
                          {req.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-500 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(req.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-gray-400 hover:text-green-500"
                            onClick={() => handleStatusUpdate(req.id, 'responded')}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-gray-400 hover:text-red-400"
                            onClick={() => handleDelete(req.id)}
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
    </AdminLayout>
  );
}
