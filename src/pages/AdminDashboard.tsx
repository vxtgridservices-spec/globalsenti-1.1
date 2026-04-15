import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Users, Shield, DollarSign, AlertCircle, Loader2 } from "lucide-react";
import { Navbar } from "@/src/components/layout/Navbar";
import { Footer } from "@/src/components/layout/Footer";

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/portal");
        return;
      }

      try {
        const response = await fetch("/api/admin/dashboard-stats", {
          headers: {
            "Authorization": `Bearer ${session.access_token}`
          }
        });

        if (response.status === 403) {
          navigate("/dashboard"); // Redirect back if not admin
          return;
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [navigate]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-gold animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-4xl font-serif text-white mb-12">Admin Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { title: "Total Users", value: stats?.totalUsers, icon: Users, color: "text-blue-400" },
              { title: "Active Escrows", value: stats?.activeEscrows, icon: Shield, color: "text-gold" },
              { title: "Pending Approvals", value: stats?.pendingApprovals, icon: AlertCircle, color: "text-red-400" },
              { title: "Revenue", value: `$${stats?.revenue.toLocaleString()}`, icon: DollarSign, color: "text-green-400" },
            ].map((stat, i) => (
              <Card key={i} className="bg-secondary/20 border-white/5">
                <CardContent className="p-6 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-3xl font-serif text-white">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
