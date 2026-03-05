"use client";

import { useEffect, useState } from "react";
import { backendBaseUrl } from "@/lib/urls";

type Submission = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  service: string;
  details: string;
  status: string;
  createdAt: string;
};

const API_URL = backendBaseUrl;

export default function FormsSubmittedPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [active, setActive] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingActiveLine, setSendingActiveLine] = useState(false);
  const [sendingCustomLine, setSendingCustomLine] = useState(false);
  const [lineMessage, setLineMessage] = useState("");
  const [lineStatus, setLineStatus] = useState<string | null>(null);

  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : "Unknown error";

  const loadItems = async () => {
    if (!API_URL) return;
    setLoading(true);
    const response = await fetch(`${API_URL}/forms/quotation`);
    const data = await response.json();
    setItems(data.submissions || []);
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openItem = async (item: Submission) => {
    setActive(item);
    if (item.status !== "read") {
      await fetch(`${API_URL}/forms/quotation/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "read" }),
      });
      loadItems();
    }
  };

  const deleteItem = async (id: string) => {
    await fetch(`${API_URL}/forms/quotation/${id}`, { method: "DELETE" });
    if (active?.id === id) setActive(null);
    loadItems();
  };

  const sendTestLine = async () => {
    if (!API_URL) return;
    try {
      setSendingTest(true);
      setLineStatus(null);
      const response = await fetch(`${API_URL}/forms/line/test`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to send test message");
      }
      setLineStatus("ส่งข้อความทดสอบไป LINE เรียบร้อยแล้ว");
    } catch (error) {
      setLineStatus(`ส่งข้อความทดสอบไม่สำเร็จ: ${getErrorMessage(error)}`);
    } finally {
      setSendingTest(false);
    }
  };

  const sendActiveToLine = async () => {
    if (!API_URL || !active) return;
    try {
      setSendingActiveLine(true);
      setLineStatus(null);
      const response = await fetch(`${API_URL}/forms/quotation/${active.id}/notify-line`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to send submission to LINE");
      }
      setLineStatus("ส่งรายละเอียดรายการนี้ไป LINE เรียบร้อยแล้ว");
    } catch (error) {
      setLineStatus(`ส่งไป LINE ไม่สำเร็จ: ${getErrorMessage(error)}`);
    } finally {
      setSendingActiveLine(false);
    }
  };

  const sendCustomLineMessage = async () => {
    if (!API_URL || !lineMessage.trim()) return;
    try {
      setSendingCustomLine(true);
      setLineStatus(null);
      const response = await fetch(`${API_URL}/forms/line/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: lineMessage.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to send LINE message");
      }
      setLineStatus("ส่งข้อความไป LINE เรียบร้อยแล้ว");
      setLineMessage("");
    } catch (error) {
      setLineStatus(`ส่งข้อความไม่สำเร็จ: ${getErrorMessage(error)}`);
    } finally {
      setSendingCustomLine(false);
    }
  };

  return (
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                Forms Submitted
              </h2>
              <p className="text-xs text-slate-500">
                ข้อมูลคำขอใบเสนอราคาที่ส่งเข้ามา
              </p>
            </div>
            <button
              onClick={loadItems}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs"
            >
              Refresh
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={sendTestLine}
              disabled={sendingTest}
              className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 disabled:opacity-60"
            >
              {sendingTest ? "Sending test..." : "Send Test to LINE"}
            </button>
          </div>
          {lineStatus && (
            <p className="mt-2 text-xs text-slate-500">{lineStatus}</p>
          )}

          <div className="mt-4 grid gap-3">
            {loading && (
              <p className="text-xs text-slate-400">Loading...</p>
            )}
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => openItem(item)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                  active?.id === item.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-100 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-700">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {item.company || "No company"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
                      item.status === "read"
                        ? "bg-slate-200 text-slate-600"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {item.status || "new"}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>{item.service}</span>
                  <span>
                    {new Date(item.createdAt).toLocaleString("th-TH")}
                  </span>
                </div>
              </button>
            ))}
            {!loading && items.length === 0 && (
              <p className="text-center text-xs text-slate-400">
                ยังไม่มีข้อมูลส่งเข้ามา
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow">
          {!active ? (
            <p className="text-sm text-slate-500">
              เลือกรายการด้านซ้ายเพื่อดูรายละเอียด
            </p>
          ) : (
            <div className="grid gap-4 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">
                    {active.name}
                  </h3>
                  <p className="text-xs text-slate-400">{active.company}</p>
                </div>
                <button
                  onClick={() => deleteItem(active.id)}
                  className="rounded-full bg-rose-100 px-4 py-2 text-xs text-rose-700"
                >
                  Delete
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={sendActiveToLine}
                  disabled={sendingActiveLine}
                  className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-700 disabled:opacity-60"
                >
                  {sendingActiveLine ? "Sending..." : "Send This Item to LINE"}
                </button>
              </div>
              <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Service</span>
                  <span>{active.service}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Email</span>
                  <span>{active.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Phone</span>
                  <span>{active.phone}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600">
                <p className="font-semibold text-slate-700">Details</p>
                <p className="mt-2 whitespace-pre-line">{active.details}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600">
                <p className="font-semibold text-slate-700">Chat to LINE</p>
                <textarea
                  value={lineMessage}
                  onChange={(event) => setLineMessage(event.target.value)}
                  className="mt-2 min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400"
                  placeholder="พิมพ์ข้อความที่จะส่งไป LINE"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={sendCustomLineMessage}
                    disabled={sendingCustomLine || !lineMessage.trim()}
                    className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {sendingCustomLine ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
  );
}
