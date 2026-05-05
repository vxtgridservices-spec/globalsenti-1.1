import * as React from "react";
import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { 
  Mail, 
  Send, 
  Users, 
  Loader2, 
  ShieldAlert,
  Info,
  CheckCircle2,
  Shield
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/src/lib/supabase";

export function AdminCommunications() {
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [broadcastType, setBroadcastType] = React.useState<"all" | "targeted">("all");
  const [targetEmails, setTargetEmails] = React.useState("");
  const [stats, setStats] = React.useState({ totalUsers: 0 });

  React.useEffect(() => {
    const fetchStats = async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      setStats({ totalUsers: count || 0 });
    };
    fetchStats();
  }, []);

  const handleBroadcast = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required.");
      return;
    }

    if (broadcastType === 'targeted' && !targetEmails.trim()) {
      toast.error("Target emails are required for targeted broadcast.");
      return;
    }

    setIsSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication failed");

      const targetList = broadcastType === 'targeted' 
        ? targetEmails.split(',').map(e => e.trim()).filter(e => e.includes('@'))
        : null;

      const response = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          subject,
          message,
          targetUsers: targetList
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Broadcast failed");
      }

      toast.success(`Successfully dispatched to ${result.deliveredCount} recipients.`);
      setSubject("");
      setMessage("");
      setTargetEmails("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to dispatch communication.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AdminLayout title="Communication Center" icon={Mail}>
      <div className="space-y-8">
        <p className="text-gray-400 -mt-6 mb-8 text-sm">
          Dispatch secure administrative bulletins, updates, or direct intelligence to the Global Sentinel Group ecosystem using Resend.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-secondary/20 border-white/5">
              <CardHeader>
                <CardTitle className="text-white font-serif">Compose Bulletin</CardTitle>
                <CardDescription>Draft your message using professional GSG formatting.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Broadcast Type</label>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setBroadcastType('all')}
                      className={`flex-1 p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                        broadcastType === 'all' 
                        ? 'bg-gold/10 border-gold text-gold' 
                        : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10'
                      }`}
                    >
                      <Users className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-tighter">All Users ({stats.totalUsers})</span>
                    </button>
                    <button 
                      onClick={() => setBroadcastType('targeted')}
                      className={`flex-1 p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                        broadcastType === 'targeted' 
                        ? 'bg-blue-500/10 border-blue-500 text-blue-400' 
                        : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10'
                      }`}
                    >
                      <Mail className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-tighter">Targeted Recipients</span>
                    </button>
                  </div>
                </div>

                {broadcastType === 'targeted' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Recipient Emails</label>
                    <Input 
                      placeholder="email1@example.com, email2@example.com"
                      className="bg-background border-white/10 text-white"
                      value={targetEmails}
                      onChange={(e) => setTargetEmails(e.target.value)}
                    />
                    <p className="text-[9px] text-gray-500 italic">Separate multiple emails with commas.</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Security Bulletin Subject</label>
                  <Input 
                    placeholder="e.g. Protocol Update v2.1: Secure Logistics Enhancements"
                    className="bg-background border-white/10 text-white font-medium"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Intelligence Message</label>
                  <Textarea 
                    placeholder="Enter the transmission content here. Standard GSG templates will be applied automatically."
                    className="bg-background border-white/10 text-white min-h-[300px] leading-relaxed resize-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    className="w-full bg-gold hover:bg-gold-dark text-background font-black py-6 rounded-xl flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                    onClick={handleBroadcast}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        DISPATCHING SECURE BROADCAST...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        INITIATE GLOBAL BROADCAST
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-secondary/20 border-white/5 border-l-gold border-l-2">
              <CardHeader>
                <CardTitle className="text-gold flex items-center gap-2 text-sm">
                  <ShieldAlert className="w-4 h-4" /> Security Protocol
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Info className="w-4 h-4 text-gray-500 shrink-0 mt-1" />
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Broadcasts are sent via our encrypted mail servers. Once initiated, transmissions cannot be recalled.
                  </p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-1" />
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Professional GSG branding and security headers will be appended to all transmissions.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-secondary/20 border-white/5">
              <CardHeader>
                <CardTitle className="text-white text-sm">Live Preview (Concept)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black/60 rounded-xl p-6 border border-white/5 space-y-4 scale-95 origin-top">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <Shield className="w-6 h-6 text-gold" />
                    <span className="text-[8px] text-gray-500 font-black uppercase">GSG BULLETIN</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gold/20 w-3/4 rounded animate-pulse" />
                    <div className="h-3 bg-white/5 w-full rounded" />
                    <div className="h-3 bg-white/5 w-5/6 rounded" />
                  </div>
                </div>
                <p className="text-[10px] text-center text-gray-600 mt-4 italic">
                  Messages are rendered with GSG's high-regard administrative formatting.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
