"use client";

import dynamic from "next/dynamic";

const DeferredPopupImage = dynamic(() => import("./PopupImage"), {
  ssr: false,
  loading: () => null,
});

export default DeferredPopupImage;
