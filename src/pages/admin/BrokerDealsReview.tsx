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
  Shield,
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ExternalLink,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
  ClipboardCheck
} from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { Deal } from "@/src/data/deals";
import { Link } from "react-router-dom";

export function BrokerDealsReview() {
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('status', 'Under Review')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error("Error fetching deals:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDeals();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('deals')
        .update({ status: 'Available' })
        .eq('id', id);
      
      if (error) throw error;
      setDeals(deals.filter(d => d.id !== id));
      toast.success("Deal approved and is now live!");
    } catch (error) {
      console.error("Error approving deal:", error);
      toast.error("Failed to approve deal.");
    }
  };

  const handleDecline = async (id: string) => {
    if (!confirm("Are you sure you want to decline this deal? it will be deleted.")) return;
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setDeals(deals.filter(d => d.id !== id));
      toast.success("Deal declined and removed.");
    } catch (error) {
      console.error("Error declining deal:", error);
      toast.error("Failed to decline deal.");
    }
  };

  return (
    <AdminLayout title="Broker Deal Reviews" icon={Shield}>
      <div className="space-y-8">
        <div>
          <p className="text-gray-400 -mt-6 mb-8">Review and approve broker-created commodity listings before they go live.</p>
        </div>

        <Card className="bg-secondary/20 border-white/5">
          <CardHeader className="border-b border-white/5">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input 
                  placeholder="Search pending deals..." 
                  className="pl-10 bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 text-gold animate-spin" />
              </div>
            ) : deals.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center gap-4">
                <ClipboardCheck className="w-12 h-12 text-gray-500" />
                <p className="text-gray-400">No broker deals pending review.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">ID</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Commodity</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Title</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Quantity</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Price</TableHead>
                    <TableHead className="text-right text-gray-400 font-bold uppercase tracking-widest text-[10px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.map((deal) => (
                    <TableRow key={deal.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell className="font-mono text-xs text-gold">{deal.id}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-wider">
                          {deal.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-white font-medium">{deal.title}</TableCell>
                      <TableCell className="text-gray-400 text-sm">{deal.quantity}</TableCell>
                      <TableCell className="text-white font-bold">{deal.price}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-green-500 hover:bg-green-500/10 gap-1 font-bold"
                            onClick={() => handleApprove(deal.id)}
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approve
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-400 hover:bg-red-400/10 gap-1 font-bold"
                            onClick={() => handleDecline(deal.id)}
                          >
                            <XCircle className="w-4 h-4" /> Decline
                          </Button>
                          <Link to={`/deal/${deal.id}`}>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gold">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </Link>
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
