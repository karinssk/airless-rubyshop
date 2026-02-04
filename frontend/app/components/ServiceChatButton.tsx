"use client";

type ServiceChatButtonProps = {
  title: string;
  slug: string;
  price?: string;
  qty?: number;
  className?: string;
  label?: string;
  message?: string;
};

export default function ServiceChatButton({
  title,
  slug,
  price,
  qty = 1,
  className,
  label = "แชทสอบถาม",
  message,
}: ServiceChatButtonProps) {
  const handleClick = () => {
    if (typeof window === "undefined") return;
    const finalMessage =
      message ||
      `สนใจบริการ: ${title}${price ? ` (${price})` : ""}\nรายละเอียด: จำนวน ${qty} ครั้ง ราคา ${price || "สอบถามราคา"}`;
    window.dispatchEvent(
      new CustomEvent("openChat", { detail: { message: finalMessage } })
    );
  };

  return (
    <button onClick={handleClick} className={className}>
      {label}
    </button>
  );
}
