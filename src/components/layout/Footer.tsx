import { Shield, Linkedin, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-background border-t border-white/5 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
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
            <p className="text-muted-foreground leading-relaxed">
              Delivering security, resources, and logistics solutions with 
              integrity, precision, and global expertise. Trusted by governments 
              and corporations worldwide.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center text-white hover:bg-gold hover:text-background transition-all">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center text-white hover:bg-gold hover:text-background transition-all">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center text-white hover:bg-gold hover:text-background transition-all">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-8">Quick Links</h4>
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
                  <Link to={item.href} className="text-muted-foreground hover:text-gold transition-colors">{item.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-8">Services</h4>
            <ul className="space-y-4">
              {[
                { name: "Security Operations", href: "/services" },
                { name: "Secure Logistics", href: "/services" },
                { name: "Commodity Trade", href: "/services" },
                { name: "Risk & Intelligence", href: "/intelligence" },
                { name: "Industrial Supply", href: "/services" },
                { name: "Global Partnerships", href: "/partnerships" }
              ].map((item) => (
                <li key={item.name}>
                  <Link to={item.href} className="text-muted-foreground hover:text-gold transition-colors">{item.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-8">Contact Information</h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <Mail className="text-gold w-5 h-5 shrink-0" />
                <span className="text-muted-foreground">info@globalsentinelgroup.com</span>
              </li>
              <li className="flex items-start gap-4">
                <Phone className="text-gold w-5 h-5 shrink-0" />
                <span className="text-muted-foreground">+1 (202) 555-0198</span>
              </li>
              <li className="flex items-start gap-4">
                <MapPin className="text-gold w-5 h-5 shrink-0" />
                <span className="text-muted-foreground">
                  1010 Security Tower, Suite 500<br />
                  Washington, DC 20001, USA
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-muted-foreground text-sm">
            © 2024 Global Sentinel Group. All Rights Reserved.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-muted-foreground hover:text-gold text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-muted-foreground hover:text-gold text-sm transition-colors">Terms of Service</a>
            <a href="#" className="text-muted-foreground hover:text-gold text-sm transition-colors">Compliance</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
