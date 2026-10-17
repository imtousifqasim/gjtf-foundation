"use client";

import * as React from "react";

interface HeroVideoBackgroundProps {
  videoId: string;
  startTimeSeconds?: number;
  posterImage?: string;
}

export function HeroVideoBackground({
  videoId,
  startTimeSeconds = 100, // 1 minute 40 seconds = 100s
}: HeroVideoBackgroundProps) {
  const [origin, setOrigin] = React.useState("");
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const sendCommand = React.useCallback((func: string, args: any[] = []) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func, args }),
        "*"
      );
    } catch {
      // Safe ignore cross-origin error
    }
  }, []);

  // Listen for YouTube postMessage API state updates to seamlessly loop
  React.useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        let payload = e.data;
        if (typeof payload === "string") {
          payload = JSON.parse(payload);
        }

        if (payload?.event === "onStateChange") {
          // 0 = ENDED: Loop immediately back to start without showing YouTube end-screen or next cards
          if (payload.info === 0) {
            sendCommand("seekTo", [startTimeSeconds, true]);
            sendCommand("playVideo", []);
          }
          // 2 = PAUSED: Enforce continuous ambient playback so user never sees a pause state
          if (payload.info === 2) {
            sendCommand("playVideo", []);
          }
        }
      } catch {
        // Safe ignore non-JSON or third-party messages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [startTimeSeconds, sendCommand]);

  // Ensure playback resumes when user switches back to the tab
  React.useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        sendCommand("mute", []);
        sendCommand("playVideo", []);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [sendCommand]);

  // Strict ambient background YouTube embed parameters:
  // - controls=0: Hide playbar & controls
  // - autoplay=1 & mute=1: Guaranteed autoplay without requiring user interaction
  // - loop=1 & playlist: Loop single video seamlessly
  // - iv_load_policy=3: Remove annotations / interactive cards
  // - modestbranding=1: Minimize YouTube branding
  // - disablekb=1 & fs=0: Disable keyboard controls and fullscreen
  // - enablejsapi=1: Enable postMessage command control
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&start=${startTimeSeconds}&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&disablekb=1&fs=0&enablejsapi=1${
    origin ? `&origin=${encodeURIComponent(origin)}` : ""
  }`;

  const handleIframeLoad = () => {
    sendCommand("mute", []);
    sendCommand("playVideo", []);

    const t1 = setTimeout(() => {
      sendCommand("mute", []);
      sendCommand("playVideo", []);
    }, 300);

    return () => clearTimeout(t1);
  };

  return (
    <div className="absolute inset-0 overflow-hidden select-none z-0 bg-slate-950">
      {/* 1. 16:9 YouTube Container scaled up to crop out YouTube player chrome (titles, next button, watermark) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title="Jhuggi Taleemi Project Background Video"
          loading="eager"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          onLoad={handleIframeLoad}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.78vh] min-w-full h-[56.25vw] min-h-full object-cover pointer-events-none scale-125 sm:scale-135 md:scale-140"
          style={{ border: 0 }}
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      {/* 2. Transparent Interaction Shield:
          Absorbs all mouse clicks, touches, and gestures across the hero background so the YouTube
          iframe NEVER receives user focus or tap events. */}
      <div
        className="absolute inset-0 z-10 pointer-events-auto cursor-default select-none touch-none"
        aria-hidden="true"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
      />

      {/* 3. Balanced Cinematic Overlays:
          Gentle gradients that keep the video clearly visible while ensuring hero text stays crisp. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black/65 z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-black/35 z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-primary-950/10 mix-blend-overlay z-10 pointer-events-none" />
    </div>
  );
}
