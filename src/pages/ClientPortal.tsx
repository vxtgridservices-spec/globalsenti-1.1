import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Shield, Lock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export function ClientPortal() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-gold)_0%,_transparent_70%)]" />
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 space-y-4">
          <Link to="/" className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(212,175,55,0.3)]">
            <Shield className="text-background w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-white">Secure Client Portal</h1>
          <p className="text-muted-foreground">Authorized access only. All sessions are monitored.</p>
        </div>

        <div className="bg-secondary/30 border border-white/10 p-8 rounded-3xl backdrop-blur-xl space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white font-bold uppercase tracking-widest text-xs">Client ID / Email</Label>
            <Input id="email" type="email" placeholder="client@globalsentinel.com" className="bg-background/50 border-white/10 text-white h-12" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pass" className="text-white font-bold uppercase tracking-widest text-xs">Security Key</Label>
            <Input id="pass" type="password" placeholder="••••••••••••" className="bg-background/50 border-white/10 text-white h-12" />
          </div>
          <Button nativeButton={false} className="w-full bg-gold hover:bg-gold-dark text-background font-bold h-14 text-lg gap-2" render={<Link to="/dashboard" />}>
            <Lock className="w-5 h-5" />
            AUTHENTICATE
          </Button>
          <div className="text-center">
            <a href="#" className="text-gold text-sm hover:underline">Forgot security credentials?</a>
          </div>
        </div>
        
        <p className="text-center mt-8 text-muted-foreground text-xs uppercase tracking-[0.2em]">
          Global Sentinel Group Security Protocol v4.2
        </p>
      </div>
    </div>
  );
}
