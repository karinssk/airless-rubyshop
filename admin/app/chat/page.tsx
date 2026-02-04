"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { backendBaseUrl } from "@/lib/urls";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);
const API_URL = backendBaseUrl;

type SessionSummary = {
  id: string;
  visitorId: string;
  status: string;
  assignedAdminId: string | null;
  customerEmail?: string;
  customerPhone?: string;
  authProvider?: string;
  createdAt: string;
  lastMessageAt: string | null;
  messageCount: number;
};

type ChatMessage = {
  id: string;
  sessionId?: string;
  sender: "visitor" | "admin";
  text: string;
  attachments?: ChatAttachment[];
  createdAt: string;
};

type ChatAttachment = {
  id: string;
  url: string;
  filename: string;
  mime: string;
  size: number;
};

type AdminProfile = {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
};

export default function ChatPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSession, setActiveSession] = useState<SessionSummary | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [onlineAdmins, setOnlineAdmins] = useState<AdminProfile[]>([]);
  const [showOnlineAdmins, setShowOnlineAdmins] = useState(false);
  const [sessionAdmins, setSessionAdmins] = useState<AdminProfile[]>([]);
  const [typingAdmins, setTypingAdmins] = useState<AdminProfile[]>([]);
  const [visitorTyping, setVisitorTyping] = useState(false);
  const [showSidebarOnMobile, setShowSidebarOnMobile] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const activeSessionRef = useRef<SessionSummary | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingAdminsRef = useRef<Map<string, AdminProfile>>(new Map());

  const fallbackAdminId = useMemo(() => {
    if (typeof window === "undefined") return "admin-rca";
    const stored = window.localStorage.getItem("adminId");
    if (stored) return stored;
    const next = `admin-${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage.setItem("adminId", next);
    return next;
  }, []);
  const adminId = adminProfile?.id || fallbackAdminId;
  const adminName = adminProfile?.name || "Admin";
  const adminAvatar = adminProfile?.avatar || "";
  const adminColor = adminProfile?.color || "#2563eb";

  const loadSessions = async () => {
    if (!API_URL) return;
    const response = await fetch(`${API_URL}/chat/sessions`);
    const data = await response.json();
    setSessions(data.sessions || []);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("adminToken");
    if (!token || !API_URL) return;
    fetch(`${API_URL}/admin/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data?.user?.id) {
          setAdminProfile({
            id: data.user.id,
            name: data.user.name || data.user.email || "Admin",
            avatar: data.user.avatar || "",
            color: data.user.color || "#2563eb",
          });
        }
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    activeSessionRef.current = activeSession;
    // Scroll to bottom when active session changes or messages load
    setTimeout(scrollToBottom, 100);
  }, [activeSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!API_URL) {
      console.error("API_URL missing");
      return;
    }
    loadSessions();
    const socket = io(API_URL, {
      auth: {
        role: "admin",
        adminId,
        adminName,
        adminAvatar,
        adminColor,
      },
    });
    socket.on("sessionUpdated", (session: SessionSummary) => {
      setSessions((prev) => {
        const existing = prev.find((item) => item.id === session.id);
        if (existing) {
          return prev
            .map((item) => (item.id === session.id ? session : item))
            .sort((a, b) =>
              (b.lastMessageAt || b.createdAt).localeCompare(
                a.lastMessageAt || a.createdAt
              )
            );
        }
        return [session, ...prev];
      });
      const current = activeSessionRef.current;
      if (current && current.id === session.id) {
        setActiveSession(session);
      }
    });
    socket.on("adminPresence", (payload: { admins?: AdminProfile[] }) => {
      setOnlineAdmins(payload.admins || []);
    });
    socket.on(
      "sessionAdmins",
      (payload: { sessionId: string; admins?: AdminProfile[] }) => {
        if (payload.sessionId === activeSessionRef.current?.id) {
          setSessionAdmins(payload.admins || []);
        }
      }
    );
    socket.on(
      "typing",
      (payload: {
        sessionId: string;
        role: "admin" | "visitor";
        adminId?: string;
        name?: string;
        avatar?: string;
        color?: string;
        isTyping?: boolean;
      }) => {
        if (payload.sessionId !== activeSessionRef.current?.id) return;
        if (payload.role === "visitor") {
          setVisitorTyping(Boolean(payload.isTyping));
          return;
        }
        if (!payload.adminId || payload.adminId === adminId) return;
        if (payload.isTyping) {
          typingAdminsRef.current.set(payload.adminId, {
            id: payload.adminId,
            name: payload.name || "Admin",
            avatar: payload.avatar || "",
            color: payload.color || "#2563eb",
          });
        } else {
          typingAdminsRef.current.delete(payload.adminId);
        }
        setTypingAdmins(Array.from(typingAdminsRef.current.values()));
      }
    );
    socket.on("chatError", (error: { message?: string }) => {
      MySwal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: error?.message || "Unable to send message.",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    });
    socket.on("message", (message: ChatMessage) => {
      const current = activeSessionRef.current;
      if (current && message.sessionId === current.id) {
        setMessages((prev) => [...prev, message]);
        // If from visitor, maybe play sound?
      }
    });
    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [adminAvatar, adminId, adminName]);

  const openSession = async (session: SessionSummary) => {
    if (activeSession?.id && activeSession.id !== session.id) {
      socketRef.current?.emit("leaveSession", { sessionId: activeSession.id });
    }
    setActiveSession(session);
    socketRef.current?.emit("joinSession", { sessionId: session.id });
    setSessionAdmins([]);
    typingAdminsRef.current.clear();
    setTypingAdmins([]);
    setVisitorTyping(false);

    // Optimistic assignment update locally? No, wait for API.
    const assignResponse = await fetch(`${API_URL}/chat/sessions/${session.id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId }),
    });
    if (assignResponse.ok) {
      const data = await assignResponse.json().catch(() => ({}));
      if (data?.session) {
        setActiveSession(data.session);
      }
    }

    try {
      const historyResponse = await fetch(
        `${API_URL}/chat/sessions/${session.id}/messages`
      );
      const historyData = await historyResponse.json();
      setMessages(historyData.messages || []);
    } catch (error) {
      console.error("Failed to load chat history", error);
    }
    setShowSidebarOnMobile(false);
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!activeSession) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    socketRef.current?.emit("message", {
      sessionId: activeSession.id,
      sender: "admin",
      text: trimmed,
    });
    socketRef.current?.emit("typing", {
      sessionId: activeSession.id,
      isTyping: false,
    });
    setInput("");
  };

  const handleTypingChange = (value: string) => {
    setInput(value);
    if (!activeSession) return;
    if (!socketRef.current) return;
    const isTyping = Boolean(value.trim());
    socketRef.current.emit("typing", {
      sessionId: activeSession.id,
      isTyping,
    });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit("typing", {
          sessionId: activeSession.id,
          isTyping: false,
        });
      }, 1600);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!Number.isFinite(bytes)) return "";
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let index = 0;
    while (value >= 1024 && index < units.length - 1) {
      value /= 1024;
      index += 1;
    }
    return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
  };

  const handleAttachmentUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !activeSession) return;
    setUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(
        `${API_URL}/chat/sessions/${activeSession.id}/attachments`,
        { method: "POST", body: formData }
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || "Upload failed");
      }
      const data = await response.json();
      const attachment = data.attachment as ChatAttachment;
      socketRef.current?.emit("message", {
        sessionId: activeSession.id,
        sender: "admin",
        text: "",
        attachments: [attachment],
      });
    } catch (error) {
      await MySwal.fire({
        icon: "error",
        title: "Upload failed",
        text:
          error instanceof Error ? error.message : "Unable to upload file.",
      });
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] sm:h-[calc(100vh-100px)] flex flex-col">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-6 shrink-0">
        <div className="hidden sm:block">
          <h2 className="text-2xl font-bold text-slate-800">
            Chat Inbox
          </h2>
          <p className="text-sm text-slate-500">
            Real-time customer support
          </p>
        </div>
        <div className="relative w-full sm:w-auto hidden sm:block">
          <button
            type="button"
            onClick={() => setShowOnlineAdmins((prev) => !prev)}
            className="flex items-center justify-center gap-3 rounded-full bg-white px-4 py-2 text-sm shadow-sm border border-slate-100 w-full sm:w-auto"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-slate-700">
              Online ({onlineAdmins.length})
            </span>
          </button>
          {showOnlineAdmins && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white shadow-lg p-3 z-10">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Admins Online
              </p>
              <div className="mt-3 grid gap-2">
                {onlineAdmins.map((admin) => (
                  <div key={admin.id} className="flex items-center gap-2">
                    <div
                      className="h-8 w-8 rounded-full border-2 bg-slate-200 text-xs font-semibold text-slate-600 flex items-center justify-center overflow-hidden"
                      style={{ borderColor: admin.color || "#2563eb" }}
                    >
                      {admin.avatar ? (
                        <img
                          src={admin.avatar}
                          alt={admin.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        admin.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700 truncate">
                        {admin.name}
                      </p>
                    </div>
                  </div>
                ))}
                {onlineAdmins.length === 0 && (
                  <p className="text-xs text-slate-400">No admins online</p>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:gap-6 lg:grid lg:grid-cols-[320px_1fr] flex-1 min-h-0">
        {/* Sidebar List - Customer Chat List */}
        <section
          className={`flex flex-col bg-white overflow-hidden ${showSidebarOnMobile ? "flex" : "hidden"} lg:flex rounded-none sm:rounded-3xl border-0 sm:border border-slate-200 shadow-none sm:shadow-sm`}
        >
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
            <h3 className="font-semibold text-slate-700 text-sm sm:text-base">
              Customer Chats
            </h3>
            <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">{sessions.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => openSession(session)}
                className={`w-full text-left rounded-xl p-3 transition flex items-start gap-3 ${activeSession?.id === session.id
                  ? "bg-blue-50 border border-blue-100 ring-1 ring-blue-200"
                  : "hover:bg-slate-50 border border-transparent"
                  }`}
              >
                {/* Avatar Placeholder */}
                <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${activeSession?.id === session.id ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                  {session.visitorId.replace("visitor_", "").substring(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-semibold text-slate-700 truncate text-sm">
                      {session.visitorId.replace("visitor_", "Visitor #").substring(0, 15)}...
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2">
                      {session.lastMessageAt
                        ? new Date(session.lastMessageAt).toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })
                        : "New"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${session.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {session.status}
                    </span>
                    {session.messageCount > 0 && (
                      <span className="text-slate-400">{session.messageCount} msg</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
            {sessions.length === 0 && (
              <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                <p className="text-sm">No active sessions</p>
              </div>
            )}
          </div>
        </section>

        {/* Chat Area */}
        <section
          className={`flex flex-col bg-white overflow-hidden h-full min-h-[60vh] lg:min-h-0 ${showSidebarOnMobile ? "hidden" : "flex"} lg:flex rounded-none sm:rounded-3xl border-0 sm:border border-slate-200 shadow-none sm:shadow-sm`}
        >
          {activeSession ? (
            <>
              {/* Chat Header */}
              <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSidebarOnMobile(true)}
                    className="lg:hidden h-9 w-9 rounded-full border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 shrink-0"
                    aria-label="Back to customer chats"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                    {activeSession.visitorId.replace("visitor_", "").substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-base truncate">
                      {(() => {
                        const visitorId = activeSession.visitorId.replace("visitor_", "");
                        const shortId = visitorId.substring(0, 5);
                        return `Visitor #${shortId}...`;
                      })()}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {activeSession.authProvider ? (
                        <span className="capitalize">{activeSession.authProvider} Login</span>
                      ) : "Guest"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {sessionAdmins.length > 0 && (
                    <div className="flex -space-x-2">
                      {sessionAdmins.slice(0, 4).map((admin) => (
                        <div
                          key={admin.id}
                          className="h-8 w-8 rounded-full border-2 bg-slate-200 text-[10px] font-semibold text-slate-600 flex items-center justify-center overflow-hidden"
                          style={{ borderColor: admin.color || "#2563eb" }}
                          title={admin.name}
                        >
                          {admin.avatar ? (
                            <img
                              src={admin.avatar}
                              alt={admin.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            admin.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${activeSession.assignedAdminId === adminId
                        ? "bg-emerald-100 text-emerald-700"
                        : activeSession.assignedAdminId
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                  >
                    {activeSession.assignedAdminId === adminId
                      ? "Assigned to you"
                      : activeSession.assignedAdminId
                        ? "Assigned to another admin"
                        : "Unassigned"}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 min-h-0">
                {/* Messages List */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-4">
                    {messages.map((message) => {
                      const isAdmin = message.sender === "admin";
                      return (
                        <div key={message.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-full sm:max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isAdmin
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                            }`}>
                            {message.text && <p className="break-all whitespace-pre-wrap">{message.text}</p>}
                            {message.attachments?.length ? (
                              <div className="mt-2 space-y-2">
                                {message.attachments.map((attachment) => {
                                  const isImage =
                                    attachment.mime?.startsWith("image/");
                                  return (
                                    <div
                                      key={attachment.id}
                                      className={`rounded-xl border border-slate-200 bg-white/80 p-2 ${isImage ? "max-w-xs" : ""}`}
                                    >
                                      {isImage ? (
                                        <img
                                          src={attachment.url}
                                          alt={attachment.filename}
                                          className="h-auto w-full rounded-lg"
                                        />
                                      ) : (
                                        <a
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-xs font-medium text-blue-600 underline"
                                        >
                                          {attachment.filename}
                                        </a>
                                      )}
                                      <p className="mt-1 text-[10px] text-slate-400">
                                        {attachment.mime} ·{" "}
                                        {formatBytes(attachment.size)}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                            <p className={`text-[10px] mt-1 text-right ${isAdmin ? 'text-blue-200' : 'text-slate-400'}`}>
                              {new Date(message.createdAt).toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    {(typingAdmins.length > 0 || visitorTyping) && (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                        {visitorTyping && (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                            Visitor is typing...
                          </span>
                        )}
                        {!visitorTyping &&
                          typingAdmins.length === 1 && (
                            <span
                              className="rounded-full px-2 py-1 text-[11px] font-semibold"
                              style={{
                                backgroundColor: `${typingAdmins[0].color || "#2563eb"}22`,
                                color: typingAdmins[0].color || "#2563eb",
                              }}
                            >
                              {typingAdmins[0].name} is typing...
                            </span>
                          )}
                        {!visitorTyping && typingAdmins.length > 1 && (
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                            Multiple admins are typing...
                          </span>
                        )}
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="p-3 sm:p-4 bg-white border-t border-slate-100 shrink-0">
                    <form onSubmit={sendMessage} className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleAttachmentUpload}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!activeSession || uploadingAttachment}
                        className="h-10 w-10 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center shrink-0"
                        aria-label="Attach file"
                      >
                        {uploadingAttachment ? (
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        )}
                      </button>
                      <input
                        value={input}
                        onChange={(e) => handleTypingChange(e.target.value)}
                        className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        placeholder="Type your message..."
                      />
                      <button
                        type="submit"
                        disabled={!input.trim()}
                        className="h-10 w-10 rounded-full bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center shrink-0"
                        aria-label="Send message"
                      >
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>

                {/* Customer Info Sidebar (Right) */}
                <div className="w-72 border-l border-slate-100 bg-white p-5 overflow-y-auto hidden xl:block">
                  <h4 className="font-semibold text-slate-800 mb-4">Customer Info</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Customer ID</label>
                      <p className="text-sm font-medium text-slate-700 break-all">{activeSession.visitorId}</p>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Email</label>
                      {activeSession.customerEmail ? (
                        <p className="text-sm font-medium text-slate-700 break-all">{activeSession.customerEmail}</p>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not provided</span>
                      )}
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Phone</label>
                      {activeSession.customerPhone ? (
                        <p className="text-sm font-medium text-slate-700">{activeSession.customerPhone}</p>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not provided</span>
                      )}
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Login Provider</label>
                      {activeSession.authProvider ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600 capitalize">
                          {activeSession.authProvider === 'google' && <span className="text-rose-500">G</span>}
                          {activeSession.authProvider === 'line' && <span className="text-emerald-500">L</span>}
                          {activeSession.authProvider === 'facebook' && <span className="text-blue-600">f</span>}
                          {activeSession.authProvider === 'email' && <span>✉️</span>}
                          {activeSession.authProvider}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Guest</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h4 className="font-semibold text-slate-800 mb-4 text-xs uppercase tracking-wider">Quick Actions</h4>
                    <div className="grid gap-2">
                      <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200">
                        End Session
                      </button>
                      <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200">
                        Transfer Chat
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <p className="font-medium">Select a session to start chatting</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
