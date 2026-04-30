import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Shield, Lock, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { sendTransactionalEmail } from "@/src/services/emailService";

export function ClientPortal() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    companyName: "",
    serviceRequest: "",
  });
  const navigate = useNavigate();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error("Please enter your client ID / email first.");
      return;
    }
    setLoading(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('email', formData.email).single();
      
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/portal?reset=true`,
      });
      
      if (error) throw error;

      // Trigger Password Reset Email
      await sendTransactionalEmail('password-reset', formData.email, {
        userName: profile?.full_name || 'Valued Client',
        resetLink: `${window.location.origin}/portal?reset=true`,
        timestamp: new Date().toLocaleString(),
      });

      setResetSent(true);
      toast.success("Security reset protocol initiated. Check your email.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) {
        toast.error(error.message);
      } else {
        // Fetch user profile to determine correct redirect
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, verification_status")
            .eq("id", user.id)
            .single();

          console.log("Login User Data:", { role: profile?.role, status: profile?.verification_status });

          if (profile?.role === "admin") {
            navigate("/admin");
          } else if (profile?.role === "broker" || profile?.verification_status === "verified") {
            if (profile?.verification_status === "verified") {
              navigate("/broker");
            } else {
              navigate("/verify-broker");
            }
          } else {
            navigate("/dashboard");
          }
        }
      }
    } else {
      // Use the professional registration protocol (backend via Resend)
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName,
            companyName: formData.companyName,
            serviceRequest: formData.serviceRequest
          }),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
           throw new Error(result.error || "Authentication protocol failed.");
        }
        
        toast.success("Security credentials created. Professional verification dispatched.");
        setIsLogin(true);
      } catch (error: any) {
        toast.error(error.message);
      }
    }
    setLoading(false);
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-gold)_0%,_transparent_70%)]" />
        </div>
        
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8 space-y-4">
            <button onClick={() => setIsForgotPassword(false)} className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Portal
            </button>
            <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(212,175,55,0.3)]">
              <Lock className="text-background w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-white">Reset Credentials</h1>
            <p className="text-muted-foreground">Request a secure password reset link.</p>
          </div>

          <form onSubmit={handleForgotPassword} className="bg-secondary/30 border border-white/10 p-8 rounded-3xl backdrop-blur-xl space-y-6">
            {resetSent ? (
              <div className="text-center space-y-4 py-8">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                <h3 className="text-xl font-bold text-white">Protocol Initiated</h3>
                <p className="text-gray-400 text-sm">A secure reset link has been dispatched to {formData.email}. Please verify your inbox.</p>
                <Button onClick={() => setIsForgotPassword(false)} className="w-full bg-gold text-black mt-4">Return to Login</Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="resetEmail" className="text-white font-bold uppercase tracking-widest text-xs">Client ID / Email</Label>
                  <Input 
                    id="resetEmail" 
                    type="email" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="bg-background/50 border-white/10 text-white h-12" 
                  />
                </div>
                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold hover:bg-gold-dark text-background font-bold h-14 text-lg gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                  SEND RESET LINK
                </Button>
              </>
            )}
          </form>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-white">
            {isLogin ? "Secure Client Portal" : "Request Secure Access"}
          </h1>
          <p className="text-muted-foreground">
            {isLogin 
              ? "Authorized access only. All sessions are monitored." 
              : "Submit your credentials for administrative review."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-secondary/30 border border-white/10 p-8 rounded-3xl backdrop-blur-xl space-y-6">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white font-bold uppercase tracking-widest text-xs">Full Name</Label>
                <Input 
                  id="fullName" 
                  required 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="bg-background/50 border-white/10 text-white h-12" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-white font-bold uppercase tracking-widest text-xs">Company Name</Label>
                <Input 
                  id="company" 
                  required 
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="bg-background/50 border-white/10 text-white h-12" 
                />
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white font-bold uppercase tracking-widest text-xs">Client ID / Email</Label>
            <Input 
              id="email" 
              type="email" 
              required
              placeholder="client@globalsentinel.com" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="bg-background/50 border-white/10 text-white h-12" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pass" className="text-white font-bold uppercase tracking-widest text-xs">Security Key</Label>
            <Input 
              id="pass" 
              type="password" 
              required
              placeholder="••••••••••••" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="bg-background/50 border-white/10 text-white h-12" 
            />
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="service" className="text-white font-bold uppercase tracking-widest text-xs">Reason for Request</Label>
              <select 
                id="service"
                required
                className="flex h-12 w-full rounded-md border border-white/10 bg-background/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                value={formData.serviceRequest} 
                onChange={(e) => setFormData({...formData, serviceRequest: e.target.value})}
              >
                <option value="" className="bg-background text-white">Select a service</option>
                <option value="security-operation" className="bg-background text-white">Security Operation</option>
                <option value="secure-logistic" className="bg-background text-white">Secure Logistic</option>
                <option value="commodity-trade" className="bg-background text-white">Commodity Trade</option>
                <option value="strategic-partnership" className="bg-background text-white">Strategic Partnership</option>
              </select>
            </div>
          )}

          <Button 
            type="submit"
            disabled={loading}
            className="w-full bg-gold hover:bg-gold-dark text-background font-bold h-14 text-lg gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
            {isLogin ? "AUTHENTICATE" : "SUBMIT REQUEST"}
          </Button>

          <div className="text-center space-y-4">
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-gold text-sm hover:underline block w-full"
            >
              {isLogin ? "Request security credentials?" : "Return to authentication"}
            </button>
            <button 
              type="button"
              onClick={() => setIsForgotPassword(true)}
              className="text-muted-foreground text-xs hover:text-white transition-colors block w-full"
            >
              Forgot security credentials?
            </button>
          </div>
        </form>
        
        <p className="text-center mt-8 text-muted-foreground text-xs uppercase tracking-[0.2em]">
          Global Sentinel Group Security Protocol v4.2
        </p>
      </div>
    </div>
  );
}
