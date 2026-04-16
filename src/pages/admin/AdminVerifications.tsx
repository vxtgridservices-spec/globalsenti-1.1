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
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  ExternalLink,
  Check,
  X,
  Loader2,
  Clock
} from "lucide-react";
import { supabase } from "@/src/lib/supabase";

export function AdminVerifications() {
  const [verifications, setVerifications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchVerifications = async () => {
    try {
      const { data, error } = await supabase
        .from('broker_verifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setVerifications(data || []);
    } catch (error) {
      console.error("Error fetching verifications:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchVerifications();
  }, []);

  const handleAction = async (id: string, userId: string, status: 'verified' | 'rejected') => {
    try {
      // 1. Update verification record
      const { error: verifError } = await supabase
        .from('broker_verifications')
        .update({ status })
        .eq('id', id);
      
      if (verifError) throw verifError;

      // 2. Update user profile
      const updateData: any = { 
        verification_status: status,
        tier: status === 'verified' ? 'verified' : 'basic'
      };
      if (status === 'verified') {
        updateData.role = 'broker';
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);
      
      if (profileError) throw profileError;

      setVerifications(verifications.map(v => v.id === id ? { ...v, status } : v));
    } catch (error) {
      console.error("Error updating verification:", error);
      alert("Action failed.");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-serif text-white mb-2">Broker Verifications</h1>
          <p className="text-gray-400">Review and verify professional broker applications.</p>
        </div>

        <Card className="bg-secondary/20 border-white/5">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 text-gold animate-spin" />
              </div>
            ) : verifications.length === 0 ? (
              <div className="text-center py-20">
                <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No pending verification requests</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Broker</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Company</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Registry #</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Documents</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Status</TableHead>
                    <TableHead className="text-right text-gray-400 font-bold uppercase tracking-widest text-[10px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifications.map((v) => (
                    <TableRow key={v.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell>
                        <div>
                          <p className="text-white font-medium">{v.full_name}</p>
                          <p className="text-xs text-gray-500">{v.country}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-white text-sm">{v.company_name}</TableCell>
                      <TableCell className="text-gray-400 font-mono text-xs">{v.registration_number}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <a href={v.document_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gold hover:bg-gold/10">
                              <FileText className="w-4 h-4" />
                            </Button>
                          </a>
                          <a href={v.id_document_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:bg-blue-400/10">
                              <ShieldCheck className="w-4 h-4" />
                            </Button>
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          v.status === 'verified' ? 'bg-green-500/20 text-green-500' : 
                          v.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {v.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {v.status === 'pending' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-green-500 hover:bg-green-500/10"
                                onClick={() => handleAction(v.id, v.user_id, 'verified')}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-400 hover:bg-red-400/10"
                                onClick={() => handleAction(v.id, v.user_id, 'rejected')}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon" className="text-gray-400">
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
    </AdminLayout>
  );
}
