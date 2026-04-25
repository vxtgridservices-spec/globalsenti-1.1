import * as React from "react";
import { supabase } from "@/src/lib/supabase";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";

export function AccessGuard({ section, children }: { section: string, children: React.ReactNode }) {
  const [isLocked, setIsLocked] = React.useState(true); // Default to locked for safety
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [accessKey, setAccessKey] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    checkSecurity();
  }, [section]);

  const checkSecurity = async () => {
    const { data, error } = await supabase.from('security_settings')
      .select('*')
      .eq('section_name', section)
      .single();
    
    // Check local storage for the key we used to unlock this previously
    const storedKey = localStorage.getItem(`auth_key_${section}`);
    
    if (data) {
      if (data.is_locked) {
        // Only authenticate if we have a stored key AND it matches the current DB key
        if (storedKey && storedKey === data.access_key) {
          setIsAuthenticated(true);
          setIsLocked(false);
        } else {
          setIsLocked(true);
          setIsAuthenticated(false);
          // If the key is wrong/expired, clean up the local storage
          localStorage.removeItem(`auth_key_${section}`);
        }
      } else {
        setIsAuthenticated(true);
        setIsLocked(false);
      }
    } else {
      setIsLocked(false); // If no security found, default to open until admin sets it
      setIsAuthenticated(true);
    }
    setLoading(false);
  };

  const handleUnlock = async () => {
    const trimmedKey = accessKey.trim().toUpperCase();
    if (!trimmedKey) return;

    setLoading(true);
    const { data } = await supabase.from('security_settings')
      .select('access_key, is_locked')
      .eq('section_name', section)
      .single();
    
    if (data && data.access_key === trimmedKey) {
      setIsAuthenticated(true);
      setIsLocked(false);
      localStorage.setItem(`auth_key_${section}`, trimmedKey);
    } else {
      alert("Invalid Access Key. Please check for errors or contact the administrator.");
    }
    setLoading(false);
  };

  if (loading) return <div>Checking security...</div>;
  if (!isLocked || isAuthenticated) return <>{children}</>;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="space-y-4 p-8 border border-white/10 bg-white/5 rounded-lg max-w-sm">
        <h2 className="text-xl font-serif">Restricted Area</h2>
        <p className="text-sm text-gray-400 uppercase tracking-widest text-[10px]">Enter access key to access {section}</p>
        <Input type="password" onChange={(e) => setAccessKey(e.target.value)} />
        <Button onClick={handleUnlock}>Unlock Access</Button>
      </div>
    </div>
  );
}
