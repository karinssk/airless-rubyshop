export const safeText = (value?: string) => (value ? String(value) : "");

export const toLine = (value?: string) => (value ? String(value) : "");

export const formatItems = (type: string, props: Record<string, unknown>) => {
  if (type === "services") {
    const items = (props.items as Array<Record<string, string>>) || [];
    return items
      .map((item) =>
        [item.title, item.description, item.price, item.ctaText, item.ctaHref]
          .map(toLine)
          .join(" | ")
      )
      .join("\n");
  }
  if (type === "our-services-v2") {
    const items = (props.items as Array<Record<string, string>>) || [];
    return items
      .map((item) =>
        [item.image, item.title, item.description, item.ctaText, item.ctaHref]
          .map(toLine)
          .join(" | ")
      )
      .join("\n");
  }
  if (type === "features") {
    const items = (props.items as Array<Record<string, string>>) || [];
    return items.map((item) => toLine(item.text)).join("\n");
  }
  if (type === "gallery") {
    const items = (props.images as Array<Record<string, string>>) || [];
    return items
      .map((item) => [item.url, item.caption].map(toLine).join(" | "))
      .join("\n");
  }
  if (type === "faq" || type === "frequently-asked-questions") {
    const items = (props.items as Array<Record<string, string>>) || [];
    return items
      .map((item) => [item.question, item.answer].map(toLine).join(" | "))
      .join("\n");
  }
  return "";
};

export const parseItems = (type: string, text: string) => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (type === "services") {
    return lines.map((line) => {
      const [title, description, price, ctaText, ctaHref] = line
        .split("|")
        .map((v) => v.trim());
      return { title, description, price, ctaText, ctaHref };
    });
  }
  if (type === "our-services-v2") {
    return lines.map((line) => {
      const [image, title, description, ctaText, ctaHref] = line
        .split("|")
        .map((v) => v.trim());
      return { image, title, description, ctaText, ctaHref };
    });
  }

  if (type === "features") {
    return lines.map((line) => ({ text: line }));
  }

  if (type === "gallery") {
    return lines.map((line) => {
      const [url, caption] = line.split("|").map((v) => v.trim());
      return { url, caption };
    });
  }

  if (type === "faq" || type === "frequently-asked-questions") {
    return lines.map((line) => {
      const [question, answer] = line.split("|").map((v) => v.trim());
      return { question, answer };
    });
  }

  return [];
};
