"use client";

import dynamic from "next/dynamic";

const DeferredChatWidget = dynamic(() => import("./ChatWidget"), {
  ssr: false,
  loading: () => null,
});

export default DeferredChatWidget;
