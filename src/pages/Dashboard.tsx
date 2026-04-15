import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { 
  FileText, 
  Package, 
  Shield, 
  Bell, 
  ArrowUpRight, 
  MessageSquare, 
  Clock,
  Lock,
  ChevronRight
} from "lucide-react";
import { motion } from "motion/react";
import { Navbar } from "@/src/components/layout/Navbar";
import { Footer } from "@/src/components/layout/Footer";

export function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/portal");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
        navigate("/portal");
        return;
      }

      setProfile(profile);
      setLoading(false);

      // If user is admin, redirect to admin dashboard (placeholder logic)
      if (profile.role === 'admin') {
        console.log("Admin detected, redirecting to admin dashboard...");
        navigate("/admin-dashboard"); // Uncommented
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/portal");
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const stats = [
    { title: "Active Contracts", value: "12", icon: FileText, color: "text-blue-400" },
    { title: "Pending Shipments", value: "4", icon: Package, color: "text-gold" },
    { title: "Security Alerts", value: "0", icon: Shield, color: "text-green-400" },
    { title: "Notifications", value: "3", icon: Bell, color: "text-gold" },
  ];

  const operations = [
    { id: 1, name: "Operation Sentinel 1", type: "Logistics • Maritime Security", location: "Gulf of Aden", status: "IN PROGRESS", time: "15m ago" },
    { id: 2, name: "Operation Sentinel 2", type: "Logistics • Maritime Security", location: "Gulf of Aden", status: "IN PROGRESS", time: "15m ago" },
    { id: 3, name: "Operation Sentinel 3", type: "Logistics • Maritime Security", location: "Gulf of Aden", status: "IN PROGRESS", time: "15m ago" },
  ];

  const activities = [
    { title: "Shipment GS-9921 Arrived", time: "2 hours ago", status: "COMPLETED", statusColor: "text-green-500" },
    { title: "New Compliance Document Uploaded", time: "5 hours ago", status: "ACTION REQUIRED", statusColor: "text-gold" },
    { title: "Contract Renewal: Sector 7", time: "1 day ago", status: "PENDING", statusColor: "text-blue-500" },
    { title: "Security Briefing: West Africa", time: "2 days ago", status: "READ", statusColor: "text-gray-500" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-end mb-12">
            <h1 className="text-5xl md:text-7xl font-serif text-white">Client Dashboard</h1>
            <Button onClick={handleSignOut} variant="outline" className="border-white/10 text-white hover:bg-white/5">
              Sign Out
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-secondary/20 border-white/5 hover:border-white/10 transition-colors">
                  <CardContent className="p-6 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                      <p className="text-4xl font-serif text-white">{stat.value}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Active Operations</h2>
                  <p className="text-muted-foreground text-sm">Real-time status of your global security and logistics projects.</p>
                </div>
                <div className="space-y-4">
                  {operations.map((op) => (
                    <Card key={op.id} className="bg-secondary/20 border-white/5 hover:border-white/10 transition-colors">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded bg-gold/10 flex items-center justify-center shrink-0">
                          <Package className="text-gold w-6 h-6" />
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                            <h3 className="text-white font-bold">{op.name}</h3>
                            <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded">
                              {op.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{op.type}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-gray-500">• {op.location}</span>
                            <span className="text-[10px] text-gray-500">Updated {op.time}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Link to="/services" className="inline-flex items-center text-gold text-sm font-bold hover:underline mt-2">
                    View All Operations <ArrowUpRight className="ml-1 w-4 h-4" />
                  </Link>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gold" /> Quick Actions
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "New Request", path: "/contact" },
                    { name: "Document Vault", path: "/vault" },
                    { name: "Contact Agent", path: "/contact" },
                    { name: "Billing", path: "#" }
                  ].map((action) => (
                    <Button 
                      key={action.name} 
                      variant="outline" 
                      className="h-16 border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold"
                      onClick={() => action.path !== "#" && navigate(action.path)}
                    >
                      {action.name}
                    </Button>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-bold text-white mb-6">Account Manager</h2>
                <Card className="bg-secondary/20 border-white/5">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10">
                        <img src="https://picsum.photos/seed/vance/100/100" alt="Alexander Vance" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold">Alexander Vance</h3>
                        <p className="text-xs text-muted-foreground">Senior Strategic Advisor</p>
                      </div>
                    </div>
                    <Button className="w-full bg-gold text-background font-bold gap-2">
                      <MessageSquare className="w-4 h-4" /> Secure Message
                    </Button>
                  </CardContent>
                </Card>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gold" /> Recent Activity
                </h2>
                <div className="space-y-6">
                  {activities.map((activity, i) => (
                    <div key={i} className="flex gap-4 relative">
                      {i !== activities.length - 1 && (
                        <div className="absolute left-[7px] top-4 bottom-[-24px] w-[2px] bg-white/5" />
                      )}
                      <div className="w-4 h-4 rounded-full bg-gold shrink-0 mt-1" />
                      <div>
                        <h4 className="text-sm text-white font-medium">{activity.title}</h4>
                        <p className="text-[10px] text-muted-foreground mb-1">{activity.time}</p>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${activity.statusColor}`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <Card className="bg-gold border-none overflow-hidden relative group">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2)_0%,_transparent_70%)]" />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Lock className="w-5 h-5 text-background" />
                      <h3 className="text-background font-bold uppercase tracking-widest text-sm">Private Deal Room</h3>
                    </div>
                    <p className="text-background/80 text-sm mb-6 font-medium">
                      Exclusive access to high-value commodity listings. You have 3 new listings matching your profile in the precious metals sector.
                    </p>
                    <Button 
                      className="w-full bg-background text-white hover:bg-background/90 font-bold" 
                      onClick={() => navigate("/deal-room")}
                    >
                      Enter Deal Room
                    </Button>
                  </CardContent>
                </Card>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
