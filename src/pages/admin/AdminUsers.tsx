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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/src/components/ui/select";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  ShieldCheck,
  MoreVertical,
  Mail,
  Calendar,
  Gem,
  Award,
  Crown
} from "lucide-react";

import { supabase } from "@/src/lib/supabase";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AdminUsers() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      
      // Sort manually to handle cases where created_at might be missing from schema cache
      const sortedData = data ? [...data].sort((a, b) => {
        if (a.created_at && b.created_at) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return 0;
      }) : [];

      setUsers(sortedData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const handleTierUpdate = async (id: string, newTier: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ tier: newTier })
        .eq('id', id);
      
      if (error) throw error;
      setUsers(users.map(u => u.id === id ? { ...u, tier: newTier } : u));
    } catch (error: any) {
      console.error("Error updating user tier:", error);
      toast.error("Failed to update tier: " + error.message);
    }
  };

  const handleRoleUpdate = async (id: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', id);
      
      if (error) throw error;
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
      toast.success(`Role updated to ${newRole}`);
    } catch (error: any) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update role: " + error.message);
    }
  };

  return (
    <AdminLayout title="User Management" icon={Users}>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-400 -mt-6 mb-8">Manage platform access, roles, and identity verification status.</p>
          </div>
          <Button className="bg-gold text-background font-bold gap-2">
            <Users className="w-5 h-5" /> Invite User
          </Button>
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
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">User</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Role</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Tier</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Status</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Joined</TableHead>
                    <TableHead className="text-right text-gray-400 font-bold uppercase tracking-widest text-[10px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gold font-bold">
                            {user.full_name?.charAt(0) || user.email?.charAt(0) || "?"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium">{user.full_name || "Anonymous"}</p>
                              {user.verification_status === 'verified' && (
                                <ShieldCheck className="w-3 h-3 text-gold" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 flex items-center gap-1 leading-none">
                              <Mail className="w-3 h-3 text-gray-600" /> {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role || 'client'}
                          onValueChange={(val) => handleRoleUpdate(user.id, val)}
                        >
                          <SelectTrigger className="w-[120px] bg-white/5 border-white/10 text-white h-8 text-xs capitalize">
                            <Shield className={`w-3 h-3 mr-2 ${user.role === 'admin' ? 'text-red-400' : user.role === 'broker' ? 'text-gold' : 'text-blue-400'}`} />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-secondary border-white/10 text-white">
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="broker">Broker</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.tier || 'basic'}
                          onValueChange={(val) => handleTierUpdate(user.id, val)}
                        >
                          <SelectTrigger className="w-[120px] bg-white/5 border-white/10 text-white h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-secondary border-white/10 text-white">
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="verified">Verified</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="elite">Elite</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          user.verification_status === 'verified' ? 'bg-green-500/20 text-green-500' : 
                          user.verification_status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 
                          'bg-white/5 text-gray-500'
                        }`}>
                          {user.verification_status || 'unverified'}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-500 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-gray-400 hover:text-green-500"
                            onClick={() => handleStatusUpdate(user.id, 'approved')}
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-gray-400 hover:text-red-400"
                            onClick={() => handleStatusUpdate(user.id, 'rejected')}
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                            <MoreVertical className="w-4 h-4" />
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
