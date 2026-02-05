"use client";

import { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { backendBaseUrl } from "@/lib/urls";

const API_URL = backendBaseUrl;

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: { default: null },
    };
  },
});

type PostSummary = {
  id?: string;
  title: string;
  slug: string;
  status: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  seo?: {
    title?: string;
    description?: string;
    image?: string;
  };
  content?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
};

const emptyPost = (): PostSummary => ({
  title: "New Blog Post",
  slug: "new-blog-post",
  status: "draft",
  excerpt: "",
  coverImage: "",
  tags: [],
  seo: { title: "", description: "", image: "" },
  content: { type: "doc", content: [{ type: "paragraph" }] },
});

export default function BlogManager() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [activePost, setActivePost] = useState<PostSummary | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      Underline,
      TextStyle,
      Color,
      Link.configure({ openOnClick: false }),
      ResizableImage.configure({ inline: false }),
      Placeholder.configure({
        placeholder: "พิมพ์เนื้อหาบล็อกที่นี่...",
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: activePost?.content || emptyPost().content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none focus:outline-none prose-headings:text-slate-900 prose-p:text-slate-700",
      },
      handleDrop: (_view, event) => {
        if (!event.dataTransfer?.files?.length) return false;
        const file = event.dataTransfer.files[0];
        if (!file.type.startsWith("image/")) return false;
        event.preventDefault();
        uploadImage(file).then((url) => {
          if (url) {
            editor
              ?.chain()
              .focus()
              .setImage({ src: url })
              .updateAttributes("image", { style: "width: 100%; height: auto;" })
              .run();
          }
        });
        return true;
      },
    },
  });

  useEffect(() => {
    if (!editor || !activePost?.content) return;
    editor.commands.setContent(activePost.content);
  }, [activePost?.content, editor]);

  const imageWidth = useMemo(() => {
    if (!editor?.isActive("image")) return 100;
    const style = editor.getAttributes("image")?.style || "";
    const match = style.match(/width:\s*(\d+)%/);
    return match ? Number(match[1]) : 100;
  }, [editor, editor?.state]);

  const loadPosts = async () => {
    if (!API_URL) return;
    const response = await fetch(`${API_URL}/posts`);
    const data = await response.json();
    setPosts(data.posts || []);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const selectPost = async (post: PostSummary) => {
    if (!API_URL) return;
    const response = await fetch(`${API_URL}/posts/${post.slug}?preview=1`);
    const data = await response.json();
    setActivePost(data.post || post);
  };

  const createPost = () => {
    setActivePost(emptyPost());
  };

  const updatePost = (patch: Partial<PostSummary>) => {
    if (!activePost) return;
    setActivePost({ ...activePost, ...patch });
  };

  const savePost = async () => {
    if (!activePost || !API_URL || !editor) return;
    const payload = {
      title: activePost.title,
      slug: activePost.slug,
      status: activePost.status,
      excerpt: activePost.excerpt || "",
      coverImage: activePost.coverImage || "",
      tags: activePost.tags || [],
      seo: activePost.seo || {},
      content: editor.getJSON(),
    };
    const response = activePost.id
      ? await fetch(`${API_URL}/posts/${activePost.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch(`${API_URL}/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    const data = await response.json();
    if (data.post?.id) {
      setActivePost({ ...activePost, id: data.post.id });
      setStatusMessage("Saved");
      loadPosts();
      setTimeout(() => setStatusMessage(null), 1500);
    }
  };

  const deletePost = async () => {
    if (!activePost?.id) return;
    await fetch(`${API_URL}/posts/${activePost.id}`, { method: "DELETE" });
    setActivePost(null);
    loadPosts();
  };

  const uploadImage = async (file: File) => {
    if (!API_URL) return "";
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_URL}/uploads`, {
      method: "POST",
      body: formData,
    });
    setUploading(false);
    if (!response.ok) return "";
    const data = await response.json();
    return data.url as string;
  };

  const insertImage = async (file: File) => {
    const url = await uploadImage(file);
    if (url && editor) {
      editor
        .chain()
        .focus()
        .setImage({ src: url })
        .updateAttributes("image", { style: "width: 100%; height: auto;" })
        .run();
    }
  };

  const toolbarButtonClass = (active?: boolean) =>
    `inline-flex h-8 w-8 items-center justify-center rounded-md border text-xs font-semibold transition ${
      active
        ? "border-blue-700 bg-blue-700 text-white shadow-sm"
        : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:text-slate-900"
    }`;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Blog Posts</h2>
            <button
              onClick={createPost}
              className="rounded-full bg-blue-600 px-3 py-1 text-xs text-white shadow-sm"
            >
              New
            </button>
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => selectPost(post)}
                className={`rounded-2xl border px-3 py-2 text-left ${
                  activePost?.id === post.id
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-slate-200 bg-white"
                }`}
              >
                <p className="font-semibold text-slate-700">{post.title}</p>
                <p className="text-xs text-slate-400">/{post.slug}</p>
                <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                  {post.status}
                </span>
              </button>
            ))}
            {posts.length === 0 && (
              <p className="text-xs text-slate-400">No posts yet.</p>
            )}
          </div>
        </aside>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow">
          {!activePost ? (
            <p className="text-sm text-slate-500">
              เลือกโพสต์เพื่อแก้ไข หรือสร้างโพสต์ใหม่
            </p>
          ) : (
            <div className="grid gap-6">
              <header className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Blog Editor
                    </p>
                    <h2 className="text-2xl font-semibold text-slate-900">
                      {activePost.title}
                    </h2>
                    <p className="text-sm text-slate-500">/{activePost.slug}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={savePost}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-sm text-white shadow-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={deletePost}
                      className="rounded-full bg-rose-100 px-4 py-2 text-sm text-rose-700 shadow-sm"
                    >
                      Delete
                    </button>
                    {statusMessage && (
                      <span className="self-center text-sm font-semibold text-emerald-600">
                        {statusMessage}
                      </span>
                    )}
                  </div>
                </div>
              </header>

              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm text-slate-700">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Title
                    </span>
                    <input
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
                      value={activePost.title}
                      onChange={(event) =>
                        updatePost({ title: event.target.value })
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-slate-700">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Slug
                    </span>
                    <input
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
                      value={activePost.slug}
                      onChange={(event) =>
                        updatePost({ slug: event.target.value })
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-slate-700">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </span>
                    <select
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
                      value={activePost.status}
                      onChange={(event) =>
                        updatePost({ status: event.target.value })
                      }
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm text-slate-700">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Tags (comma separated)
                    </span>
                    <input
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
                      value={(activePost.tags || []).join(", ")}
                      onChange={(event) =>
                        updatePost({
                          tags: event.target.value
                            .split(",")
                            .map((tag) => tag.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </label>
                </div>
                <label className="grid gap-2 text-sm text-slate-700">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Excerpt
                  </span>
                  <textarea
                    className="min-h-[80px] rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
                    value={activePost.excerpt}
                    onChange={(event) =>
                      updatePost({ excerpt: event.target.value })
                    }
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm text-slate-700">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Cover Image URL
                    </span>
                    <input
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
                      value={activePost.coverImage || ""}
                      onChange={(event) =>
                        updatePost({ coverImage: event.target.value })
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-slate-700">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Upload Cover Image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const url = await uploadImage(file);
                        if (url) updatePost({ coverImage: url });
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800">
                  SEO Settings
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm text-slate-700">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      SEO Title
                    </span>
                    <input
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
                      value={activePost.seo?.title || ""}
                      onChange={(event) =>
                        updatePost({
                          seo: { ...activePost.seo, title: event.target.value },
                        })
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-slate-700">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      SEO Image
                    </span>
                    <input
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
                      value={activePost.seo?.image || ""}
                      onChange={(event) =>
                        updatePost({
                          seo: { ...activePost.seo, image: event.target.value },
                        })
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-slate-700">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Upload SEO Image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const url = await uploadImage(file);
                        if (url) {
                          updatePost({
                            seo: { ...activePost.seo, image: url },
                          });
                        }
                      }}
                    />
                  </label>
                </div>
                <label className="grid gap-2 text-sm text-slate-700">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    SEO Description
                  </span>
                  <textarea
                    className="min-h-[80px] rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
                    value={activePost.seo?.description || ""}
                    onChange={(event) =>
                      updatePost({
                        seo: {
                          ...activePost.seo,
                          description: event.target.value,
                        },
                      })
                    }
                  />
                </label>
              </div>

              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 shadow-sm"
                      value={
                        editor?.isActive("heading", { level: 2 })
                          ? "h2"
                          : editor?.isActive("heading", { level: 3 })
                            ? "h3"
                            : "p"
                      }
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value === "h2") {
                          editor?.chain().focus().setHeading({ level: 2 }).run();
                        } else if (value === "h3") {
                          editor?.chain().focus().setHeading({ level: 3 }).run();
                        } else {
                          editor?.chain().focus().setParagraph().run();
                        }
                      }}
                    >
                      <option value="p">Normal</option>
                      <option value="h2">Heading 2</option>
                      <option value="h3">Heading 3</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      className={toolbarButtonClass(editor?.isActive("bold"))}
                      aria-pressed={editor?.isActive("bold")}
                      title="Bold"
                    >
                      <span className="text-sm font-black">B</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                      className={toolbarButtonClass(editor?.isActive("italic"))}
                      aria-pressed={editor?.isActive("italic")}
                      title="Italic"
                    >
                      <span className="text-sm italic">I</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        editor?.chain().focus().toggleUnderline().run()
                      }
                      className={toolbarButtonClass(
                        editor?.isActive("underline")
                      )}
                      aria-pressed={editor?.isActive("underline")}
                      title="Underline"
                    >
                      <span className="text-sm underline">U</span>
                    </button>
                    <span className="h-6 w-px bg-slate-200" />
                    <button
                      type="button"
                      onClick={() =>
                        editor?.chain().focus().toggleBulletList().run()
                      }
                      className={toolbarButtonClass(
                        editor?.isActive("bulletList")
                      )}
                      aria-pressed={editor?.isActive("bulletList")}
                      title="Bullet List"
                    >
                      ••
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        editor?.chain().focus().toggleOrderedList().run()
                      }
                      className={toolbarButtonClass(
                        editor?.isActive("orderedList")
                      )}
                      aria-pressed={editor?.isActive("orderedList")}
                      title="Numbered List"
                    >
                      1.
                    </button>
                    <span className="h-6 w-px bg-slate-200" />
                    <button
                      type="button"
                      onClick={() =>
                        editor?.chain().focus().setTextAlign("left").run()
                      }
                      className={toolbarButtonClass(
                        editor?.isActive({ textAlign: "left" })
                      )}
                      aria-pressed={editor?.isActive({ textAlign: "left" })}
                      title="Align Left"
                    >
                      <span className="text-[10px]">L</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        editor?.chain().focus().setTextAlign("center").run()
                      }
                      className={toolbarButtonClass(
                        editor?.isActive({ textAlign: "center" })
                      )}
                      aria-pressed={editor?.isActive({ textAlign: "center" })}
                      title="Align Center"
                    >
                      <span className="text-[10px]">C</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        editor?.chain().focus().setTextAlign("right").run()
                      }
                      className={toolbarButtonClass(
                        editor?.isActive({ textAlign: "right" })
                      )}
                      aria-pressed={editor?.isActive({ textAlign: "right" })}
                      title="Align Right"
                    >
                      <span className="text-[10px]">R</span>
                    </button>
                    <span className="h-6 w-px bg-slate-200" />
                    <button
                      type="button"
                      onClick={() => {
                        const previous = editor?.getAttributes("link")?.href;
                        const url = window.prompt("Enter URL", previous || "");
                        if (url === null) return;
                        if (url === "") {
                          editor?.chain().focus().unsetLink().run();
                          return;
                        }
                        editor
                          ?.chain()
                          .focus()
                          .extendMarkRange("link")
                          .setLink({ href: url })
                          .run();
                      }}
                      className={toolbarButtonClass(editor?.isActive("link"))}
                      aria-pressed={editor?.isActive("link")}
                      title="Link"
                    >
                      <span className="text-[10px]">Link</span>
                    </button>
                    <label
                      className={`inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-300`}
                      title="Upload Image"
                    >
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) insertImage(file);
                        }}
                      />
                    </label>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                      className={toolbarButtonClass(
                        editor?.isActive("blockquote")
                      )}
                      aria-pressed={editor?.isActive("blockquote")}
                      title="Quote"
                    >
                      <span className="text-sm">"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                      className={toolbarButtonClass(
                        editor?.isActive("codeBlock")
                      )}
                      aria-pressed={editor?.isActive("codeBlock")}
                      title="Code Block"
                    >
                      <span className="text-[10px]">{"</>"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                      className={toolbarButtonClass(false)}
                      title="Divider"
                    >
                      <span className="text-[10px]">HR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        editor?.chain().focus().unsetAllMarks().clearNodes().run()
                      }
                      className={toolbarButtonClass(false)}
                      title="Clear Formatting"
                    >
                      <span className="text-[10px]">Tx</span>
                    </button>
                    <span className="h-6 w-px bg-slate-200" />
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().undo().run()}
                      className={toolbarButtonClass(false)}
                      title="Undo"
                    >
                      <span className="text-[10px]">Undo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().redo().run()}
                      className={toolbarButtonClass(false)}
                      title="Redo"
                    >
                      <span className="text-[10px]">Redo</span>
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    {editor?.isActive("image") && (
                      <div className="flex items-center gap-2">
                        <span>Image width</span>
                        <input
                          type="range"
                          min={30}
                          max={100}
                          value={imageWidth}
                          onChange={(event) =>
                            editor.commands.updateAttributes("image", {
                              style: `width: ${event.target.value}%; height: auto;`,
                            })
                          }
                        />
                        <span>{imageWidth}%</span>
                      </div>
                    )}
                    {uploading && (
                      <span className="text-xs text-slate-400">Uploading...</span>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-inner focus-within:ring-2 focus-within:ring-blue-500">
                  <EditorContent
                    editor={editor}
                    className="min-h-[320px]"
                  />
                </div>
              </div>
            </div>
          )}
        </section>
    </div>
  );
}
