/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Services } from "./pages/Services";
import { Industries } from "./pages/Industries";
import { ClientPortal } from "./pages/ClientPortal";
import { Dashboard } from "./pages/Dashboard";
import { DealRoom } from "./pages/DealRoom";
import { Vault } from "./pages/Vault";
import { Intelligence } from "./pages/Intelligence";
import { Partnerships } from "./pages/Partnerships";
import { Contact } from "./pages/Contact";

export default function App() {
  return (
    <Router>
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
        <Route path="/deal-room" element={<DealRoom />} />
        <Route path="/vault" element={<Vault />} />
      </Routes>
    </Router>
  );
}
