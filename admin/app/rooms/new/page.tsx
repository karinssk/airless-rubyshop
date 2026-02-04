"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { backendBaseUrl } from "@/lib/urls";
import ImageUpload from "@/components/ImageUpload";
import MultipleImageUpload from "@/components/MultipleImageUpload";

const API_URL = backendBaseUrl;

type RoomCategory = {
  id: string;
  name: { th: string; en: string } | string;
  slug: string;
};

const facilityCategories = [
  "bathroomFeatures",
  "climateControl",
  "entertainment",
  "generalAmenities",
  "internet",
  "kitchenFeatures",
  "roomFeatures",
];

const facilityLabels: Record<string, string> = {
  bathroomFeatures: "Bathroom Features",
  climateControl: "Climate Control",
  entertainment: "Entertainment",
  generalAmenities: "General Amenities",
  internet: "Internet",
  kitchenFeatures: "Kitchen Features",
  roomFeatures: "Room Features & Facilities",
};

export default function NewRoomPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"th" | "en">("en");

  // Form state
  const [nameEn, setNameEn] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [categoryId, setCategoryId] = useState("");
  const [maxGuests, setMaxGuests] = useState(2);
  const [size, setSize] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionTh, setDescriptionTh] = useState("");
  const [shortDescriptionEn, setShortDescriptionEn] = useState("");
  const [shortDescriptionTh, setShortDescriptionTh] = useState("");
  const [pricePerNight, setPricePerNight] = useState(0);
  const [pricePerMonth, setPricePerMonth] = useState(0);
  const [totalRooms, setTotalRooms] = useState(1);
  const [coverImage, setCoverImage] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [beddingOptions, setBeddingOptions] = useState([{ type: "", description: "" }]);
  const [facilities, setFacilities] = useState<Record<string, string[]>>({
    bathroomFeatures: [],
    climateControl: [],
    entertainment: [],
    generalAmenities: [],
    internet: [],
    kitchenFeatures: [],
    roomFeatures: [],
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/room-categories`);
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameEnChange = (value: string) => {
    setNameEn(value);
    if (!slug) {
      setSlug(generateSlug(value));
    }
  };

  const handleAddBeddingOption = () => {
    setBeddingOptions([...beddingOptions, { type: "", description: "" }]);
  };

  const handleRemoveBeddingOption = (index: number) => {
    setBeddingOptions(beddingOptions.filter((_, i) => i !== index));
  };

  const handleBeddingChange = (index: number, field: "type" | "description", value: string) => {
    const updated = [...beddingOptions];
    updated[index][field] = value;
    setBeddingOptions(updated);
  };

  const handleAddFacility = (category: string) => {
    const item = prompt(`Add ${facilityLabels[category]}:`);
    if (item && item.trim()) {
      setFacilities({
        ...facilities,
        [category]: [...(facilities[category] || []), item.trim()],
      });
    }
  };

  const handleRemoveFacility = (category: string, index: number) => {
    setFacilities({
      ...facilities,
      [category]: facilities[category].filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: { th: nameTh, en: nameEn },
        slug,
        status,
        categoryId: categoryId || null,
        maxGuests,
        size,
        description: { th: descriptionTh, en: descriptionEn },
        shortDescription: { th: shortDescriptionTh, en: shortDescriptionEn },
        pricePerNight,
        pricePerMonth,
        totalRooms,
        coverImage,
        gallery,
        beddingOptions: beddingOptions.filter((opt) => opt.type.trim()),
        facilities,
        seo: {
          title: { th: nameTh, en: nameEn },
          description: { th: shortDescriptionTh, en: shortDescriptionEn },
          image: coverImage,
        },
      };

      const res = await fetch(`${API_URL}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Room created successfully!");
        router.push("/rooms");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create room");
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Failed to create room");
    } finally {
      setSaving(false);
    }
  };

  const getCategoryName = (name: any) => {
    if (typeof name === "string") return name;
    return name?.en || name?.th || "";
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <button
          onClick={() => router.push("/rooms")}
          className="mb-4 text-blue-600 hover:text-blue-700"
        >
          ← Back to rooms
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Create New Room</h1>
        <p className="text-sm text-slate-500">Add a new room type to your inventory</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Language Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("en")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              activeTab === "en"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            🇬🇧 English
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("th")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              activeTab === "th"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            🇹🇭 Thai
          </button>
        </div>

        {/* Basic Info */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Basic Information</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Room Name ({activeTab === "en" ? "English" : "Thai"}) *
              </label>
              {activeTab === "en" ? (
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => handleNameEnChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="Deluxe Room with Twin Beds"
                  required
                />
              ) : (
                <input
                  type="text"
                  value={nameTh}
                  onChange={(e) => setNameTh(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="ห้องดีลักซ์ เตียงแฝด"
                />
              )}
            </div>

            {/* Slug */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Slug (URL) *
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                placeholder="deluxe-twin-beds"
                required
              />
            </div>

            {/* Status */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {getCategoryName(cat.name)}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Guests */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Max Guests *
              </label>
              <input
                type="number"
                value={maxGuests}
                onChange={(e) => setMaxGuests(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                min="1"
                required
              />
            </div>

            {/* Size */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Room Size
              </label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                placeholder="32 sq mtr"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Description ({activeTab === "en" ? "English" : "Thai"})
              </label>
              {activeTab === "en" ? (
                <textarea
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                  rows={4}
                  placeholder="A quiet space where light filters through..."
                />
              ) : (
                <textarea
                  value={descriptionTh}
                  onChange={(e) => setDescriptionTh(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                  rows={4}
                />
              )}
            </div>

            {/* Short Description */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Short Description ({activeTab === "en" ? "English" : "Thai"})
              </label>
              {activeTab === "en" ? (
                <input
                  type="text"
                  value={shortDescriptionEn}
                  onChange={(e) => setShortDescriptionEn(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="Deluxe twin room for 3 guests"
                />
              ) : (
                <input
                  type="text"
                  value={shortDescriptionTh}
                  onChange={(e) => setShortDescriptionTh(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                />
              )}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Pricing</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Price per Night (฿) *
              </label>
              <input
                type="number"
                value={pricePerNight}
                onChange={(e) => setPricePerNight(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                min="0"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Price per Month (฿)
              </label>
              <input
                type="number"
                value={pricePerMonth}
                onChange={(e) => setPricePerMonth(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                min="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Total Rooms *
              </label>
              <input
                type="number"
                value={totalRooms}
                onChange={(e) => setTotalRooms(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                min="1"
                required
              />
            </div>
          </div>
        </div>

        {/* Cover Image */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Cover Image</h2>
          <ImageUpload
            value={coverImage}
            onChange={setCoverImage}
            label="Room Cover Image"
            helperText="Upload a high-quality image of the room (max 5MB, will be converted to WebP)"
          />
        </div>

        {/* Gallery Images */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Gallery Images</h2>
          <MultipleImageUpload
            value={gallery}
            onChange={setGallery}
            label="Room Gallery"
            helperText="Upload multiple images to showcase the room (max 5MB each, up to 10 images)"
            maxImages={10}
          />
        </div>

        {/* Bedding Options */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Bedding Options</h2>
            <button
              type="button"
              onClick={handleAddBeddingOption}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add Option
            </button>
          </div>
          <div className="space-y-3">
            {beddingOptions.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={option.type}
                  onChange={(e) => handleBeddingChange(index, "type", e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="2 Queens or 2 Single"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveBeddingOption(index)}
                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Facilities */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Facilities</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {facilityCategories.map((category) => (
              <div key={category} className="rounded-lg border border-slate-100 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">
                    {facilityLabels[category]}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleAddFacility(category)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add
                  </button>
                </div>
                <ul className="space-y-1">
                  {(facilities[category] || []).map((item, index) => (
                    <li key={index} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">• {item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFacility(category, index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Room"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/rooms")}
            className="rounded-lg border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
