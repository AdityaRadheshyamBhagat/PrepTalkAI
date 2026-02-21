import { Link, useLocation, useNavigate } from "react-router-dom";
import { Brain, ArrowUpRight } from "lucide-react";
import { useCallback } from "react";

const navLinks = [
  { label: "Home", to: "/", section: null },
  { label: "Features", to: "/#features", section: "features" },
  { label: "Pricing", to: "/#pricing", section: "pricing" },
  { label: "About", to: "/about", section: null },
];

const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleNavClick = useCallback(
    (e: React.MouseEvent, to: string, section: string | null) => {
      if (section) {
        e.preventDefault();
        if (pathname === "/") {
          document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
        } else {
          navigate("/");
          setTimeout(() => {
            document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
          }, 400);
        }
      }
    },
    [pathname, navigate]
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-8 mt-5">
      <div
        className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-2 shadow-lg shadow-black/20 w-full"
        style={{ maxWidth: "1200px" }}
      >
        <div className="flex items-center gap-1">
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl shrink-0 px-4 py-2"
          >
            <Brain className="h-6 w-6 text-primary" />
            <span className="gradient-text">PrepTalkAI</span>
          </Link>

          <div className="h-5 w-px bg-white/10 mx-2" />

          {navLinks.map(({ label, to, section }) => {
            const isActive =
              to === "/about" ? pathname === "/about" : pathname === to || (to === "/" && pathname === "/");
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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
