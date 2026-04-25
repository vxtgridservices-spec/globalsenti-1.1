import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';

declare global {
  interface Window {
    Tawk_API: any;
    Tawk_LoadStart: Date;
  }
}

export function TawktoLoader() {
  const tawkInitialized = useRef(false);
  const location = useLocation();

  // Track navigation changes
  useEffect(() => {
    if (window.Tawk_API && typeof window.Tawk_API.pageUpdate === 'function') {
      window.Tawk_API.pageUpdate({
        url: window.location.href,
        title: document.title
      });
      window.Tawk_API.addEvent('navigated', {
        url: window.location.href,
        title: document.title
      });
    }
  }, [location]);

  useEffect(() => {
    async function initTawkto() {
      // 1. Fetch settings
      const { data } = await supabase.from('security_settings').select('access_key, is_locked').eq('section_name', 'tawkto').single();
      if (!data || !data.is_locked || !data.access_key) return;

      const rawKey = data.access_key;
      const match = rawKey.match(/embed\.tawk\.to\/([a-zA-Z0-9]+)\//);
      const propertyId = match ? match[1] : rawKey.trim();

      // 2. Initialize Tawk.to
      window.Tawk_API = window.Tawk_API || {};
      window.Tawk_LoadStart = new Date();

      const s1 = document.createElement("script");
      s1.async = true;
      s1.src = `https://embed.tawk.to/${propertyId}/default`;
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin', '*');
      document.body.appendChild(s1);

      window.Tawk_API.onLoad = function() {
        tawkInitialized.current = true;
        // Hide by default for everyone
        window.Tawk_API.hideWidget();
      };
    }

    if (!tawkInitialized.current) {
        initTawkto();
    }
  }, []);

  // Sync User Identification
  useEffect(() => {
    async function updateUserInfo() {
        const { data: { user } } = await supabase.auth.getUser();
        if (window.Tawk_API && typeof window.Tawk_API.setAttributes === 'function' && user) {
            window.Tawk_API.setAttributes({
                email: user.email,
                name: user.user_metadata?.full_name || user.email
            }, () => {});
        }
    }
    updateUserInfo();
  }, []);
  
  return null;
}
