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
    <section className="relative min-h-[500px] overflow-hidden md:min-h-[600px]">
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
      <div className="relative z-10 flex min-h-[500px] flex-col items-center justify-end px-6 pt-16 pb-14 text-center text-white md:min-h-[600px] md:pt-24 md:pb-20">
        <h1 className="max-w-4xl text-3xl font-bold uppercase tracking-wide sm:text-4xl md:text-5xl lg:text-6xl">
          {title}
        </h1>

        {description && (
          <p className="mt-6 max-w-2xl text-sm text-slate-200 sm:text-base md:text-lg">
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
                className="mt-8 inline-block rounded-full px-8 py-3 text-sm font-bold uppercase tracking-wider transition-all hover:opacity-90 hover:scale-105"
                style={{ backgroundColor: buttonColor, color: buttonTextColor }}
              >
                {buttonText}
              </a>
            ) : (
              <Link
                href={buttonHref}
                className="mt-8 inline-block rounded-full px-8 py-3 text-sm font-bold uppercase tracking-wider transition-all hover:opacity-90 hover:scale-105"
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
