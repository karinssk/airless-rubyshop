"use client";

import { useEffect, useState } from "react";
import FooterPreview from "./FooterPreview";
import { backendBaseUrl } from "@/lib/urls";

const API_URL = backendBaseUrl;

type FooterLink = {
  id: string;
  label: string;
  href: string;
};

type FooterSocial = {
  id: string;
  label: string;
  href: string;
  icon: string;
};

type FooterContact = {
  id: string;
  label: string;
  value: string;
  href: string;
  icon: string;
};

type FooterData = {
  name: string;
  backgroundColor: string;
  brand: {
    name: string;
    description: string;
    logoUrl: string;
  };
  social: FooterSocial[];
  services: FooterLink[];
  menu: FooterLink[];
  contact: FooterContact[];
  copyright: string;
  subfooter: string;
};

const emptyFooter: FooterData = {
  name: "main",
  backgroundColor: "#0b3c86",
  brand: { name: "", description: "", logoUrl: "" },
  social: [],
  services: [],
  menu: [],
  contact: [],
  copyright: "",
  subfooter: "",
};

export default function FooterBuilder() {
  const [footer, setFooter] = useState<FooterData>(emptyFooter);
  const [message, setMessage] = useState<string | null>(null);

  const loadFooter = async () => {
    const response = await fetch(`${API_URL}/footer`);
    const data = await response.json();
    setFooter(data.footer || emptyFooter);
  };

  useEffect(() => {
    loadFooter();
  }, []);

  const updateFooter = (patch: Partial<FooterData>) => {
    setFooter({ ...footer, ...patch });
  };

  const updateBrand = (patch: Partial<FooterData["brand"]>) => {
    setFooter({ ...footer, brand: { ...footer.brand, ...patch } });
  };

  const updateListItem = <T extends { id: string }, K extends keyof T>(
    list: T[],
    index: number,
    key: K,
    value: T[K]
  ) => {
    const next = [...list];
    next[index] = { ...next[index], [key]: value };
    return next;
  };

  const removeListItem = <T extends { id: string }>(list: T[], index: number) => {
    const next = [...list];
    next.splice(index, 1);
    return next;
  };

  const addLink = (list: FooterLink[]) => [
    ...list,
    { id: crypto.randomUUID(), label: "New Item", href: "/" },
  ];

  const addSocial = (list: FooterSocial[]) => [
    ...list,
    {
      id: crypto.randomUUID(),
      label: "New Social",
      href: "https://",
      icon: "",
    },
  ];

  const addContact = (list: FooterContact[]) => [
    ...list,
    {
      id: crypto.randomUUID(),
      label: "Label",
      value: "",
      href: "",
      icon: "",
    },
  ];

  const saveFooter = async () => {
    const response = await fetch(`${API_URL}/footer`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(footer),
    });
    if (response.ok) {
      setMessage("Saved");
      setTimeout(() => setMessage(null), 1200);
    }
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_URL}/uploads`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Upload failed");
    const data = await response.json();
    return data.url as string;
  };

  return (
    <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Footer</h2>
          <p className="text-xs text-slate-400">
            ใช้สำหรับทุกหน้าบนเว็บไซต์
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={saveFooter}
            className="rounded-full bg-emerald-600 px-4 py-2 text-xs text-white"
          >
            Save
          </button>
          {message && (
            <span className="text-xs text-emerald-600">{message}</span>
          )}
        </div>
      </header>

      <div className="mt-8 grid gap-8">
        <section className="grid gap-4">
          <h3 className="text-sm font-semibold text-slate-700">
            Live Preview
          </h3>
          <FooterPreview
            footer={footer}
            onBrandChange={(key, value) => updateBrand({ [key]: value })}
            onFooterTextChange={(key, value) =>
              updateFooter({ [key]: value })
            }
            onListChange={(section, index, key, value) =>
              updateFooter({
                [section]: updateListItem(footer[section], index, key, value),
              } as Partial<FooterData>)
            }
            onContactChange={(index, key, value) =>
              updateFooter({
                contact: updateListItem(footer.contact, index, key, value),
              })
            }
          />
        </section>
        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-sm font-semibold text-slate-700">Brand</h3>
          <div className="grid gap-3 text-xs text-slate-600 md:grid-cols-2">
            <label className="grid gap-1">
              Brand Name
              <input
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={footer.brand.name}
                onChange={(event) => updateBrand({ name: event.target.value })}
              />
            </label>
            <label className="grid gap-1">
              Logo URL
              <input
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={footer.brand.logoUrl}
                onChange={(event) =>
                  updateBrand({ logoUrl: event.target.value })
                }
              />
            </label>
            <label className="grid gap-1">
              Upload Logo
              <input
                type="file"
                accept="image/*"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const url = await uploadImage(file);
                  updateBrand({ logoUrl: url });
                }}
              />
            </label>
            <label className="grid gap-1 md:col-span-2">
              Description
              <textarea
                className="min-h-[80px] rounded-xl border border-slate-200 px-3 py-2"
                value={footer.brand.description}
                onChange={(event) =>
                  updateBrand({ description: event.target.value })
                }
              />
            </label>
            <label className="grid gap-1">
              Background Color
              <input
                type="color"
                className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
                value={footer.backgroundColor}
                onChange={(event) =>
                  updateFooter({ backgroundColor: event.target.value })
                }
              />
            </label>
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Social</h3>
            <button
              onClick={() => updateFooter({ social: addSocial(footer.social) })}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
            >
              + Add
            </button>
          </div>
          <div className="grid gap-3">
            {footer.social.map((item, index) => (
              <div
                key={item.id}
                className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600"
              >
                <div className="grid gap-2 md:grid-cols-3">
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={item.label}
                    onChange={(event) =>
                      updateFooter({
                        social: updateListItem(
                          footer.social,
                          index,
                          "label",
                          event.target.value
                        ),
                      })
                    }
                    placeholder="Label"
                  />
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={item.href}
                    onChange={(event) =>
                      updateFooter({
                        social: updateListItem(
                          footer.social,
                          index,
                          "href",
                          event.target.value
                        ),
                      })
                    }
                    placeholder="https://"
                  />
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={item.icon}
                    onChange={(event) =>
                      updateFooter({
                        social: updateListItem(
                          footer.social,
                          index,
                          "icon",
                          event.target.value
                        ),
                      })
                    }
                    placeholder="Icon URL"
                  />
                </div>
                <label className="grid gap-1">
                  Upload Icon
                  <input
                    type="file"
                    accept="image/*"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const url = await uploadImage(file);
                      updateFooter({
                        social: updateListItem(
                          footer.social,
                          index,
                          "icon",
                          url
                        ),
                      });
                    }}
                  />
                </label>
                <button
                  onClick={() =>
                    updateFooter({
                      social: removeListItem(footer.social, index),
                    })
                  }
                  className="ml-auto rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
                >
                  Delete
                </button>
              </div>
            ))}
            {footer.social.length === 0 && (
              <p className="text-xs text-slate-400">No social links yet.</p>
            )}
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Services</h3>
            <button
              onClick={() => updateFooter({ services: addLink(footer.services) })}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
            >
              + Add
            </button>
          </div>
          <div className="grid gap-3">
            {footer.services.map((item, index) => (
              <div
                key={item.id}
                className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600"
              >
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={item.label}
                    onChange={(event) =>
                      updateFooter({
                        services: updateListItem(
                          footer.services,
                          index,
                          "label",
                          event.target.value
                        ),
                      })
                    }
                    placeholder="Label"
                  />
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={item.href}
                    onChange={(event) =>
                      updateFooter({
                        services: updateListItem(
                          footer.services,
                          index,
                          "href",
                          event.target.value
                        ),
                      })
                    }
                    placeholder="/slug"
                  />
                </div>
                <button
                  onClick={() =>
                    updateFooter({
                      services: removeListItem(footer.services, index),
                    })
                  }
                  className="ml-auto rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
                >
                  Delete
                </button>
              </div>
            ))}
            {footer.services.length === 0 && (
              <p className="text-xs text-slate-400">No services yet.</p>
            )}
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Main Menu</h3>
            <button
              onClick={() => updateFooter({ menu: addLink(footer.menu) })}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
            >
              + Add
            </button>
          </div>
          <div className="grid gap-3">
            {footer.menu.map((item, index) => (
              <div
                key={item.id}
                className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600"
              >
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={item.label}
                    onChange={(event) =>
                      updateFooter({
                        menu: updateListItem(
                          footer.menu,
                          index,
                          "label",
                          event.target.value
                        ),
                      })
                    }
                    placeholder="Label"
                  />
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={item.href}
                    onChange={(event) =>
                      updateFooter({
                        menu: updateListItem(
                          footer.menu,
                          index,
                          "href",
                          event.target.value
                        ),
                      })
                    }
                    placeholder="/slug"
                  />
                </div>
                <button
                  onClick={() =>
                    updateFooter({
                      menu: removeListItem(footer.menu, index),
                    })
                  }
                  className="ml-auto rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
                >
                  Delete
                </button>
              </div>
            ))}
            {footer.menu.length === 0 && (
              <p className="text-xs text-slate-400">No menu links yet.</p>
            )}
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Contact</h3>
            <button
              onClick={() => updateFooter({ contact: addContact(footer.contact) })}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
            >
              + Add
            </button>
          </div>
          <div className="grid gap-3">
            {footer.contact.map((item, index) => (
              <div
                key={item.id}
                className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600"
              >
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={item.label}
                    onChange={(event) =>
                      updateFooter({
                        contact: updateListItem(
                          footer.contact,
                          index,
                          "label",
                          event.target.value
                        ),
                      })
                    }
                    placeholder="Label"
                  />
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={item.value}
                    onChange={(event) =>
                      updateFooter({
                        contact: updateListItem(
                          footer.contact,
                          index,
                          "value",
                          event.target.value
                        ),
                      })
                    }
                    placeholder="Value"
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={item.href}
                    onChange={(event) =>
                      updateFooter({
                        contact: updateListItem(
                          footer.contact,
                          index,
                          "href",
                          event.target.value
                        ),
                      })
                    }
                    placeholder="mailto: / tel: / https://"
                  />
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={item.icon}
                    onChange={(event) =>
                      updateFooter({
                        contact: updateListItem(
                          footer.contact,
                          index,
                          "icon",
                          event.target.value
                        ),
                      })
                    }
                    placeholder="Icon URL"
                  />
                </div>
                <label className="grid gap-1">
                  Upload Icon
                  <input
                    type="file"
                    accept="image/*"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const url = await uploadImage(file);
                      updateFooter({
                        contact: updateListItem(
                          footer.contact,
                          index,
                          "icon",
                          url
                        ),
                      });
                    }}
                  />
                </label>
                <button
                  onClick={() =>
                    updateFooter({
                      contact: removeListItem(footer.contact, index),
                    })
                  }
                  className="ml-auto rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
                >
                  Delete
                </button>
              </div>
            ))}
            {footer.contact.length === 0 && (
              <p className="text-xs text-slate-400">No contacts yet.</p>
            )}
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-sm font-semibold text-slate-700">Footer Text</h3>
          <div className="grid gap-3 text-xs text-slate-600 md:grid-cols-2">
            <label className="grid gap-1">
              Copyright
              <input
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={footer.copyright}
                onChange={(event) =>
                  updateFooter({ copyright: event.target.value })
                }
              />
            </label>
            <label className="grid gap-1">
              Subfooter
              <input
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={footer.subfooter}
                onChange={(event) =>
                  updateFooter({ subfooter: event.target.value })
                }
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
