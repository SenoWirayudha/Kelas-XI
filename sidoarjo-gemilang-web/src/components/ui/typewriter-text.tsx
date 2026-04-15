import { useEffect, useState, ReactNode } from 'react';
import { useLanguage } from '@/i18n';

type TypewriterTextProps = {
  children: string;
  speed?: number;
  className?: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
};

/**
 * Komponen wrapper untuk animasi mengetik
 * Animasi akan trigger saat children atau language berubah
 */
export const TypewriterText: React.FC<TypewriterTextProps> = ({
  children,
  speed = 30,
  className = '',
  as: Component = 'span',
}) => {
  const { language } = useLanguage();
  const [displayText, setDisplayText] = useState(children);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Langsung tampilkan teks jika tidak perlu animasi
    if (children === displayText) return;

    let currentIndex = 0;
    const targetText = children;
    setIsTyping(true);
    setDisplayText('');

    const interval = setInterval(() => {
      if (currentIndex <= targetText.length) {
        setDisplayText(targetText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [children, language, speed]);

  return (
    <Component className={`${className} ${isTyping ? 'typing' : ''}`}>
      {displayText}
      {isTyping && (
        <span className="inline-block w-0.5 h-4 ml-0.5 bg-current animate-pulse" />
      )}
    </Component>
  );
};

/**
 * Komponen untuk animasi mengetik dengan ReactNode
 */
export const TypewriterContent: React.FC<{
  children: ReactNode;
  speed?: number;
  className?: string;
}> = ({ children, speed = 30, className = '' }) => {
  const { language } = useLanguage();
  const [displayText, setDisplayText] = useState(children);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (typeof children !== 'string') {
      setDisplayText(children);
      return;
    }

    let currentIndex = 0;
    const targetText = children;
    setIsTyping(true);
    setDisplayText('');

    const interval = setInterval(() => {
      if (currentIndex <= targetText.length) {
        setDisplayText(targetText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [children, language, speed]);

  return (
    <span className={`${className} ${isTyping ? 'typing' : ''}`}>
      {typeof displayText === 'string' ? displayText : children}
      {isTyping && typeof displayText === 'string' && (
        <span className="inline-block w-0.5 h-4 ml-0.5 bg-current animate-pulse" />
      )}
    </span>
  );
};

export default TypewriterText;
