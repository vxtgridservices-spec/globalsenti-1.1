import * as React from "react";
import { BrokerLayout } from "@/src/components/broker/BrokerLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { 
  User, 
  Mail, 
  Building2, 
  ShieldCheck, 
  Save, 
  Loader2,
  Lock,
  Globe,
  Crown,
  Award,
  Gem
} from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { cn } from "@/src/lib/utils";

export function BrokerProfile() {
  const [profile, setProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    full_name: "",
    company_name: "",
    email: "",
    phone: ""
  });

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          company_name: data.company_name || "",
          email: data.email || "",
          phone: data.phone || ""
        });
      } catch (error) {
        console.error("Error fetching broker profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          company_name: formData.company_name,
          phone: formData.phone
        })
        .eq('id', user.id);
      
      if (error) throw error;
      alert("Profile updated successfully.");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <BrokerLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-gold animate-spin" />
        </div>
      </BrokerLayout>
    );
  }

  return (
    <BrokerLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-serif text-white mb-2">Broker Profile</h1>
          <p className="text-gray-400">Manage your identity and firm information on the Global Sentinel platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <Card className="bg-secondary/20 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white text-lg">General Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-400 text-xs uppercase tracking-widest font-bold">Full Professional Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input 
                          value={formData.full_name}
                          onChange={e => setFormData({...formData, full_name: e.target.value})}
                          className="pl-10 bg-white/5 border-white/10 text-white h-12"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400 text-xs uppercase tracking-widest font-bold">Primary Firm / Company</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input 
                          value={formData.company_name}
                          onChange={e => setFormData({...formData, company_name: e.target.value})}
                          className="pl-10 bg-white/5 border-white/10 text-white h-12"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400 text-xs uppercase tracking-widest font-bold">Professional Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input 
                          disabled
                          value={formData.email}
                          className="pl-10 bg-white/5 border-white/10 text-gray-500 h-12 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400 text-xs uppercase tracking-widest font-bold">Direct Secure Line</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input 
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                          placeholder="+1 (555) 000-0000"
                          className="pl-10 bg-white/5 border-white/10 text-white h-12"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button type="submit" className="bg-gold text-background font-bold h-12 px-8 gap-2" disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      SAVE PROFILE
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-secondary/20 border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Platform Credentials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-gold" />
                         </div>
                         <div>
                            <p className="text-white text-sm font-bold">Security Password</p>
                            <p className="text-xs text-gray-500">Last updated 4 months ago</p>
                         </div>
                      </div>
                      <Button variant="outline" className="text-xs border-white/10 text-white h-9">
                         Change Security Key
                      </Button>
                   </div>
                </CardContent>
              </Card>
            </form>
          </div>

          <div className="space-y-6">
            <Card className={cn(
               "border shadow-xl overflow-hidden",
               profile?.tier === 'elite' ? "bg-purple-500/5 border-purple-500/20" :
               profile?.tier === 'premium' ? "bg-amber-500/5 border-amber-500/20" :
               profile?.tier === 'verified' ? "bg-gold/5 border-gold/20" :
               "bg-white/5 border-white/10"
            )}>
              <div className={cn(
                "h-2",
                profile?.tier === 'elite' ? "bg-purple-500" :
                profile?.tier === 'premium' ? "bg-amber-500" :
                profile?.tier === 'verified' ? "bg-gold" :
                "bg-gray-500"
              )} />
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  {profile?.tier === 'elite' ? <Crown className="w-5 h-5 text-purple-400" /> :
                   profile?.tier === 'premium' ? <Gem className="w-5 h-5 text-amber-400" /> :
                   <ShieldCheck className="w-5 h-5 text-gold" />}
                  {profile?.tier?.toUpperCase() || 'BASIC'} STATUS
                </CardTitle>
                <CardDescription className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                   {profile?.tier === 'elite' ? "Unlimited Strategic Access" :
                    profile?.tier === 'premium' ? "High-Velocity Partner" :
                    profile?.tier === 'verified' ? "Verified Professional" :
                    "Awaiting Verification"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-4">
                   <div className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border shadow-[0_0_40px_rgba(212,175,55,0.1)]",
                      profile?.tier === 'elite' ? "bg-purple-500/10 border-purple-500/20" :
                      profile?.tier === 'premium' ? "bg-amber-500/10 border-amber-500/20" :
                      "bg-gold/10 border-gold/20"
                   )}>
                      {profile?.tier === 'elite' ? <Crown className="w-10 h-10 text-purple-400" /> :
                       profile?.tier === 'premium' ? <Gem className="w-10 h-10 text-amber-400" /> :
                       <ShieldCheck className="w-10 h-10 text-gold" />}
                   </div>
                   <h3 className={cn(
                     "text-2xl font-serif tracking-widest uppercase",
                     profile?.tier === 'elite' ? "text-purple-400" :
                     profile?.tier === 'premium' ? "text-amber-400" :
                     "text-white"
                   )}>
                     {profile?.tier || 'BASIC'}
                   </h3>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">
                      {profile?.tier === 'elite' ? "Top Tier Access" : "Sentinel Network Partner"}
                   </p>
                </div>
                
                <div className="space-y-3 pt-4 border-t border-white/5">
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-tighter">Deal Limit</span>
                      <span className="text-white font-bold">
                        {profile?.tier === 'elite' ? "Unlimited" :
                         profile?.tier === 'premium' ? "10 Active" :
                         profile?.tier === 'verified' ? "3 Active" :
                         "No Publishing"}
                      </span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-tighter">Priority Listing</span>
                      <span className={cn(
                        "font-bold",
                        profile?.tier === 'elite' || profile?.tier === 'premium' ? "text-green-500" : "text-gray-500"
                      )}>
                        {profile?.tier === 'elite' ? "Maximum" :
                         profile?.tier === 'premium' ? "High" :
                         "Standard"}
                      </span>
                   </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
               <p className="text-white text-sm font-bold mb-2">Need to update firm documents?</p>
               <p className="text-xs text-gray-500 mb-4 lowercase tracking-wider">Submit business registry or license updates for re-verification.</p>
               <Button variant="link" className="text-gold font-bold text-xs" onClick={() => window.location.href='/verify-broker'}>
                  BEGIN RE-VERIFICATION
               </Button>
            </div>
          </div>
        </div>
      </div>
    </BrokerLayout>
  );
}
