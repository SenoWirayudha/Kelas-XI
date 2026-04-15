import { Layers, MapPin, Users, Monitor, BarChart2, ChevronLeft, ChevronRight } from "lucide-react";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { useLanguage } from "@/i18n";
import { TypewriterText } from "@/components/ui/typewriter-text";

type SidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
  onGovernmentClick?: () => void;
  onWebGisClick?: () => void;
  onPublicServicesClick?: () => void;
  onCctvClick?: () => void;
  onTransparencyClick?: () => void;
};

const Sidebar = ({ isOpen, onToggle, onGovernmentClick, onWebGisClick, onPublicServicesClick, onCctvClick, onTransparencyClick }: SidebarProps) => {
  const { t } = useLanguage();

  const navItems = [
    { icon: Layers, label: t('sidebar.government') },
    { icon: MapPin, label: t('sidebar.webgis') },
    { icon: Users, label: t('sidebar.publicServices') },
    { icon: Monitor, label: t('sidebar.cctv') },
    { icon: BarChart2, label: t('sidebar.transparency') },
  ];

  const socialItems = [
    { icon: FaFacebookF, label: "FB" },
    { icon: FaInstagram, label: "IG" },
    { icon: FaXTwitter, label: "X" },
    { icon: FaYoutube, label: "YT" },
  ];

  return (
    <aside 
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col items-center justify-between border-r border-emerald-100 bg-gradient-to-b from-emerald-50 via-white to-green-50/70 py-6 shadow-[6px_0_24px_-18px_rgba(22,163,74,0.45)] transition-all duration-300 ${
        isOpen
          ? "w-[13rem] translate-x-0 pointer-events-auto"
          : "w-[13rem] -translate-x-full pointer-events-none lg:w-[3.5rem] lg:translate-x-0 lg:pointer-events-auto"
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-4 top-5 z-50 hidden h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-white shadow-md transition-all hover:bg-emerald-50 hover:shadow-lg lg:flex"
        aria-label={isOpen ? "Tutup sidebar" : "Buka sidebar"}
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4 text-emerald-700" />
        ) : (
          <ChevronRight className="h-4 w-4 text-emerald-700" />
        )}
      </button>

      <div className="flex flex-col items-center gap-3">
        <img
          src="/images/sidoarjo-logo.png"
          alt="Logo Sidoarjo"
          width={50}
          height={50}
          className="mb-2 rounded-xl bg-emerald-100/60 p-1 ring-1 ring-emerald-200/80"
        />
        
        {isOpen && (
          <nav className="flex w-full flex-col items-center gap-2 px-3">
            {navItems.map((item, index) => (
              <button
                key={item.label}
                onClick={index === 0 ? onGovernmentClick : index === 1 ? onWebGisClick : index === 2 ? onPublicServicesClick : index === 3 ? onCctvClick : index === 4 ? onTransparencyClick : undefined}
                className="group flex h-20 w-full flex-col items-center justify-center gap-1 rounded-xl border border-emerald-200/80 bg-white/60 px-2 py-1 text-emerald-700/80 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-100/80 hover:text-emerald-800 hover:shadow-sm"
              >
                <item.icon className="h-7 w-7 shrink-0 drop-shadow-[0_1px_2px_rgba(22,163,74,0.2)]" />
                <span className="flex min-h-[2rem] w-full items-center justify-center text-center text-[11px] font-semibold leading-tight whitespace-pre-line">
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        )}

        {!isOpen && (
          <nav className="flex w-full flex-col items-center gap-2 px-2">
            {navItems.map((item) => (
              <button
                key={item.label}
                className="group flex h-11 w-full items-center justify-center rounded-xl border border-emerald-200/80 bg-white/60 p-2 text-emerald-700/80 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-100/80 hover:text-emerald-800 hover:shadow-sm"
                title={item.label.replace('\n', ' ')}
              >
                <item.icon className="h-5 w-5 shrink-0 drop-shadow-[0_1px_2px_rgba(22,163,74,0.2)]" />
              </button>
            ))}
          </nav>
        )}
      </div>

      {isOpen && (
        <div className="flex w-full flex-wrap items-center justify-center gap-2 px-3 text-emerald-700/80">
          {socialItems.map((item) => (
            <a
              key={item.label}
              href="#"
              className="flex items-center justify-center rounded-lg border border-transparent p-2 text-xs font-medium transition-all hover:border-emerald-200 hover:bg-emerald-100/70 hover:text-emerald-900"
            >
              <item.icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
