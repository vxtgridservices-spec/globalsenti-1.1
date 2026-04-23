import * as React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/src/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/src/components/ui/navigation-menu";
import { Button } from "@/src/components/ui/button";
import { Shield, Menu, X, Lock } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/src/components/ui/sheet";

const navItems = [
  { title: "Home", href: "/" },
  { title: "Investments", href: "/investments" },
  { title: "About", href: "/about" },
  { title: "Services", href: "/services" },
  { title: "Industries", href: "/industries" },
  { title: "Intelligence", href: "/intelligence" },
  { title: "Partnerships", href: "/partnerships" },
  { title: "Contact", href: "/contact" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
        isScrolled
          ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 border-border"
          : "bg-transparent py-4 border-transparent"
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
            <Shield className="text-background w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-serif font-bold text-base md:text-xl leading-none tracking-tight group-hover:text-gold transition-colors">
              GLOBAL SENTINEL
            </span>
            <span className="text-gold text-[8px] md:text-[11px] font-bold tracking-[0.3em] leading-none mt-1.5 opacity-80">
              GROUP
            </span>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              {navItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  <NavigationMenuLink
                    render={<Link to={item.href} />}
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "bg-transparent text-white hover:text-gold hover:bg-white/5 transition-colors font-medium cursor-pointer"
                    )}
                  >
                    {item.title}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          <Button nativeButton={false} render={<Link to="/portal" />} className="bg-gold hover:bg-gold-light text-background font-bold gap-2 px-6 h-11 tracking-widest text-xs transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]">
            <Lock className="w-3.5 h-3.5" />
            SECURE ACCESS
          </Button>
        </div>

        {/* Mobile Nav */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="text-white" />}>
              <Menu className="w-6 h-6" />
            </SheetTrigger>
            <SheetContent side="right" className="bg-background border-border">
              <div className="flex flex-col gap-6 mt-12">
                {navItems.map((item) => (
                  <Link
                    key={item.title}
                    to={item.href}
                    className="text-xl font-medium text-white hover:text-gold transition-colors"
                  >
                    {item.title}
                  </Link>
                ))}
                <Button nativeButton={false} render={<Link to="/portal" />} className="bg-gold hover:bg-gold-light text-background font-bold mt-4 h-12 tracking-widest text-xs">
                  SECURE ACCESS
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
