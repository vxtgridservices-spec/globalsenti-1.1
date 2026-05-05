import * as React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Shield, KeyRound, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const [verifying, setVerifying] = React.useState(true);

  React.useEffect(() => {
    const initAuth = async () => {
      // Give the auth listener a small window to initialize from URL fragment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if we are clearly in a recovery flow (token in hash/search)
      const isRecoveryFlow = window.location.hash.includes('type=recovery') || 
                             window.location.hash.includes('access_token') ||
                             window.location.search.includes('type=recovery');

      if (!session && !isRecoveryFlow) {
        toast.error("Access expired or invalid. Please initiate a new password recovery request.");
        navigate("/portal");
      } else {
        setVerifying(false);
      }
    };
    initAuth();

    // Listen for auth state changes specifically for recovery
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setVerifying(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Security mismatch: Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password complexity requirements not met (min 8 characters).");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);
      toast.success("Security credentials updated successfully.");
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate("/portal");
      }, 3000);
    } catch (error: any) {
      console.error("Reset error:", error);
      toast.error(error.message || "Failed to update security credentials.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-secondary/20 border-gold/20 text-center py-8">
          <CardContent className="space-y-6">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif text-white">Credentials Restored</h2>
              <p className="text-gray-400">Your account security has been verified and updated.</p>
            </div>
            <p className="text-sm text-gold animate-pulse">Redirecting to secure portal...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto" />
          <p className="text-gold font-black uppercase tracking-[0.2em] text-xs">Authenticating Recovery Protocol...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <Shield className="w-12 h-12 text-gold mx-auto mb-4" />
          <h1 className="text-3xl font-serif text-white tracking-tight">Access Recovery</h1>
          <p className="text-gray-500 text-sm uppercase tracking-widest font-black">Official Protocol v4.2</p>
        </div>

        <Card className="bg-secondary/20 border-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg font-serif">Update Credentials</CardTitle>
            <CardDescription className="text-gray-400">Enter your new security password below.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] text-gray-500 uppercase tracking-widest font-black">New Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="password"
                    required
                    className="bg-background/50 border-white/10 pl-10 h-12 focus:border-gold/50 transition-colors text-white"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Confirm Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="password"
                    required
                    className="bg-background/50 border-white/10 pl-10 h-12 focus:border-gold/50 transition-colors text-white"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gold hover:bg-gold-dark text-background font-black h-12 rounded-lg flex items-center justify-center gap-2 group shadow-[0_4px_20px_rgba(212,175,55,0.2)]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "UPDATE SECURITY CREDENTIALS"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 p-4 bg-gold/5 border border-gold/10 rounded-xl">
          <AlertCircle className="w-5 h-5 text-gold shrink-0" />
          <p className="text-[10px] text-gray-400 leading-relaxed uppercase tracking-tighter">
            Security Notice: Ensure your password contains at least 8 characters with a mix of letters, numbers, and symbols for maximum protocol compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
