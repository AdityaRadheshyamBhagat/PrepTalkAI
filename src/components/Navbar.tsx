import { Link, useLocation, useNavigate } from "react-router-dom";
import { Brain, ArrowUpRight, LogOut, User } from "lucide-react";
import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { label: "Home", to: "/", section: null },
  { label: "Features", to: "/#features", section: "features" },
  { label: "Pricing", to: "/#pricing", section: "pricing" },
  { label: "About", to: "/about", section: null },
];

const Navbar = () => {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const goHome = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (hash) {
        window.history.pushState(null, "", "/");
        window.dispatchEvent(new PopStateEvent("popstate"));
      } else if (pathname !== "/") {
        navigate("/");
      }
    },
    [pathname, hash, navigate],
  );

  const handleNavClick = useCallback(
    (e: React.MouseEvent, to: string, section: string | null) => {
      if (section) {
        e.preventDefault();
        if (pathname === "/") {
          document
            .getElementById(section)
            ?.scrollIntoView({ behavior: "smooth" });
          window.history.pushState(null, "", `/#${section}`);
          window.dispatchEvent(new PopStateEvent("popstate"));
        } else {
          navigate(`/#${section}`);
          setTimeout(() => {
            document
              .getElementById(section)
              ?.scrollIntoView({ behavior: "smooth" });
          }, 400);
        }
      } else if (to === "/") {
        goHome(e);
      }
    },
    [pathname, navigate, goHome],
  );

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-8 mt-5">
      <div
        className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-2 shadow-lg shadow-black/20 w-full"
        style={{ maxWidth: "1200px" }}
      >
        <div className="flex items-center gap-1">
          <Link
            to="/"
            onClick={goHome}
            className="flex items-center gap-2 font-bold text-xl shrink-0 px-4 py-2"
          >
            <Brain className="h-6 w-6 text-primary" />
            <span className="gradient-text">PrepTalkAI</span>
          </Link>

          <div className="h-5 w-px bg-white/10 mx-2" />

          {navLinks.map(({ label, to, section }) => {
            const isActive =
              to === "/about"
                ? pathname === "/about"
                : section
                  ? hash === `#${section}`
                  : pathname === "/" && !hash;
            return (
              <Link
                key={label}
                to={to}
                onClick={(e) => handleNavClick(e, to, section)}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-base font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                )}
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="rounded-full bg-white/90 px-5 py-2.5 text-base font-semibold text-gray-900 hover:bg-white transition-colors shadow-sm"
              >
                Dashboard
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <Avatar className="h-9 w-9 cursor-pointer border-2 border-white/20 hover:border-white/40 transition-colors">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                        {getInitials(user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.displayName || "User"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={async () => { await signOut(); navigate("/"); }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-0.5 px-5 py-2.5 text-base font-medium text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/5"
              >
                Login
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-white/90 px-5 py-2.5 text-base font-semibold text-gray-900 hover:bg-white transition-colors shadow-sm"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
