"use client";

import Link from "next/link";
import Image from "next/image";
import { resolveUploadUrl } from "@/lib/urls";

type HeroImagesWithButtonProps = {
  backgroundImage?: string;
  overlayOpacity?: number;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
  buttonColor?: string;
  buttonTextColor?: string;
};

export default function HeroImagesWithButton(props: HeroImagesWithButtonProps) {
  const {
    backgroundImage = "",
    overlayOpacity = 0.5,
    title = "BUILT FOR THE UNBREAKABLE™",
    description = "",
    buttonText = "LEARN MORE",
    buttonHref = "#",
    buttonColor = "#f59e0b",
    buttonTextColor = "#000000",
  } = props;

  const resolvedImage = backgroundImage ? resolveUploadUrl(backgroundImage) : "";
  const isExternalLink = buttonHref.startsWith("http");

  return (
    <section className="relative min-h-[320px] overflow-hidden sm:min-h-[420px] md:min-h-[520px] lg:min-h-[600px]">
      {/* Background Image */}
      {resolvedImage ? (
        <Image
          src={resolvedImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          unoptimized={resolvedImage.includes("localhost")}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-800" />
      )}

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity }}
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-[320px] flex-col items-center justify-end px-4 pt-10 pb-8 text-center text-white sm:min-h-[420px] sm:px-6 sm:pt-16 sm:pb-12 md:min-h-[520px] md:pt-20 md:pb-16 lg:min-h-[600px]">
        <h1 className="max-w-[720px] text-2xl font-bold uppercase tracking-wide sm:text-3xl md:text-4xl lg:text-5xl">
          {title}
        </h1>

        {description && (
          <p className="mt-4 max-w-xl text-xs text-slate-200 sm:mt-6 sm:max-w-2xl sm:text-base md:text-lg">
            {description}
          </p>
        )}

        {buttonText && (
          <>
            {isExternalLink ? (
              <a
                href={buttonHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90 hover:scale-105 sm:mt-8 sm:px-8 sm:py-3 sm:text-sm"
                style={{ backgroundColor: buttonColor, color: buttonTextColor }}
              >
                {buttonText}
              </a>
            ) : (
              <Link
                href={buttonHref}
                className="mt-6 inline-block rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90 hover:scale-105 sm:mt-8 sm:px-8 sm:py-3 sm:text-sm"
                style={{ backgroundColor: buttonColor, color: buttonTextColor }}
              >
                {buttonText}
              </Link>
            )}
          </>
        )}
      </div>
    </section>
  );
}
