import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Briefcase, 
  MessageSquare, 
  Users, 
  FileText, 
  LogOut,
  Shield,
  ShieldCheck,
  Menu,
  X,
  Loader2,
  TrendingUp,
  FlaskConical
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { supabase } from "@/src/lib/supabase";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  icon?: React.ElementType;
}

export function AdminLayout({ children, title, icon: Icon }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/portal");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      setIsLoading(false);
    };

    checkAdmin();
  }, [navigate]);

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { label: "Deals", icon: Briefcase, path: "/admin/deals" },
    { label: "Broker Reviews", icon: Shield, path: "/admin/broker-reviews" },
    { label: "Requests", icon: MessageSquare, path: "/admin/requests" },
    { label: "Verifications", icon: Shield, path: "/admin/verifications" },
    { label: "Users", icon: Users, path: "/admin/users" },
    { label: "Documents", icon: FileText, path: "/admin/documents" },
    { label: "Investments", icon: TrendingUp, path: "/admin/investments" },
    { label: "Chemicals", icon: FlaskConical, path: "/admin/chemicals" },
    { label: "Security", icon: ShieldCheck, path: "/admin/security" },
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

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-secondary/20 backdrop-blur-xl sticky top-0 h-screen">
        <div className="p-8">
          <Link to="/" className="flex items-center gap-2 group">
            <Shield className="w-8 h-8 text-gold group-hover:scale-110 transition-transform" />
            <span className="text-xl font-serif font-bold text-white tracking-tighter">SENTINEL <span className="text-gold">ADMIN</span></span>
          </Link>
        </div>

        <nav className="flex-grow px-4 space-y-2 overflow-y-auto custom-scrollbar">
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
          <span className="text-lg font-serif font-bold text-white">SENTINEL <span className="text-gold">ADMIN</span></span>
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
          {(title || Icon) && (
            <div className="flex items-center gap-4 mb-8">
              {Icon && (
                <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-gold" />
                </div>
              )}
              {title && (
                <div>
                  <h1 className="text-2xl md:text-3xl font-serif font-bold text-white">{title}</h1>
                  <p className="text-gray-400 text-sm">Administrative Control Panel</p>
                </div>
              )}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
