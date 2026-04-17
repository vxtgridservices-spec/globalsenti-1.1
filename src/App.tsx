/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Services } from "./pages/Services";
import { Industries } from "./pages/Industries";
import { ClientPortal } from "./pages/ClientPortal";
import { Dashboard } from "./pages/Dashboard";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminDeals } from "./pages/admin/AdminDeals";
import { BrokerDealsReview } from "./pages/admin/BrokerDealsReview";
import { AdminRequests } from "./pages/admin/AdminRequests";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminDocuments } from "./pages/admin/AdminDocuments";
import { AdminVerifications } from "./pages/admin/AdminVerifications";
import { BrokerDashboard } from "./pages/broker/BrokerDashboard";
import { BrokerDeals } from "./pages/broker/BrokerDeals";
import { BrokerCreateDeal } from "./pages/broker/BrokerCreateDeal";
import { BrokerRequests } from "./pages/broker/BrokerRequests";
import { BrokerProfile } from "./pages/broker/BrokerProfile";
import { DealRoom } from "./pages/DealRoom";
import { VerifyBroker } from "./pages/VerifyBroker";
import { DealManifest } from "./pages/DealManifest";
import { Vault } from "./pages/Vault";
import { Intelligence } from "./pages/Intelligence";
import { Partnerships } from "./pages/Partnerships";
import { Contact } from "./pages/Contact";
import { supabase } from "./lib/supabase";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AuthListener() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth Event:", event);
      
      if (event === 'SIGNED_OUT') {
        // Sign out clear local storage automatically
        console.log("User signed out");
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log("Token Refreshed Successfully");
      }

      // Handle session expiration or invalidity
      if (event === 'USER_UPDATED' && !session) {
        navigate('/portal');
      }
    });

    // Check session on mount to catch "Refresh Token Not Found" early
    const checkSession = async () => {
      const { error } = await supabase.auth.getSession();
      if (error && error.message.includes("Refresh Token Not Found")) {
        console.error("Critical Auth Error:", error.message);
        await supabase.auth.signOut();
        // Redirect to login if on a protected route
        if (location.pathname !== '/' && location.pathname !== '/portal') {
          navigate('/portal');
        }
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return null;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthListener />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/industries" element={<Industries />} />
        <Route path="/intelligence" element={<Intelligence />} />
        <Route path="/partnerships" element={<Partnerships />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/portal" element={<ClientPortal />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/deals" element={<AdminDeals />} />
        <Route path="/admin/broker-reviews" element={<BrokerDealsReview />} />
        <Route path="/admin/requests" element={<AdminRequests />} />
        <Route path="/admin/verifications" element={<AdminVerifications />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/documents" element={<AdminDocuments />} />
        <Route path="/broker" element={<BrokerDashboard />} />
        <Route path="/broker/deals" element={<BrokerDeals />} />
        <Route path="/broker/create-deal" element={<BrokerCreateDeal />} />
        <Route path="/broker/requests" element={<BrokerRequests />} />
        <Route path="/broker/profile" element={<BrokerProfile />} />
        <Route path="/deal-room" element={<DealRoom />} />
        <Route path="/verify-broker" element={<VerifyBroker />} />
        <Route path="/deal/:id" element={<DealManifest />} />
        <Route path="/vault" element={<Vault />} />
      </Routes>
    </Router>
  );
}
