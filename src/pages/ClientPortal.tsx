import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Shield, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";

export function ClientPortal() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    companyName: "",
    serviceRequest: "",
  });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) {
        alert(error.message);
      } else {
        navigate("/dashboard");
      }
    } else {
      // For a platform like this, we might want to handle registration differently
      // (e.g., manual approval), but for now we'll use Supabase Auth
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            company_name: formData.companyName,
            service_request: formData.serviceRequest,
            role: 'client'
          }
        }
      });
      
      if (error) {
        alert(error.message);
      } else {
        alert("Access request submitted. Please check your email for verification.");
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

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
            <a href="#" className="text-muted-foreground text-xs hover:text-white transition-colors">Forgot security credentials?</a>
          </div>
        </form>
        
        <p className="text-center mt-8 text-muted-foreground text-xs uppercase tracking-[0.2em]">
          Global Sentinel Group Security Protocol v4.2
        </p>
      </div>
    </div>
  );
}
