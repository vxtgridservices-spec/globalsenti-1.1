import * as React from "react";
import { PageLayout } from "@/src/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { supabase } from "@/src/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Loader2, Upload, CheckCircle, AlertCircle, Shield } from "lucide-react";

export function VerifyBroker() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [formData, setFormData] = React.useState({
    fullName: "",
    companyName: "",
    country: "",
    registrationNumber: "",
  });
  const [files, setFiles] = React.useState<{ business: File | null; id: File | null }>({
    business: null,
    id: null,
  });

  React.useEffect(() => {
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/portal");
        return;
      }
      setUser(user);

      // Check if already verified or pending
      const { data: profile } = await supabase
        .from("profiles")
        .select("verification_status, full_name")
        .eq("id", user.id)
        .single();

      if (profile?.verification_status === "verified" || profile?.verification_status === "pending") {
        setIsSubmitted(true);
      }

      if (profile?.full_name) {
        setFormData(prev => ({ ...prev, fullName: profile.full_name || "" }));
      }
    };
    getSession();
  }, [navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'business' | 'id') => {
    if (e.target.files?.[0]) {
      setFiles(prev => ({ ...prev, [type]: e.target.files![0] }));
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${user.id}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('verifications')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('verifications')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.business || !files.id) {
      alert("Please upload both required documents.");
      return;
    }

    setLoading(true);
    try {
      // 1. Upload documents
      const businessDocUrl = await uploadFile(files.business, 'business_regs');
      const idDocUrl = await uploadFile(files.id, 'id_docs');

      // 2. Insert verification record
      const { error: verifError } = await supabase.from('broker_verifications').insert([
        {
          user_id: user.id,
          full_name: formData.fullName,
          company_name: formData.companyName,
          country: formData.country,
          registration_number: formData.registrationNumber,
          document_url: businessDocUrl,
          id_document_url: idDocUrl,
          status: "pending"
        }
      ]);

      if (verifError) throw verifError;

      // 3. Update user status in profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          verification_status: "pending",
          full_name: formData.fullName
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setIsSubmitted(true);
    } catch (error: any) {
      console.error("Verification error:", error);
      alert("Submission failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <PageLayout title="Broker Verification" subtitle="Your verification is being processed.">
        <div className="container mx-auto px-4 py-20 max-w-2xl">
          <Card className="bg-secondary/20 border-white/5 text-center p-12">
            <CheckCircle className="w-20 h-20 text-gold mx-auto mb-6" />
            <h2 className="text-3xl font-serif text-white mb-4">Application Submitted</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              We have received your broker verification request. Our compliance team will review your 
              documents and credentials. This process typically takes 24-48 business hours.
            </p>
            <div className="flex flex-col gap-4">
              <Button onClick={() => navigate("/deal-room")} className="bg-gold text-background font-bold">
                Return to Deal Room
              </Button>
              <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-gray-400">
                Go to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Broker Verification" subtitle="Become a verified broker to list and manage high-value commodity deals.">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8 p-6 bg-gold/5 border border-gold/10 rounded-2xl flex items-start gap-4">
          <Shield className="w-6 h-6 text-gold shrink-0 mt-1" />
          <div>
            <p className="text-sm text-gold font-bold mb-1">Trusted Platform Verification</p>
            <p className="text-xs text-gray-400">
              To maintain the integrity of our Deal Room, all brokers must undergo identity and business verification. 
              Only verified entities can publish and market commodities on the platform.
            </p>
          </div>
        </div>

        <Card className="bg-secondary/20 border-white/5">
          <CardHeader>
            <CardTitle className="text-2xl font-serif text-white">Verification Form</CardTitle>
            <CardDescription className="text-gray-500">Please provide accurate legal information for compliance review.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-400">Legal Full Name</Label>
                  <Input 
                    required
                    className="bg-white/5 border-white/10 text-white" 
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400">Company Name</Label>
                  <Input 
                    required
                    className="bg-white/5 border-white/10 text-white" 
                    value={formData.companyName}
                    onChange={e => setFormData({...formData, companyName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400">Country of Operation</Label>
                  <Input 
                    required
                    className="bg-white/5 border-white/10 text-white" 
                    value={formData.country}
                    onChange={e => setFormData({...formData, country: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400">Business Registration #</Label>
                  <Input 
                    required
                    className="bg-white/5 border-white/10 text-white" 
                    value={formData.registrationNumber}
                    onChange={e => setFormData({...formData, registrationNumber: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <div className="p-6 rounded-xl border border-white/10 bg-white/5">
                  <div className="flex items-center gap-4 mb-4">
                    <Upload className="w-5 h-5 text-gold" />
                    <div>
                      <p className="text-sm text-white font-bold">Business Registration Document</p>
                      <p className="text-[10px] text-gray-500 uppercase">Valid certificate of incorporation (PDF/JPG)</p>
                    </div>
                  </div>
                  <Input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                    onChange={e => handleFileChange(e, 'business')}
                    className="bg-transparent border-white/10 text-gray-400 text-xs"
                  />
                </div>

                <div className="p-6 rounded-xl border border-white/10 bg-white/5">
                  <div className="flex items-center gap-4 mb-4">
                    <Upload className="w-5 h-5 text-gold" />
                    <div>
                      <p className="text-sm text-white font-bold">Identity Document</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Passport or National ID of Lead Broker (PDF/JPG)</p>
                    </div>
                  </div>
                  <Input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                    onChange={e => handleFileChange(e, 'id')}
                    className="bg-transparent border-white/10 text-gray-400 text-xs"
                  />
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-14 bg-gold text-background font-bold text-lg hover:scale-[1.02] transition-transform"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Submit for Verification"}
                </Button>
                <p className="text-center text-[10px] text-gray-500 mt-4 px-8 uppercase tracking-widest">
                  By submitting, you agree to our terms of service and compliance protocols.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
