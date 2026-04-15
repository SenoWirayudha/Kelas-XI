import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import HeroSection from "@/components/HeroSection";
import WeatherCard from "@/components/WeatherCard";
import GovernmentPopup from "@/components/GovernmentPopup";

const Index = () => {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : true,
  );
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(isDesktop);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [governmentPopupOpen, setGovernmentPopupOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const applyViewportMode = (matches: boolean) => {
      setIsDesktop(matches);
      setLeftSidebarOpen(matches);
      // Don't auto-open weather card - keep it closed by default
      // setRightSidebarOpen(matches);
    };

    applyViewportMode(mediaQuery.matches);

    const handleViewportChange = (event: MediaQueryListEvent) => {
      applyViewportMode(event.matches);
    };

    mediaQuery.addEventListener("change", handleViewportChange);

    return () => {
      mediaQuery.removeEventListener("change", handleViewportChange);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F1F1F1]">
      <Sidebar
        isOpen={leftSidebarOpen}
        onToggle={() => setLeftSidebarOpen(!leftSidebarOpen)}
        onGovernmentClick={() => setGovernmentPopupOpen(true)}
        onWebGisClick={() => window.open("https://geoportal.sidoarjokab.go.id/#/", "_blank", "noopener,noreferrer")}
        onPublicServicesClick={() => window.open("https://sidoarjokab.go.id/layanan-terpadu/08", "_blank", "noopener,noreferrer")}
        onCctvClick={() => window.open("https://play.google.com/store/apps/details?id=com.cctv.dishub.sda&hl=en-ID", "_blank", "noopener,noreferrer")}
        onTransparencyClick={() => window.open("https://www.sidoarjokab.go.id/ipkd/1724930285", "_blank", "noopener,noreferrer")}
      />
      <main
        className={`flex-1 transition-all duration-300 ${
          leftSidebarOpen ? "ml-0 lg:ml-[13rem]" : "ml-0 lg:ml-14"
        } ${
          rightSidebarOpen ? "mr-0 lg:mr-52" : "mr-0"
        }`}
      >
        <HeroSection />
      </main>

      {!isDesktop && !governmentPopupOpen && (
        <button
          onClick={() => setLeftSidebarOpen((prev) => !prev)}
          className={`fixed top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-2 border-emerald-300 bg-white shadow-xl transition-all hover:bg-emerald-50 hover:shadow-2xl ${
            leftSidebarOpen ? "left-[12.5rem]" : "left-3"
          }`}
          aria-label={leftSidebarOpen ? "Tutup menu kiri" : "Buka menu kiri"}
          title={leftSidebarOpen ? "Tutup menu" : "Buka menu"}
        >
          {leftSidebarOpen ? (
            <svg className="h-5 w-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      )}

      {/* Right Sidebar - Cuaca */}
      {rightSidebarOpen && (
        <>
          {!isDesktop && (
            <button
              onClick={() => setRightSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/20"
              aria-label="Tutup panel cuaca"
            />
          )}
          <aside className="fixed right-2 top-16 bottom-4 z-50 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-emerald-100/70 bg-white/90 shadow-2xl backdrop-blur-xl transition-all duration-300 lg:right-0 lg:top-0 lg:bottom-0 lg:w-52 lg:rounded-none lg:border-l lg:border-r-0 lg:border-t-0 lg:border-b-0 lg:shadow-none">
            <div className="relative h-full">
              <WeatherCard
                variant="sidebar"
                isOpen={rightSidebarOpen}
                onToggle={() => setRightSidebarOpen(false)}
              />
            </div>
          </aside>
        </>
      )}

      {/* Toggle Button - Muncul saat sidebar cuaca tertutup */}
      {!rightSidebarOpen && !governmentPopupOpen && (
        <button
          onClick={() => {
            setLeftSidebarOpen(false);
            setRightSidebarOpen(true);
          }}
          className="group fixed right-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-2 border-emerald-300 bg-white shadow-xl transition-all hover:scale-110 hover:bg-emerald-50 hover:shadow-2xl sm:right-4 sm:h-12 sm:w-12"
          aria-label="Buka cuaca"
          title="Buka cuaca"
        >
          <svg
            className="h-5 w-5 text-emerald-600 transition-transform group-hover:scale-110 sm:h-6 sm:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        </button>
      )}

      {/* Government Popup */}
      <GovernmentPopup
        isOpen={governmentPopupOpen}
        onClose={() => setGovernmentPopupOpen(false)}
      />
    </div>
  );
};

export default Index;
