import { Shield, Linkedin, Twitter, Youtube, Mail, Phone, MapPin, Clock, Instagram, Facebook } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-background border-t border-white/5 pt-24 pb-12 w-full">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          <div className="space-y-6 lg:col-span-1">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                <Shield className="text-background w-7 h-7" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-serif font-bold text-xl leading-none tracking-tight group-hover:text-gold transition-colors">
                  GLOBAL SENTINEL
                </span>
                <span className="text-gold text-[11px] font-bold tracking-[0.3em] leading-none mt-1.5 opacity-80">
                  GROUP
                </span>
              </div>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Delivering security, resources, and logistics solutions with 
              integrity, precision, and global expertise.
            </p>
            <div className="flex gap-3">
              {[Linkedin, Twitter, Youtube, Instagram, Facebook].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-white hover:bg-gold hover:text-background transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-[0.2em] text-[10px] mb-8">QUICK LINKS</h4>
            <ul className="space-y-4">
              {[
                { name: "Home", href: "/" },
                { name: "About Us", href: "/about" },
                { name: "Our Services", href: "/services" },
                { name: "Industries", href: "/industries" },
                { name: "Partnerships", href: "/partnerships" },
                { name: "Contact Us", href: "/contact" }
              ].map((item) => (
                <li key={item.name}>
                  <Link to={item.href} className="text-muted-foreground hover:text-gold text-xs transition-colors">{item.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-[0.2em] text-[10px] mb-8">SERVICES</h4>
            <ul className="space-y-4">
              {[
                "Security Operations",
                "Secure Logistics",
                "Commodity Trade",
                "Risk & Intelligence",
                "Industrial Supply",
                "Global Partnerships"
              ].map((item) => (
                <li key={item}>
                  <Link to="/services" className="text-muted-foreground hover:text-gold text-xs transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-[0.2em] text-[10px] mb-8">COMMODITIES</h4>
            <ul className="space-y-4">
              {[
                "Gold",
                "Diamonds",
                "Crude Oil",
                "Natural Gas",
                "Industrial Minerals",
                "Precious Stones"
              ].map((item) => (
                <li key={item}>
                  <Link to="/industries" className="text-muted-foreground hover:text-gold text-xs transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-[0.2em] text-[10px] mb-8">CONTACT INFORMATION</h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <Mail className="text-gold w-4 h-4 shrink-0" />
                <span className="text-muted-foreground text-xs">info@globalsentinelgroup.com</span>
              </li>
              <li className="flex items-start gap-4">
                <Phone className="text-gold w-4 h-4 shrink-0" />
                <span className="text-muted-foreground text-xs">+1 (202) 555-0198</span>
              </li>
              <li className="flex items-start gap-4">
                <MapPin className="text-gold w-4 h-4 shrink-0" />
                <span className="text-muted-foreground text-xs leading-relaxed">
                  1010 Security Tower, Suite 500<br />
                  Washington, DC 20001, USA
                </span>
              </li>
              <li className="flex items-start gap-4">
                <Clock className="text-gold w-4 h-4 shrink-0" />
                <span className="text-muted-foreground text-xs">Mon - Fri: 09:00 AM - 06:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-muted-foreground text-[10px] uppercase tracking-widest">
            © 2026 Global Sentinel Group. All Rights Reserved.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-muted-foreground hover:text-gold text-[10px] uppercase tracking-widest transition-colors">Privacy Policy</a>
            <a href="#" className="text-muted-foreground hover:text-gold text-[10px] uppercase tracking-widest transition-colors">Terms of Service</a>
            <a href="#" className="text-muted-foreground hover:text-gold text-[10px] uppercase tracking-widest transition-colors">Compliance</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
