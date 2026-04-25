import * as React from "react";
import { AdminLayout } from "@/src/components/admin/AdminLayout";
import { ShieldCheck, Lock, Unlock, Key } from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/utils";

export function AdminSecurity() {
  const [settings, setSettings] = React.useState<any>({
    chemicals: { is_locked: false, access_key: "" },
    investments: { is_locked: false, access_key: "" },
    deals: { is_locked: false, access_key: "" },
  });

  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
        const { data } = await supabase.from('security_settings').select('*');
        if (data && data.length > 0) {
            const newSettings = { ...settings };
            data.forEach((s: any) => {
                newSettings[s.section_name] = s;
            });
            setSettings(newSettings);
        }
    } finally {
        setLoading(false);
    }
  };

  const updateSetting = (section: string, field: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const [saveStatus, setSaveStatus] = React.useState<{type: 'success' | 'error', message: string} | null>(null);

  const saveSettings = async () => {
    setSaveStatus(null);
    try {
        setLoading(true);
        const updates = Object.entries(settings).map(([section_name, config]: [string, any]) => ({
            section_name,
            is_locked: config.is_locked,
            access_key: config.access_key
        }));
        
        const { error } = await supabase.from('security_settings').upsert(updates, { onConflict: 'section_name' });
        
        if (error) throw error;
        setSaveStatus({ type: 'success', message: 'Security settings deployed successfully! All active sessions with old keys have been invalidated.' });
        
        // Clear status after 5 seconds
        setTimeout(() => setSaveStatus(null), 5000);
    } catch (err: any) {
        setSaveStatus({ type: 'error', message: 'Failed to deploy: ' + err.message });
    } finally {
        setLoading(false);
    }
  };

  const generateKey = (section: string) => {
    const key = Math.random().toString(36).substring(2, 10).toUpperCase();
    updateSetting(section, 'access_key', key);
  };

  return (
    <AdminLayout title="Security Management" icon={ShieldCheck}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(settings).map(([section, config]: [string, any]) => (
          <Card key={section} className="bg-secondary/10 border-white/5 relative">
            <CardHeader>
              <CardTitle className="capitalize flex items-center justify-between">
                <span>{section}</span>
                <Button 
                  size="sm"
                  variant={config.is_locked ? "default" : "outline"}
                  className={config.is_locked ? "bg-gold text-black hover:bg-gold/80" : ""}
                  onClick={() => updateSetting(section, 'is_locked', !config.is_locked)}
                >
                    {config.is_locked ? 'Lock Active' : 'Public'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase text-gray-500">Access Key</Label>
                <div className="flex gap-2">
                  <Input 
                    value={config.access_key} 
                    onChange={(e) => updateSetting(section, 'access_key', e.target.value.toUpperCase())}
                    className="font-mono bg-black/40 border-white/10" 
                  />
                  <Button variant="outline" onClick={() => generateKey(section)}>
                    <Key className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-[10px] font-mono text-white/40">
                {config.is_locked ? "⚠ Key required for visitors" : "✓ Publicly visible"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8 flex flex-col items-end gap-4">
        {saveStatus && (
          <div className={cn(
            "px-4 py-2 text-xs font-mono border",
            saveStatus.type === 'success' ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500"
          )}>
            {saveStatus.message}
          </div>
        )}
        <Button onClick={saveSettings} disabled={loading} className="px-12 bg-white text-black hover:bg-gold font-bold uppercase tracking-widest h-12">
          {loading ? 'Processing...' : 'Deploy Security Changes'}
        </Button>
      </div>
    </AdminLayout>
  );
}
