import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Briefcase, 
  MessageSquare, 
  Plus,
  LogOut,
  Users,
  Shield,
  Menu,
  X,
  Loader2,
  Home
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { supabase } from "@/src/lib/supabase";

interface BrokerLayoutProps {
  children: React.ReactNode;
}

export function BrokerLayout({ children }: BrokerLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isVerifiedBroker, setIsVerifiedBroker] = React.useState(false);

  React.useEffect(() => {
    const checkBroker = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/portal");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, verification_status")
        .eq("id", user.id)
        .single();

      console.log("BrokerLayout Check:", { role: profile?.role, status: profile?.verification_status });

      const isAuthorized = profile?.role === "admin" || 
                           profile?.role === "broker" || 
                           profile?.verification_status === "verified";

      if (!isAuthorized) {
        navigate("/dashboard");
        return;
      }

      if (profile?.verification_status !== "verified" && profile?.role !== "admin") {
        navigate("/verify-broker");
        return;
      }

      setIsVerifiedBroker(true);
      setIsLoading(false);
    };

    checkBroker();
  }, [navigate]);

  const navItems = [
    { label: "Overview", icon: LayoutDashboard, path: "/broker" },
    { label: "My Deals", icon: Briefcase, path: "/broker/deals" },
    { label: "Add Deal", icon: Plus, path: "/broker/create-deal" },
    { label: "Requests", icon: MessageSquare, path: "/broker/requests" },
    { label: "Profile", icon: Users, path: "/broker/profile" },
    { label: "Client Mode", icon: Home, path: "/deal-room" },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/portal");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!isVerifiedBroker) return null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-secondary/20 backdrop-blur-xl sticky top-0 h-screen">
        <div className="p-8">
          <Link to="/" className="flex items-center gap-2 group">
            <Shield className="w-8 h-8 text-gold group-hover:scale-110 transition-transform" />
            <span className="text-xl font-serif font-bold text-white tracking-tighter">SENTINEL <span className="text-gold">BROKER</span></span>
          </Link>
        </div>

        <nav className="flex-grow px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                location.pathname === item.path 
                  ? "bg-gold text-background font-bold shadow-[0_0_20px_rgba(212,175,55,0.2)]" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-gray-400 hover:text-red-400 hover:bg-red-400/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5 p-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-gold" />
          <span className="text-lg font-serif font-bold text-white">SENTINEL <span className="text-gold">BROKER</span></span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background pt-20 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-4 rounded-xl text-lg font-medium",
                location.pathname === item.path 
                  ? "bg-gold text-background" 
                  : "text-gray-400"
              )}
            >
              <item.icon className="w-6 h-6" />
              {item.label}
            </Link>
          ))}
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-red-400 py-6"
            onClick={handleLogout}
          >
            <LogOut className="w-6 h-6" />
            Sign Out
          </Button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow pt-20 lg:pt-0">
        <div className="p-8 lg:p-12 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
