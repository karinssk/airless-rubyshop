"use client";

import { useEffect, useRef } from "react";
import type Hls from "hls.js";

type HlsVideoPlayerProps = {
  src?: string;
  poster?: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  autoPlayOnView?: boolean;
  muted?: boolean;
  loop?: boolean;
};

export default function HlsVideoPlayer({
  src,
  poster,
  className,
  controls = true,
  autoPlay = false,
  autoPlayOnView = false,
  muted = false,
  loop = false,
}: HlsVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return undefined;
    }

    let cancelled = false;
    import("hls.js").then(({ default: Hls }) => {
      if (cancelled || !video) return;
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true });
        hls.loadSource(src);
        hls.attachMedia(video);
        hlsRef.current = hls;
      } else {
        video.src = src;
      }
    });

    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoPlayOnView) return undefined;

    const handleVisibility = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (!video) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          video.play().catch(() => null);
        } else {
          video.pause();
        }
      });
    };

    const observer = new IntersectionObserver(handleVisibility, {
      threshold: [0, 0.2, 0.35, 0.5, 1],
    });

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [autoPlayOnView]);

  const effectiveMuted = muted || autoPlayOnView;

  return (
    <video
      ref={videoRef}
      className={className}
      poster={poster}
      controls={controls}
      autoPlay={autoPlay}
      muted={effectiveMuted}
      loop={loop}
      playsInline
      preload="metadata"
    />
  );
}
