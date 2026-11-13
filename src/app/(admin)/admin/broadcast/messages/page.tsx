"use client";

import { useState } from "react";
import { Send, Eye, Loader2, CheckCircle2, Users, AlertTriangle } from "lucide-react";
import { sendBroadcast } from "@/app/actions/messaging-actions";

type Segment = "all_pro" | "all_students" | "founding_members" | string;

const PRESET_SEGMENTS = [
  { value: "all_pro", label: "All Pro Doctors" },
  { value: "all_students", label: "All Students" },
  { value: "founding_members", label: "Founding Members" },
];

export default function BroadcastPage() {
  const [segment, setSegment] = useState<Segment>("all_pro");
  const [customCountry, setCustomCountry] = useState("");
  const [customState, setCustomState] = useState("");
  const [useCustom, setUseCustom] = useState<"none" | "country" | "state">("none");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [previewing, setPreviewing] = useState(false);
  const [previewResult, setPreviewResult] = useState<{
    recipientCount: number;
    recipients: { id: string; name: string | null }[];
    subject: string;
    bodyPreview: string;
  } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [confirmCount, setConfirmCount] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ count: number } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const resolvedSegment: Segment =
    useCustom === "country" && customCountry.trim()
      ? `country:${customCountry.trim().toUpperCase()}`
      : useCustom === "state" && customState.trim()
      ? `state:${customState.trim().toUpperCase()}`
      : segment;

  const canPreview = subject.trim().length > 0 && body.trim().length > 0;
  const canSend =
    previewResult !== null &&
    confirmCount.trim() === String(previewResult.recipientCount) &&
    !sending &&
    !sendResult;

  async function handlePreview() {
    setPreviewing(true);
    setPreviewResult(null);
    setPreviewError(null);
    setConfirmCount("");
    setSendResult(null);
    setSendError(null);

    const result = await sendBroadcast(subject.trim(), body.trim(), resolvedSegment, true);

    setPreviewing(false);
    if ("error" in result && result.error) {
      setPreviewError(result.error as string);
      return;
    }
    if (result.dryRun && result.recipientCount !== undefined) {
      setPreviewResult({
        recipientCount: result.recipientCount,
        recipients: (result.recipients || []) as { id: string; name: string | null }[],
        subject: result.subject || subject,
        bodyPreview: result.bodyPreview || body.slice(0, 200),
      });
    }
  }

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    setSendError(null);

    const result = await sendBroadcast(subject.trim(), body.trim(), resolvedSegment, false);

    setSending(false);
    if ("error" in result && result.error) {
      setSendError(result.error as string);
      return;
    }
    if (result.success && result.recipientCount !== undefined) {
      setSendResult({ count: result.recipientCount });
    }
  }

  return (
    <div
      className="min-h-screen p-6 md:p-10"
      style={{
        background: "linear-gradient(to bottom, #1a2e40, #162231)",
        color: "white",
      }}
    >
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1
            className="text-3xl font-black"
            style={{ fontFamily: "Lato, sans-serif" }}
          >
            Broadcast Message
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Send an in-platform message to a segment of members.
          </p>
        </div>

        {/* Success state */}
        {sendResult && (
          <div
            className="flex flex-col items-center gap-3 py-10 rounded-2xl text-center"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}
          >
            <CheckCircle2 className="w-12 h-12" style={{ color: "#4ade80" }} />
            <p className="text-xl font-black" style={{ color: "#4ade80" }}>
              Broadcast Sent
            </p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              Delivered to {sendResult.count} recipient{sendResult.count !== 1 ? "s" : ""}.
            </p>
            <button
              onClick={() => {
                setSendResult(null);
                setPreviewResult(null);
                setSubject("");
                setBody("");
                setConfirmCount("");
                setSegment("all_pro");
                setUseCustom("none");
                setCustomCountry("");
                setCustomState("");
              }}
              className="mt-2 px-5 py-2 rounded-xl text-sm font-bold"
              style={{ background: "#D66829", color: "white" }}
            >
              Send Another
            </button>
          </div>
        )}

        {!sendResult && (
          <>
            {/* Segment */}
            <div
              className="rounded-2xl p-6 space-y-4"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                Segment
              </h2>

              {/* Preset options */}
              <div className="flex flex-wrap gap-2">
                {PRESET_SEGMENTS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => { setSegment(s.value); setUseCustom("none"); }}
                    className="px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                    style={{
                      background:
                        useCustom === "none" && segment === s.value
                          ? "#D66829"
                          : "rgba(255,255,255,0.08)",
                      color:
                        useCustom === "none" && segment === s.value
                          ? "white"
                          : "rgba(255,255,255,0.6)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Custom country / state */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Country (e.g. US, CA)
                  </label>
                  <input
                    value={customCountry}
                    onChange={(e) => {
                      setCustomCountry(e.target.value);
                      if (e.target.value.trim()) setUseCustom("country");
                      else if (useCustom === "country") setUseCustom("none");
                    }}
                    placeholder="country code"
                    maxLength={5}
                    className="w-full px-3 py-2 rounded-xl text-sm"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border:
                        useCustom === "country"
                          ? "1px solid #D66829"
                          : "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                    State (e.g. TX, SC)
                  </label>
                  <input
                    value={customState}
                    onChange={(e) => {
                      setCustomState(e.target.value);
                      if (e.target.value.trim()) setUseCustom("state");
                      else if (useCustom === "state") setUseCustom("none");
                    }}
                    placeholder="state code"
                    maxLength={5}
                    className="w-full px-3 py-2 rounded-xl text-sm"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border:
                        useCustom === "state"
                          ? "1px solid #D66829"
                          : "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Active segment label */}
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                Sending to:{" "}
                <span className="font-bold" style={{ color: "#D66829" }}>
                  {resolvedSegment}
                </span>
              </p>
            </div>

            {/* Subject */}
            <div
              className="rounded-2xl p-6 space-y-3"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                Subject
              </h2>
              <input
                value={subject}
                onChange={(e) => { setSubject(e.target.value); setPreviewResult(null); }}
                placeholder="e.g. New feature available in your dashboard"
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                  outline: "none",
                }}
              />
            </div>

            {/* Body */}
            <div
              className="rounded-2xl p-6 space-y-3"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Body
                </h2>
                <span
                  className="text-xs font-bold"
                  style={{ color: body.length > 1800 ? "#f87171" : "rgba(255,255,255,0.3)" }}
                >
                  {body.length} chars
                </span>
              </div>
              <textarea
                value={body}
                onChange={(e) => { setBody(e.target.value); setPreviewResult(null); }}
                placeholder="Write your message here. Markdown is not rendered — keep it plain text."
                rows={8}
                className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                  outline: "none",
                }}
              />
            </div>

            {/* Preview button */}
            <button
              type="button"
              onClick={handlePreview}
              disabled={!canPreview || previewing}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-opacity"
              style={{
                background: canPreview && !previewing ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: canPreview && !previewing ? "white" : "rgba(255,255,255,0.3)",
                cursor: canPreview && !previewing ? "pointer" : "not-allowed",
              }}
            >
              {previewing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Previewing...</>
              ) : (
                <><Eye className="w-4 h-4" /> Preview Recipients</>
              )}
            </button>

            {/* Preview error */}
            {previewError && (
              <div
                className="flex items-center gap-3 p-4 rounded-xl text-sm"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {previewError}
              </div>
            )}

            {/* Preview results */}
            {previewResult && (
              <div
                className="rounded-2xl p-6 space-y-4"
                style={{ background: "rgba(214,104,41,0.06)", border: "1px solid rgba(214,104,41,0.2)" }}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5" style={{ color: "#D66829" }} />
                  <p className="font-black text-lg">
                    {previewResult.recipientCount} recipient{previewResult.recipientCount !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Recipient list */}
                <div
                  className="rounded-xl p-3 space-y-1 max-h-48 overflow-y-auto"
                  style={{ background: "rgba(0,0,0,0.2)" }}
                >
                  {previewResult.recipients.map((r) => (
                    <p key={r.id} className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {r.name || "(no name)"}{" "}
                      <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>{r.id.slice(0, 8)}</span>
                    </p>
                  ))}
                </div>

                <div
                  className="p-3 rounded-xl text-xs space-y-1"
                  style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)" }}
                >
                  <p>
                    <span className="font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>Subject:</span>{" "}
                    {previewResult.subject}
                  </p>
                  <p>
                    <span className="font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>Preview:</span>{" "}
                    {previewResult.bodyPreview}
                    {previewResult.bodyPreview.length >= 200 ? "..." : ""}
                  </p>
                </div>

                {/* Confirmation input */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>
                    Type <span style={{ color: "#D66829" }}>{previewResult.recipientCount}</span> to confirm and enable Send
                  </label>
                  <input
                    value={confirmCount}
                    onChange={(e) => setConfirmCount(e.target.value)}
                    placeholder={`Type ${previewResult.recipientCount}`}
                    className="w-full px-4 py-3 rounded-xl text-sm font-bold"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border:
                        confirmCount === String(previewResult.recipientCount)
                          ? "1px solid #D66829"
                          : "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Send button */}
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!canSend}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: canSend ? "#D66829" : "rgba(255,255,255,0.05)",
                    color: canSend ? "white" : "rgba(255,255,255,0.25)",
                    cursor: canSend ? "pointer" : "not-allowed",
                    boxShadow: canSend ? "0 4px 20px rgba(214,104,41,0.3)" : "none",
                  }}
                >
                  {sending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send to {previewResult.recipientCount} Recipient{previewResult.recipientCount !== 1 ? "s" : ""}</>
                  )}
                </button>

                {/* Send error */}
                {sendError && (
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl text-xs"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
                  >
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {sendError}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
