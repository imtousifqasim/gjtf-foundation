"use client";

import * as React from "react";
import Image from "next/image";

interface HeroVideoBackgroundProps {
  videoId: string;
  startTimeSeconds?: number;
  posterImage: string;
}

export function HeroVideoBackground({
  videoId,
  startTimeSeconds = 100, // 1 minute 40 seconds = 100s
  posterImage,
}: HeroVideoBackgroundProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [shouldRenderIframe, setShouldRenderIframe] = React.useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    // Mount iframe after initial critical paint to prevent YouTube script blocking LCP
    const timer = setTimeout(() => {
      setShouldRenderIframe(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // YouTube embed URL with autoplay, muted, no controls, continuous loop, and 1m 40s start
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&start=${startTimeSeconds}&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&fs=0&enablejsapi=1`;

  const handleIframeLoad = () => {
    setIsLoaded(true);
    // Send postMessage commands to guarantee mute and play
    try {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "mute", args: [] }),
        "*"
      );
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "playVideo", args: [] }),
        "*"
      );
    } catch {
      // Ignore cross-origin frame postMessage restrictions if any
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* High-quality fallback poster while video buffers */}
      <Image
        src={posterImage}
        alt="GJTF Jhuggi Taleemi Project Classroom"
        fill
        priority
        className={`object-cover object-center transition-opacity duration-1000 ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
        sizes="100vw"
      />

      {/* 16:9 YouTube Container scaled to cover entire viewport */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {shouldRenderIframe && (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title="Jhuggi Taleemi Project Background Video"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            onLoad={handleIframeLoad}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.78vh] min-w-full h-[56.25vw] min-h-full object-cover pointer-events-none scale-105"
            style={{ border: 0 }}
            tabIndex={-1}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Balanced Cinematic Overlays: Lighter so video is clearly visible while text stays crisp */}
      {/* 1. Gentle vertical framing gradient (darker near navbar & bottom, bright & open in the center) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black/65" />

      {/* 2. Soft horizontal framing vignette for side focus */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-black/35" />

      {/* 3. Subtle ambient brand tone */}
      <div className="absolute inset-0 bg-primary-950/10 mix-blend-overlay" />
    </div>
  );
}
