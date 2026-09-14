"use client";

import * as React from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Film } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface StoryVideo {
  id: string;
  title: string;
  category: string;
  description: string;
  videoUrl: string;
  posterUrl?: string;
}

interface StoryVideoCardProps {
  video: StoryVideo;
}

function getYouTubeEmbedUrl(url: string) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://www.youtube-nocookie.com/embed/${match[2]}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
    : null;
}

export function StoryVideoCard({ video }: StoryVideoCardProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [hasStarted, setHasStarted] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const youtubeEmbed = getYouTubeEmbedUrl(video.videoUrl);

  const fallbackPoster =
    video.posterUrl ||
    "https://gjtfoundation.com/wp-content/uploads/2025/06/WhatsApp-Image-2022-08-21-at-10.32.19-PM-1.jpeg";

  const handleStartPlayback = (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setHasStarted(true);

    if (!youtubeEmbed && videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn("Mobile autoplay failed, enabling native controls:", err);
            if (videoRef.current) {
              videoRef.current.controls = true;
            }
          });
      }
    }
  };

  return (
    <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group">
      {/* Video Container */}
      <div className="relative aspect-[16/10] w-full bg-slate-900 overflow-hidden flex items-center justify-center">
        {youtubeEmbed && hasStarted ? (
          <iframe
            src={youtubeEmbed}
            title={video.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            src={video.videoUrl}
            poster={fallbackPoster}
            controls={hasStarted}
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onError={() => setHasError(true)}
          />
        )}

        {/* Custom Video Thumbnail & Play Overlay before user starts playback */}
        {!hasStarted && (
          <div
            onClick={handleStartPlayback}
            onTouchEnd={handleStartPlayback}
            role="button"
            tabIndex={0}
            aria-label={`Play ${video.title}`}
            className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center p-4 bg-black/40 hover:bg-black/50 active:bg-black/60 transition-colors duration-300 z-10 select-none"
          >
            {/* Pulsing glow ring around play button */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-20 h-20 rounded-full bg-white/20 animate-ping" />
              <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white/95 text-primary-700 shadow-2xl flex items-center justify-center pl-1 group-hover:scale-110 group-hover:bg-white active:scale-95 transition-all duration-300 border-2 border-white">
                <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-primary-700 text-primary-700" />
              </div>
            </div>

            <div className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white font-bold text-xs tracking-wider uppercase border border-white/20 shadow-lg">
              <Film className="w-3.5 h-3.5 text-primary-400" />
              <span>Watch Video Story</span>
            </div>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-4 text-center z-20 text-white">
            <p className="text-sm font-semibold text-amber-300 mb-2">Video playback could not be loaded</p>
            <p className="text-xs text-slate-300 mb-3">Please check your internet connection or try again.</p>
            <button
              onClick={() => {
                setHasError(false);
                setHasStarted(false);
              }}
              className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-xs font-bold rounded-lg"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Video Metadata & Description */}
      <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200/80 text-xs font-bold uppercase tracking-wider">
              <Film className="w-3.5 h-3.5 text-primary-600" />
              {video.category}
            </span>
          </div>

          <h3 className="text-xl font-bold font-heading text-slate-900 leading-snug">
            {video.title}
          </h3>

          <p className="text-sm text-slate-600 leading-relaxed">
            {video.description}
          </p>
        </div>
      </div>
    </div>
  );
}
