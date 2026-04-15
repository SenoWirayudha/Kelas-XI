import { useEffect, useState } from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplets,
  Sun,
  Thermometer,
  Umbrella,
  Wind,
  X,
} from "lucide-react";
import { useLanguage } from "@/i18n";
import { TypewriterText } from "@/components/ui/typewriter-text";

type WeatherCondition = {
  code: number;
  label: string;
  icon: React.ReactNode;
  gradient: string;
};

type WeatherForecast = {
  date: string;
  day: string;
  maxTemp: number;
  minTemp: number;
  code: number;
};

type WeatherCardProps = {
  variant?: "full" | "sidebar";
  isOpen?: boolean;
  onToggle?: () => void;
};

const WEATHER_CODES: Record<number, WeatherCondition> = {
  0: { code: 0, label: "Cerah", icon: <Sun className="h-8 w-8" />, gradient: "from-amber-400 to-orange-500" },
  1: { code: 1, label: "Cerah Berawan", icon: <Sun className="h-8 w-8" />, gradient: "from-amber-400 to-yellow-500" },
  2: { code: 2, label: "Berawan Sebagian", icon: <Cloud className="h-8 w-8" />, gradient: "from-sky-400 to-blue-500" },
  3: { code: 3, label: "Berawan", icon: <Cloud className="h-8 w-8" />, gradient: "from-gray-400 to-slate-500" },
  45: { code: 45, label: "Berkabut", icon: <Cloud className="h-8 w-8" />, gradient: "from-gray-300 to-gray-500" },
  48: { code: 48, label: "Berkabut Tebal", icon: <Cloud className="h-8 w-8" />, gradient: "from-gray-400 to-gray-600" },
  51: { code: 51, label: "Gerimis Ringan", icon: <CloudDrizzle className="h-8 w-8" />, gradient: "from-blue-300 to-sky-500" },
  53: { code: 53, label: "Gerimis Sedang", icon: <CloudDrizzle className="h-8 w-8" />, gradient: "from-blue-400 to-sky-600" },
  55: { code: 55, label: "Gerimis Lebat", icon: <CloudDrizzle className="h-8 w-8" />, gradient: "from-blue-500 to-indigo-600" },
  61: { code: 61, label: "Hujan Ringan", icon: <CloudRain className="h-8 w-8" />, gradient: "from-blue-400 to-blue-700" },
  63: { code: 63, label: "Hujan Sedang", icon: <CloudRain className="h-8 w-8" />, gradient: "from-blue-500 to-indigo-700" },
  65: { code: 65, label: "Hujan Lebat", icon: <CloudRain className="h-8 w-8" />, gradient: "from-indigo-500 to-purple-700" },
  71: { code: 71, label: "Salju Ringan", icon: <CloudSnow className="h-8 w-8" />, gradient: "from-slate-200 to-blue-300" },
  73: { code: 73, label: "Salju Sedang", icon: <CloudSnow className="h-8 w-8" />, gradient: "from-slate-300 to-blue-400" },
  75: { code: 75, label: "Salju Lebat", icon: <CloudSnow className="h-8 w-8" />, gradient: "from-slate-400 to-blue-500" },
  80: { code: 80, label: "Hujan Lokal", icon: <CloudRain className="h-8 w-8" />, gradient: "from-sky-400 to-blue-600" },
  95: { code: 95, label: "Badai Petir", icon: <CloudLightning className="h-8 w-8" />, gradient: "from-purple-600 to-indigo-800" },
  96: { code: 96, label: "Badai dengan Hujan Es", icon: <CloudLightning className="h-8 w-8" />, gradient: "from-purple-700 to-indigo-900" },
  99: { code: 99, label: "Badai Petir Hebat", icon: <CloudLightning className="h-8 w-8" />, gradient: "from-indigo-800 to-purple-900" },
};

const getWeatherInfo = (code: number): WeatherCondition => {
  return WEATHER_CODES[code] || {
    code,
    label: "Tidak Diketahui",
    icon: <Cloud className="h-8 w-8" />,
    gradient: "from-gray-400 to-slate-500",
  };
};

const getDayName = (dateStr: string, lang: string = 'id'): string => {
  const date = new Date(dateStr);
  const days = lang === 'en' 
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  return days[date.getDay()];
};

