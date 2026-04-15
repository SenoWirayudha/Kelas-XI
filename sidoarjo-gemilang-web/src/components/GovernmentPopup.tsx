import { useState } from "react";
import { X, Search, Building2, Hospital, MapPin, Globe } from "lucide-react";
import { useLanguage } from "@/i18n";

type Category = "dinas" | "kecamatan" | "rsud";

type GovernmentItem = {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  category: Category;
};

const governmentData: Record<Category, GovernmentItem[]> = {
  dinas: [
    { name: "Dinas Pendidikan dan Kebudayaan", address: "Jl. Pahlawan No.4, Sidoarjo", phone: "(031) 8921219", category: "dinas", website: "https://dispendik.sidoarjokab.go.id" },
    { name: "Dinas Kesehatan", address: "Jl. Mayjend Sungkono No.46, Sidoarjo", phone: "(031) 8941051", category: "dinas", website: "https://dinkes.sidoarjokab.go.id" },
    { name: "Dinas Pekerjaan Umum Bina Marga & SDA", address: "Jl. Monginsidi No.1, Sidoarjo", phone: "(031) 8961214", category: "dinas", website: "https://pubmsda.sidoarjokab.go.id" },
    { name: "Dinas Perhubungan", address: "Jl. Raya Geluran No.1, Sidoarjo", category: "dinas", website: "https://dishub.sidoarjokab.go.id" },
    { name: "Dinas Sosial", address: "Jl. Urip Sumoharjo No.33, Sidoarjo", category: "dinas", website: "https://dinsos.sidoarjokab.go.id" },
    { name: "Dinas Pangan dan Pertanian", address: "Jl. Pahlawan No.88, Sidoarjo", phone: "(031) 8961236", category: "dinas", website: "https://panganpertanian.sidoarjokab.go.id" },
    { name: "Dinas Perindustrian dan Perdagangan", address: "Jl. Juanda No.119, Sidoarjo", category: "dinas", website: "https://perindag.sidoarjokab.go.id" },
    { name: "Dinas Kependudukan dan Pencatatan Sipil", address: "Jl. Syahrin No.2, Sidoarjo", category: "dinas", website: "https://dispenduk.sidoarjokab.go.id" },
    { name: "Dinas Penanaman Modal dan PTSP", address: "Jl. Pahlawan No.100, Sidoarjo", category: "dinas", website: "https://dpmptsp.sidoarjokab.go.id" },
    { name: "Dinas Kepemudaan, Olahraga, dan Pariwisata", address: "Jl. Gajah Mada No.1, Sidoarjo", category: "dinas", website: "https://dispoporapar.sidoarjokab.go.id" },
    { name: "Dinas Pemberdayaan Masyarakat Desa", address: "Jl. Raya Geluran No.3, Sidoarjo", category: "dinas", website: "https://dpmd.sidoarjokab.go.id" },
    { name: "Dinas Komunikasi dan Informatika", address: "Jl. Syahrin No.1, Sidoarjo", category: "dinas", website: "https://diskominfo.sidoarjokab.go.id" },
  ],
  kecamatan: [
    { name: "Kecamatan Balongbendo", address: "Jl. Raya Balongbendo, Sidoarjo", phone: "(031) 8961001", category: "kecamatan", website: "https://balongbendo.sidoarjokab.go.id" },
    { name: "Kecamatan Buduran", address: "Jl. Raya Buduran No.1, Sidoarjo", phone: "(031) 8961002", category: "kecamatan", website: "https://buduran.sidoarjokab.go.id" },
    { name: "Kecamatan Candi", address: "Jl. Raya Candi No.1, Sidoarjo", phone: "(031) 8961003", category: "kecamatan", website: "https://candi.sidoarjokab.go.id" },
    { name: "Kecamatan Gedangan", address: "Jl. Raya Gedangan No.1, Sidoarjo", phone: "(031) 8961004", category: "kecamatan", website: "https://gedangan.sidoarjokab.go.id" },
    { name: "Kecamatan Jabon", address: "Jl. Raya Jabon No.1, Sidoarjo", phone: "(031) 8961005", category: "kecamatan", website: "https://jabon.sidoarjokab.go.id" },
    { name: "Kecamatan Krembung", address: "Jl. Raya Krembung No.1, Sidoarjo", phone: "(031) 8961006", category: "kecamatan", website: "https://krembung.sidoarjokab.go.id" },
    { name: "Kecamatan Krian", address: "Jl. Raya Krian No.1, Sidoarjo", phone: "(031) 8961007", category: "kecamatan", website: "https://krian.sidoarjokab.go.id" },
    { name: "Kecamatan Porong", address: "Jl. Raya Porong No.1, Sidoarjo", phone: "(031) 8961008", category: "kecamatan", website: "https://porong.sidoarjokab.go.id" },
    { name: "Kecamatan Prambon", address: "Jl. Raya Prambon No.1, Sidoarjo", phone: "(031) 8961009", category: "kecamatan", website: "https://prambon.sidoarjokab.go.id" },
    { name: "Kecamatan Sedati", address: "Jl. Raya Sedati No.1, Sidoarjo", phone: "(031) 8961010", category: "kecamatan", website: "https://sedati.sidoarjokab.go.id" },
    { name: "Kecamatan Sidoarjo", address: "Jl. Syahrin No.1, Sidoarjo", phone: "(031) 8961011", category: "kecamatan", website: "https://kec-sidoarjo.sidoarjokab.go.id" },
    { name: "Kecamatan Sukodono", address: "Jl. Raya Sukodono No.1, Sidoarjo", phone: "(031) 8961012", category: "kecamatan", website: "https://sukodono.sidoarjokab.go.id" },
    { name: "Kecamatan Taman", address: "Jl. Raya Taman No.1, Sidoarjo", phone: "(031) 8961013", category: "kecamatan", website: "https://taman.sidoarjokab.go.id" },
    { name: "Kecamatan Tanggulangin", address: "Jl. Raya Tanggulangin No.1, Sidoarjo", phone: "(031) 8961014", category: "kecamatan", website: "https://tanggulangin.sidoarjokab.go.id" },
    { name: "Kecamatan Tarik", address: "Jl. Raya Tarik No.1, Sidoarjo", phone: "(031) 8961015", category: "kecamatan", website: "https://tarik.sidoarjokab.go.id" },
    { name: "Kecamatan Tulangan", address: "Jl. Raya Tulangan No.1, Sidoarjo", phone: "(031) 8961016", category: "kecamatan", website: "https://tulangan.sidoarjokab.go.id" },
    { name: "Kecamatan Waru", address: "Jl. Raya Waru No.1, Sidoarjo", phone: "(031) 8961017", category: "kecamatan", website: "https://waru.sidoarjokab.go.id" },
    { name: "Kecamatan Wonoayu", address: "Jl. Raya Wonoayu No.1, Sidoarjo", phone: "(031) 8961018", category: "kecamatan", website: "https://wonoayu.sidoarjokab.go.id" },
  ],
  rsud: [
    { name: "RSUD Raden Tumanggung Notopuro Sidoarjo", address: "Jl. Mojopahit No.667, Celep, Sidoarjo", phone: "(031) 8961649", category: "rsud", website: "https://rsudrtnotopuro.sidoarjokab.go.id" },
    { name: "RSUD Sidoarjo Barat", address: "Jl. Bibis Bunder, Tambak Kemerakan, Krian", phone: "(031) 8961650", category: "rsud", website: "https://rsudsidoarjobarat.sidoarjokab.go.id" },
  ],
};

