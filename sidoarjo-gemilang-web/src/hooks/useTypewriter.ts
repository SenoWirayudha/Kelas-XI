import { useEffect, useState, useCallback } from 'react';

type UseTypewriterOptions = {
  speed?: number;
  delay?: number;
  enabled?: boolean;
};

/**
 * Hook untuk animasi mengetik
 * @param text - Teks yang akan diketik
 * @param options - Konfigurasi animasi
 */
export function useTypewriter(
  text: string,
  { speed = 30, delay = 100, enabled = true }: UseTypewriterOptions = {}
): string {
  const [displayText, setDisplayText] = useState(enabled ? '' : text);

  const typeText = useCallback(() => {
    if (!enabled) {
      setDisplayText(text);
      return;
    }

    setDisplayText('');
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, enabled]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      typeText();
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, typeText, delay]);

  return enabled ? displayText : text;
}

/**
 * Hook untuk animasi mengetik dengan multiple keys
 */
export function useTypewriterTranslations(
  translations: Record<string, string>,
  t: (key: string) => string,
  { speed = 30, delay = 100, enabled = true }: UseTypewriterOptions = {}
): Record<string, string> {
  const [result, setResult] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!enabled) {
      const initial: Record<string, string> = {};
      Object.keys(translations).forEach((key) => {
        initial[key] = t(key);
      });
      setResult(initial);
      return;
    }

    let cancelled = false;

    const animate = async () => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      if (cancelled) return;

      const entries = Object.entries(translations);
      const newResult: Record<string, string> = {};

      for (const [key] of entries) {
        const translatedText = t(key);
        
        // Type each character
        for (let i = 0; i <= translatedText.length; i++) {
          if (cancelled) return;
          
          await new Promise((resolve) => setTimeout(resolve, speed));
          if (cancelled) return;
          
          newResult[key] = translatedText.slice(0, i);
          setResult({ ...newResult });
        }
      }
    };

    animate();

    return () => {
      cancelled = true;
    };
  }, [translations, t, speed, delay, enabled]);

  return enabled ? result : translations;
}

export default useTypewriter;