const WeatherCard = ({ variant = "full", isOpen = true, onToggle }: WeatherCardProps) => {
  const { t, language } = useLanguage();
  const [weather, setWeather] = useState<{
    temperature: number;
    humidity: number;
    windSpeed: number;
    weatherCode: number;
    feelsLike: number;
    uvIndex: number;
    forecast: WeatherForecast[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Sidoarjo coordinates: -7.4478, 112.7183
        const response = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-7.4478&longitude=112.7183&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FJakarta&forecast_days=5"
        );

        if (!response.ok) {
          throw new Error("Gagal mengambil data cuaca");
        }

        const data = await response.json();

        const forecast: WeatherForecast[] = data.daily.time.map((date: string, index: number) => ({
          date,
          day: getDayName(date, language),
          maxTemp: Math.round(data.daily.temperature_2m_max[index]),
          minTemp: Math.round(data.daily.temperature_2m_min[index]),
          code: data.daily.weather_code[index],
        }));

        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          humidity: data.current.relative_humidity_2m,
          windSpeed: Math.round(data.current.wind_speed_10m),
          weatherCode: data.current.weather_code,
          feelsLike: Math.round(data.current.apparent_temperature),
          uvIndex: 0, // Open-Meteo free tier doesn't include UV in this endpoint
          forecast,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [language]);

  if (variant === "sidebar") {
    if (loading) {
      return (
        <div className="h-full p-3 pt-10">
          <div className="animate-pulse space-y-3">
            <div className="rounded-xl bg-emerald-100 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="h-3 w-24 rounded bg-emerald-200" />
                <div className="h-4 w-12 rounded-full bg-emerald-200" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-16 rounded bg-emerald-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 rounded bg-emerald-200" />
                  <div className="h-3 w-24 rounded bg-emerald-200" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-emerald-100" />
              ))}
            </div>
            <div className="space-y-1.5">
              <div className="mb-2 h-3 w-24 rounded bg-emerald-100" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 rounded-md bg-emerald-100" />
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="h-full p-3">
          <div className="rounded-xl border border-red-100 bg-red-50/80 p-3">
            <div className="flex items-center gap-2 text-red-600">
              <CloudRain className="h-4 w-4" />
              <p className="text-xs font-medium">Gagal memuat cuaca</p>
            </div>
          </div>
        </div>
      );
    }

    if (!weather) return null;

    const sidebarWeather = getWeatherInfo(weather.weatherCode);

    return (
      <div className="h-full relative">
        {/* Close Button */}
        {onToggle && (
          <button
            onClick={onToggle}
            className="absolute right-2 top-2 z-50 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 border border-emerald-200 shadow-md transition-all hover:bg-white hover:shadow-lg hover:scale-105"
            aria-label="Tutup cuaca"
          >
            <X className="h-3.5 w-3.5 text-emerald-700" />
          </button>
        )}

        <div className="h-full p-2.5 pt-9">
          <div className="h-full overflow-y-auto space-y-3">
            {/* Header - Current Weather */}
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-2.5">
              <div className="flex items-center justify-between mb-2">
                <TypewriterText className="text-xs font-semibold text-emerald-700" speed={20}>
                  {t('weather.title')}
                </TypewriterText>
                <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] text-emerald-600">
                  {new Date().toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-4xl font-bold text-emerald-700">{weather.temperature}°</span>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                    <div className="scale-75 origin-left">{sidebarWeather.icon}</div>
                    <span className="text-[11px] font-semibold">{sidebarWeather.label}</span>
                  </div>
                  <p className="text-[11px] text-emerald-600">{t('weather.feelsLike')} {weather.feelsLike}°C</p>
                </div>
              </div>
            </div>

            {/* Stats - Vertical List */}
            <div className="space-y-2">
              {/* Humidity */}
              <div className="rounded-lg border border-cyan-100/60 bg-gradient-to-r from-cyan-50 to-blue-50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-600">
                    <Droplets className="h-3.5 w-3.5" />
                    <TypewriterText className="text-[11px] font-semibold" speed={15}>
                      {t('weather.humidity')}
                    </TypewriterText>
                  </div>
                  <p className="text-[15px] font-bold text-cyan-700">{weather.humidity}%</p>
                </div>
              </div>

              {/* Wind Speed */}
              <div className="rounded-lg border border-teal-100/60 bg-gradient-to-r from-teal-50 to-emerald-50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-teal-600">
                    <Wind className="h-3.5 w-3.5" />
                    <TypewriterText className="text-[11px] font-semibold" speed={15}>
                      {t('weather.wind')}
                    </TypewriterText>
                  </div>
                  <p className="text-[15px] font-bold text-teal-700">{weather.windSpeed} km/h</p>
                </div>
              </div>

              {/* Feels Like */}
              <div className="rounded-lg border border-orange-100/60 bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-orange-600">
                    <Thermometer className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-semibold">{t('weather.feelsLike')}</span>
                  </div>
                  <p className="text-[15px] font-bold text-orange-700">{weather.feelsLike}°C</p>
                </div>
              </div>

              {/* Suggestion */}
              <div className="rounded-lg border border-purple-100/60 bg-gradient-to-r from-purple-50 to-pink-50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-600">
                    <Umbrella className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-semibold">Saran</span>
                  </div>
                  <p className="text-xs font-bold text-purple-700">
                    {weather.weatherCode >= 61 ? t('weather.suggestion.umbrella') : t('weather.suggestion.cheerful')}
                  </p>
                </div>
              </div>
            </div>

            {/* Forecast */}
            <div className="rounded-lg border border-emerald-100/60 bg-emerald-50/50 p-2.5">
              <h4 className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700">
                <Sun className="h-3 w-3" />
                <TypewriterText speed={15}>
                  {t('weather.forecast')}
                </TypewriterText>
              </h4>
              <div className="space-y-1.5">
                {weather.forecast.map((day, index) => {
                  const forecastWeather = getWeatherInfo(day.code);
                  return (
                    <div
                      key={day.date}
                      className={`flex items-center justify-between rounded-md bg-white/70 px-2 py-1.5 transition-all hover:shadow-sm ${
                        index === 0 ? "ring-1 ring-emerald-200/60" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold ${index === 0 ? "text-emerald-700" : "text-muted-foreground"}`}>
                          {index === 0 ? t('weather.today') : day.day}
                        </span>
                        <div className="scale-75 origin-left text-emerald-600">
                          {forecastWeather.icon}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold">{day.maxTemp}°</span>
                        <span className="text-[10px] text-muted-foreground">{day.minTemp}°</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-[9px] text-muted-foreground pb-2">
              <TypewriterText speed={15}>
                {t('weather.dataFrom')}
              </TypewriterText>{" "}
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Open-Meteo
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto mt-6 w-full max-w-5xl px-4">
        <div className="animate-pulse overflow-hidden rounded-3xl border border-emerald-100/80 bg-white/80 p-6 shadow-lg backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-200" />
            <div className="h-6 w-48 rounded bg-emerald-200" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="h-16 w-32 rounded-lg bg-emerald-100" />
              <div className="h-4 w-40 rounded bg-emerald-100" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 rounded-lg bg-emerald-100" />
              <div className="h-20 rounded-lg bg-emerald-100" />
              <div className="h-20 rounded-lg bg-emerald-100" />
              <div className="h-20 rounded-lg bg-emerald-100" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-emerald-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-6 w-full max-w-5xl px-4">
        <div className="rounded-3xl border border-red-100 bg-red-50/80 p-6 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-3 text-red-600">
            <CloudRain className="h-6 w-6" />
            <p className="text-sm font-medium">Gagal memuat cuaca: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const currentWeather = getWeatherInfo(weather.weatherCode);

  return (
    <div className="mx-auto mt-6 w-full max-w-5xl px-4">
      <div className="group overflow-hidden rounded-3xl border border-emerald-100/80 bg-white/80 shadow-lg backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:shadow-emerald-100/50">
        {/* Header with gradient */}
        <div className={`relative bg-gradient-to-r ${currentWeather.gradient} p-6 text-white`}>
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-12 right-24 h-24 w-24 rounded-full bg-white/10 blur-xl" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                  Sidoarjo
                </div>
                <div className="rounded-full bg-white/20 px-3 py-1 text-xs backdrop-blur-sm">
                  Terkini
                </div>
              </div>
              <div className="flex items-end gap-3">
                <span className="text-7xl font-bold tracking-tighter drop-shadow-lg">
                  {weather.temperature}°
                </span>
                <div className="mb-2">
                  <div className="flex items-center gap-2">
                    {currentWeather.icon}
                    <span className="text-lg font-semibold">{currentWeather.label}</span>
                  </div>
                  <p className="ml-10 text-sm opacity-90">Terasa seperti {weather.feelsLike}°C</p>
                </div>
              </div>
            </div>

            <div className="hidden text-right md:block">
              <div className="rounded-2xl bg-white/20 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs font-medium opacity-90">Diperbarui</p>
                <p className="text-sm font-bold">
                  {new Date().toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weather Details Grid */}
        <div className="grid gap-4 p-6 md:grid-cols-2">
          {/* Left: Weather Stats */}
          <div className="grid grid-cols-2 gap-3">
            {/* Humidity */}
            <div className="group/stat relative overflow-hidden rounded-2xl border border-emerald-100/60 bg-gradient-to-br from-cyan-50 to-blue-50 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-100">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-cyan-200/30 transition-transform group-hover/stat:scale-150" />
              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-2 text-cyan-600">
                  <Droplets className="h-5 w-5" />
                  <span className="text-xs font-semibold">Kelembaban</span>
                </div>
                <p className="text-2xl font-bold text-cyan-700">{weather.humidity}%</p>
              </div>
            </div>

            {/* Wind Speed */}
            <div className="group/stat relative overflow-hidden rounded-2xl border border-emerald-100/60 bg-gradient-to-br from-teal-50 to-emerald-50 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-teal-100">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-teal-200/30 transition-transform group-hover/stat:scale-150" />
              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-2 text-teal-600">
                  <Wind className="h-5 w-5" />
                  <span className="text-xs font-semibold">Angin</span>
                </div>
                <p className="text-2xl font-bold text-teal-700">{weather.windSpeed} km/h</p>
              </div>
            </div>

            {/* Feels Like */}
            <div className="group/stat relative overflow-hidden rounded-2xl border border-emerald-100/60 bg-gradient-to-br from-orange-50 to-amber-50 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-orange-100">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-orange-200/30 transition-transform group-hover/stat:scale-150" />
              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-2 text-orange-600">
                  <Thermometer className="h-5 w-5" />
                  <span className="text-xs font-semibold">Terasa</span>
                </div>
                <p className="text-2xl font-bold text-orange-700">{weather.feelsLike}°C</p>
              </div>
            </div>

            {/* Umbrella */}
            <div className="group/stat relative overflow-hidden rounded-2xl border border-emerald-100/60 bg-gradient-to-br from-purple-50 to-pink-50 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-purple-100">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-purple-200/30 transition-transform group-hover/stat:scale-150" />
              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-2 text-purple-600">
                  <Umbrella className="h-5 w-5" />
                  <span className="text-xs font-semibold">Perlindungan</span>
                </div>
                <p className="text-sm font-bold text-purple-700">
                  {weather.weatherCode >= 61 ? "Bawa Payung!" : "Aman"}
                </p>
              </div>
            </div>
          </div>

          {/* Right: 5-Day Forecast */}
          <div className="rounded-2xl border border-emerald-100/60 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <Sun className="h-4 w-4" />
              Prakiraan 5 Hari
            </h3>
            <div className="space-y-2">
              {weather.forecast.map((day, index) => {
                const forecastWeather = getWeatherInfo(day.code);
                return (
                  <div
                    key={day.date}
                    className={`group/forecast flex items-center justify-between rounded-xl border border-emerald-100/50 bg-white/60 px-3 py-2 transition-all duration-300 hover:translate-x-1 hover:shadow-md hover:shadow-emerald-100/50 ${
                      index === 0 ? "ring-1 ring-emerald-200" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`min-w-[40px] text-sm font-semibold ${index === 0 ? "text-emerald-700" : "text-muted-foreground"}`}>
                        {index === 0 ? t('weather.today') : day.day}
                      </span>
                      <div className={`text-emerald-600 transition-transform group-hover/forecast:scale-110`}>
                        {forecastWeather.icon}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{day.maxTemp}°</span>
                      <span className="text-xs text-muted-foreground">/ {day.minTemp}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-emerald-100/60 bg-emerald-50/30 px-6 py-3">
          <p className="text-center text-xs text-muted-foreground">
            Data cuaca dari{" "}
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
            >
              Open-Meteo API
            </a>{" "}
            • Koordinat Sidoarjo: -7.4478°S, 112.7183°E
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