type GovernmentPopupProps = {
  isOpen: boolean;
  onClose: () => void;
};

const GovernmentPopup = ({ isOpen, onClose }: GovernmentPopup) => {
  const [activeCategory, setActiveCategory] = useState<Category>("dinas");
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useLanguage();

  if (!isOpen) return null;

  const data = governmentData[activeCategory];
  const filtered = data.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories: { key: Category; label: string; icon: React.ReactNode }[] = [
    { key: "dinas", label: t('governmentPopup.dinas'), icon: <Building2 className="h-4 w-4" /> },
    { key: "kecamatan", label: t('governmentPopup.kecamatan'), icon: <MapPin className="h-4 w-4" /> },
    { key: "rsud", label: t('governmentPopup.rsud'), icon: <Hospital className="h-4 w-4" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-emerald-100/90 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-green-50/70 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{t('governmentPopup.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('governmentPopup.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-white/90 p-2 text-muted-foreground transition hover:bg-white hover:text-foreground"
            aria-label="Tutup popup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 border-b border-emerald-100 bg-white px-6 py-3">
          {categories.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => {
                setActiveCategory(key);
                setSearchQuery("");
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                activeCategory === key
                  ? "bg-emerald-500 text-white shadow-md"
                  : "bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="border-b border-emerald-100 bg-white px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('governmentPopup.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-emerald-200 bg-emerald-50/60 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        {/* Content List */}
        <div className="max-h-[28rem] overflow-y-auto bg-white p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">{t('governmentPopup.noResults')}</p>
              <p className="text-xs text-muted-foreground">{t('governmentPopup.noResultsHint')}</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {filtered.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="group cursor-pointer rounded-xl border border-emerald-100/80 bg-emerald-50/40 p-4 transition-all hover:border-emerald-200 hover:bg-emerald-50/80 hover:shadow-sm"
                  onClick={() => {
                    if (item.website) {
                      window.open(item.website, "_blank", "noopener,noreferrer");
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (item.website) {
                        window.open(item.website, "_blank", "noopener,noreferrer");
                      }
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          item.category === "dinas"
                            ? "bg-emerald-100 text-emerald-600"
                            : item.category === "kecamatan"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {item.category === "dinas" ? (
                          <Building2 className="h-5 w-5" />
                        ) : item.category === "kecamatan" ? (
                          <MapPin className="h-5 w-5" />
                        ) : (
                          <Hospital className="h-5 w-5" />
                        )}
                      </div>
                      <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-emerald-700 transition-colors">
                        {item.name}
                      </h3>
                    </div>
                  </div>
                  <div className="ml-[3.25rem] mt-2 space-y-1">
                    <p className="flex items-start gap-1 text-xs text-muted-foreground">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                      {item.address}
                    </p>
                    {item.phone && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {item.phone}
                      </p>
                    )}
                    {item.website && (
                      <p className="flex items-center gap-1 text-xs text-emerald-600 group-hover:text-emerald-700">
                        <Globe className="h-3 w-3" />
                        <span className="truncate">{item.website.replace("https://", "")}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-emerald-100 bg-emerald-50/60 px-6 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            {t('governmentPopup.total')}: {filtered.length} {activeCategory === "dinas" ? t('governmentPopup.dinas') : activeCategory === "kecamatan" ? t('governmentPopup.kecamatan') : t('governmentPopup.rsud')}
            {searchQuery && " ditemukan"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GovernmentPopup;
