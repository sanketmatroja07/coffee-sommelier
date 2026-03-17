import { useState, useRef, useEffect } from "react";
import "./LazyImage.css";

interface LazyImageProps {
  src: string | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

const PLACEHOLDER = "linear-gradient(135deg, #e8ddd5 0%, #d4c4b5 100%)";

export function LazyImage({ src, alt, className = "", style }: LazyImageProps) {
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!src || !ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { rootMargin: "100px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [src]);

  if (!src) {
    return (
      <div
        className={`lazy-image lazy-image--placeholder ${className}`}
        style={{ background: PLACEHOLDER, ...style }}
        role="img"
        aria-label={alt}
      />
    );
  }

  return (
    <div
      ref={ref}
      className={`lazy-image ${className} ${loaded ? "lazy-image--loaded" : ""}`}
      style={style}
    >
      <div
        className="lazy-image__placeholder"
        style={{ background: PLACEHOLDER }}
        aria-hidden
      />
      {inView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className="lazy-image__img"
        />
      )}
    </div>
  );
}
