"use client";

export type ContactBarItem = {
  id: string;
  icon: string;
  text: string;
  link?: string;
};

type ContactBarProps = {
  enabled?: boolean;
  backgroundColor?: string;
  textColor?: string;
  items: ContactBarItem[];
};

export default function ContactBar({
  enabled = true,
  backgroundColor = "#f8f9fa",
  textColor = "#000000",
  items,
}: ContactBarProps) {
  if (!enabled || !items || items.length === 0) {
    return null;
  }

  return (
    <div
      className="py-2 px-6"
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-end gap-6 text-xs">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            {item.link ? (
              <a
                href={item.link}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </a>
            ) : (
              <>
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
