import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { backendBaseUrl } from "@/lib/urls";

type BlogContentProps = {
  content: Record<string, any>;
};

export default function BlogContent({ content }: BlogContentProps) {
  const html = generateHTML(content, [
    StarterKit.configure({ link: false }),
    Link.configure({ openOnClick: false }),
    Image,
    TextStyle,
    Color,
  ]);
  const normalizedHtml = html.replace(
    /src="(\/?uploads\/[^"]+)"/g,
    (_match, path) => `src="${backendBaseUrl}/${path.replace(/^\//, "")}"`
  );

  return (
    <div
      className="blog-content"
      dangerouslySetInnerHTML={{ __html: normalizedHtml }}
    />
  );
}
