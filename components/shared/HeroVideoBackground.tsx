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
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

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
          isLoaded ? "opacity-20" : "opacity-100"
        }`}
        sizes="100vw"
      />

      {/* 16:9 YouTube Container scaled to cover entire viewport */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title="Jhuggi Taleemi Project Background Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          onLoad={handleIframeLoad}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.78vh] min-w-full h-[56.25vw] min-h-full object-cover pointer-events-none scale-105"
          style={{ border: 0 }}
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      {/* Upper Black & Cinematic Gradient Overlays for High Legibility & Vibrant Colors */}
      {/* 1. Deep black base tint */}
      <div className="absolute inset-0 bg-black/60" />

      {/* 2. Top-to-bottom dark gradient to frame navbar and bottom stats */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/45 to-black/90" />

      {/* 3. Horizontal vignette to keep center-stage text crisp */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />

      {/* 4. Subtle rich primary green brand atmosphere */}
      <div className="absolute inset-0 bg-primary-950/20 mix-blend-multiply" />
    </div>
  );
}
