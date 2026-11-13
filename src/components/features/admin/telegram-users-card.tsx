"use client";

import React, { useState, useTransition } from "react";
import { Send, Users, Radio, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { TelegramUserProfile } from "@/server/telegram/users";
import { broadcastTelegramAction } from "@/app/admin/actions";

interface TelegramUsersCardProps {
  users: TelegramUserProfile[];
}

export function TelegramUsersCard({ users }: TelegramUsersCardProps) {
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    setStatusMessage(null);
    const fd = new FormData();
    fd.append("message", broadcastMessage.trim());

    startTransition(async () => {
      try {
        const res = await broadcastTelegramAction(fd);
        if (res.ok && "sent" in res) {
          setStatusMessage(`✅ Blast sent successfully to ${res.sent}/${res.total} Telegram students!`);
          setBroadcastMessage("");
          setTimeout(() => setIsBroadcastOpen(false), 2500);
        } else {
          setStatusMessage(`❌ Error: ${res.error}`);
        }
      } catch {
        setStatusMessage("❌ Network error during broadcast.");
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-[#E7E5E0] shadow-sm overflow-hidden space-y-4 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E7E5E0]">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-500 animate-pulse" />
            <h3 className="text-sm font-semibold text-[#1F2937]">
              Telegram Bot Crammers ({users.length} Users Tracked)
            </h3>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Real-time roster of students active on @kalexamhai_bot with subject sessions and generation counts.
          </p>
        </div>

        <button
          onClick={() => setIsBroadcastOpen(!isBroadcastOpen)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Broadcast Blast ({users.length})</span>
        </button>
      </div>

      {/* Broadcast Form Drawer */}
      {isBroadcastOpen && (
        <form onSubmit={handleBroadcast} className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-sky-600" />
              Send Alert to all {users.length} Telegram Students
            </span>
            <span className="text-[11px] text-sky-700 font-mono">Paced at ~30 msg/sec</span>
          </div>

          <textarea
            rows={2}
            required
            value={broadcastMessage}
            disabled={isPending}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            placeholder="📢 Kal Maths-1 ka paper hai! High-Yield Formula Notes aur KT Buster checklist check karo: https://kalexamhai-one.vercel.app"
            className="w-full text-xs p-2.5 bg-white border border-sky-300 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-sky-500"
          />

          {statusMessage && (
            <div className="text-xs font-medium text-slate-800 bg-white p-2 rounded-[6px] border border-sky-200">
              {statusMessage}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsBroadcastOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !broadcastMessage.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-[8px] shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{isPending ? "Blasting..." : "Send to All"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Roster Table */}
      <div className="overflow-x-auto max-h-72 overflow-y-auto border border-[#E7E5E0] rounded-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F9F9F6] text-[#6B7280] border-b border-[#E7E5E0] sticky top-0 z-10">
            <tr>
              <th className="py-2 px-4 font-medium">Chat ID</th>
              <th className="py-2 px-4 font-medium">User / Handle</th>
              <th className="py-2 px-4 font-medium">Last Active Subject</th>
              <th className="py-2 px-4 font-medium">Sessions</th>
              <th className="py-2 px-4 font-medium">Last Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E5E0]">
            {users.length > 0 ? (
              users.map((u) => (
                <tr key={u.chatId} className="hover:bg-black/[0.01]">
                  <td className="py-2.5 px-4 font-mono text-slate-500">{u.chatId}</td>
                  <td className="py-2.5 px-4">
                    <span className="font-medium text-[#1F2937] block">
                      {u.firstName || "MU Student"} {u.lastName || ""}
                    </span>
                    {u.username && (
                      <span className="text-[11px] text-sky-600 font-mono">@{u.username}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 max-w-xs truncate text-[#4B5563]">
                    {u.lastSubject || "Official MU Syllabus Session"}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {u.sessionCount} {u.sessionCount === 1 ? "session" : "sessions"}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-[#9CA3AF] whitespace-nowrap">
                    {new Date(u.lastActive).toLocaleDateString()} at{" "}
                    {new Date(u.lastActive).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-4 px-4 text-center text-[#9CA3AF]">
                  No Telegram bot sessions recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
