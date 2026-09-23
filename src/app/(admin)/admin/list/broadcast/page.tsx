"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Eye,
  Mail,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Users,
  TestTube,
} from "lucide-react";
import Link from "next/link";
import {
  getSegmentCount,
  getAvailableStates,
  sendTestBroadcast,
  sendBroadcast,
  type BroadcastSegment,
} from "../broadcast-actions";

type Step = "compose" | "preview" | "confirm" | "sending" | "done";

export default function BroadcastPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("compose");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [segmentType, setSegmentType] = useState<"all" | "state" | "zip_prefix">("all");
  const [segmentValue, setSegmentValue] = useState("");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<{ sent: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAvailableStates().then(setAvailableStates);
  }, []);

  // Fetch recipient count when segment changes
  useEffect(() => {
    const segment: BroadcastSegment = { type: segmentType, value: segmentValue };
    if (segmentType !== "all" && !segmentValue) {
      setRecipientCount(null);
      return;
    }
    setCountLoading(true);
    getSegmentCount(segment).then((count) => {
      setRecipientCount(count);
      setCountLoading(false);
    });
  }, [segmentType, segmentValue]);

  const segment: BroadcastSegment = { type: segmentType, value: segmentValue };

  const segmentLabel =
    segmentType === "all"
      ? "All confirmed subscribers"
      : segmentType === "state"
      ? `State: ${segmentValue}`
      : `ZIP prefix: ${segmentValue}xx`;

  const handleSendTest = async () => {
    if (!subject.trim() || !body.trim()) return;
    setTestSending(true);
    setTestResult(null);
    const result = await sendTestBroadcast(subject, body);
    setTestSending(false);
    setTestResult(result.ok ? "Test sent to your email." : `Failed: ${result.error}`);
  };

  const handleSend = async () => {
    setStep("sending");
    setError("");
    const result = await sendBroadcast(subject, body, segment);
    if (result.ok) {
      setSendResult({ sent: result.sent });
      setStep("done");
    } else {
      setError(result.error || "Failed to send broadcast");
      setStep("confirm");
    }
  };

  // Simple markdown preview renderer
  const previewHtml = body
    .split("\n\n")
    .map((p) => {
      let html = p.trim();
      if (!html) return "";
      html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
      html = html.replace(
        /\[(.+?)\]\((.+?)\)/g,
        '<a href="$2" style="color:#D66829;font-weight:bold;">$1</a>'
      );
      html = html.replace(/\n/g, "<br>");
      return `<p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 16px;">${html}</p>`;
    })
    .filter(Boolean)
    .join("");

  if (step === "done") {
    return (
      <div className="p-6 md:p-8 max-w-3xl">
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-10 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-white mb-2">Broadcast Sent</h2>
          <p className="text-gray-400 mb-6">
            {sendResult?.sent} emails sent to {segmentLabel.toLowerCase()}.
          </p>
          <Link
            href="/admin/list"
            className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl text-sm hover:bg-white/15 transition-colors"
          >
            Back to Patient List
          </Link>
        </div>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="p-6 md:p-8 max-w-3xl">
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg font-black text-white">Confirm Broadcast</h2>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center py-3 border-b border-white/[0.06]">
              <span className="text-gray-400 text-sm">Subject</span>
              <span className="text-white font-bold text-sm">{subject}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/[0.06]">
              <span className="text-gray-400 text-sm">Segment</span>
              <span className="text-white font-bold text-sm">{segmentLabel}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/[0.06]">
              <span className="text-gray-400 text-sm">Recipients</span>
              <span className="text-neuro-orange font-black text-lg">{recipientCount}</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep("compose")}
              className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl text-sm hover:bg-white/15 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={handleSend}
              className="flex-1 px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm hover:bg-neuro-orange/90 transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send to {recipientCount} {recipientCount === 1 ? "subscriber" : "subscribers"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "sending") {
    return (
      <div className="p-6 md:p-8 max-w-3xl flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-neuro-orange animate-spin mx-auto mb-4" />
          <p className="text-white font-bold">Sending broadcast...</p>
          <p className="text-gray-400 text-sm mt-1">This may take a moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/list" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Mail className="w-6 h-6 text-neuro-orange" />
            Compose Broadcast
          </h1>
          <p className="text-gray-400 text-sm mt-1">Send to the patient email list</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Compose */}
        <div className="space-y-5">
          {/* Segment */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">
              Segment
            </label>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => { setSegmentType("all"); setSegmentValue(""); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  segmentType === "all" ? "bg-neuro-orange text-white" : "bg-white/[0.06] text-gray-400 hover:bg-white/10"
                }`}
              >
                All
              </button>
              <button
                onClick={() => { setSegmentType("state"); setSegmentValue(""); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  segmentType === "state" ? "bg-neuro-orange text-white" : "bg-white/[0.06] text-gray-400 hover:bg-white/10"
                }`}
              >
                By State
              </button>
              <button
                onClick={() => { setSegmentType("zip_prefix"); setSegmentValue(""); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  segmentType === "zip_prefix" ? "bg-neuro-orange text-white" : "bg-white/[0.06] text-gray-400 hover:bg-white/10"
                }`}
              >
                By ZIP Prefix
              </button>
            </div>

            {segmentType === "state" && (
              <select
                value={segmentValue}
                onChange={(e) => setSegmentValue(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-neuro-orange"
              >
                <option value="">Select state...</option>
                {availableStates.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}

            {segmentType === "zip_prefix" && (
              <input
                type="text"
                maxLength={3}
                value={segmentValue}
                onChange={(e) => setSegmentValue(e.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="e.g. 296"
                className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-neuro-orange"
              />
            )}

            <div className="mt-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              {countLoading ? (
                <Loader2 className="w-3 h-3 text-gray-500 animate-spin" />
              ) : recipientCount !== null ? (
                <span className="text-sm text-white font-bold">
                  {recipientCount} {recipientCount === 1 ? "recipient" : "recipients"}
                </span>
              ) : (
                <span className="text-sm text-gray-500">Select a segment</span>
              )}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="This week: why your nervous system matters"
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-neuro-orange"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
              Body (Markdown)
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={16}
              placeholder={"Hi there,\n\nWrite your email here. Use **bold**, *italic*, and [links](https://neurochiro.co).\n\nSeparate paragraphs with a blank line."}
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono leading-relaxed focus:outline-none focus:border-neuro-orange resize-y"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSendTest}
              disabled={testSending || !subject.trim() || !body.trim()}
              className="px-5 py-3 bg-white/10 text-white font-bold rounded-xl text-sm hover:bg-white/15 transition-colors flex items-center gap-2 disabled:opacity-40"
            >
              {testSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
              Send Test to Myself
            </button>
            <button
              onClick={() => {
                if (!subject.trim() || !body.trim() || recipientCount === null || recipientCount === 0) return;
                setStep("confirm");
              }}
              disabled={!subject.trim() || !body.trim() || !recipientCount}
              className="flex-1 px-5 py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm hover:bg-neuro-orange/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Eye className="w-4 h-4" /> Review & Send
            </button>
          </div>

          {testResult && (
            <p className={`text-sm font-bold ${testResult.startsWith("Test") ? "text-green-400" : "text-red-400"}`}>
              {testResult}
            </p>
          )}
        </div>

        {/* Right: Live Preview */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
            Live Preview
          </label>
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
            {/* Email header */}
            <div style={{ background: "#1E2D3B", padding: "20px", textAlign: "center" }}>
              <span style={{ color: "white", fontSize: 18, fontWeight: 900 }}>
                NEURO<span style={{ color: "#D66829" }}>CHIRO</span>
              </span>
            </div>
            {/* Email body */}
            <div style={{ padding: 24 }}>
              {subject && (
                <p style={{ fontSize: 12, color: "#999", marginBottom: 16, borderBottom: "1px solid #eee", paddingBottom: 12 }}>
                  Subject: <strong style={{ color: "#333" }}>{subject}</strong>
                </p>
              )}
              {previewHtml ? (
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              ) : (
                <p style={{ color: "#ccc", fontSize: 14, fontStyle: "italic" }}>
                  Start typing to see a preview...
                </p>
              )}
              <p style={{ fontSize: 15, color: "#333", marginTop: 24 }}>
                <strong>Dr. Ray</strong><br />
                <span style={{ color: "#999" }}>NeuroChiro | neurochiro.co</span>
              </p>
            </div>
            {/* Footer */}
            <div style={{ background: "#f5f3ef", padding: 16, textAlign: "center", fontSize: 11, color: "#999" }}>
              <p style={{ margin: 0, marginBottom: 4 }}>Educational content only. Not medical advice.</p>
              <p style={{ margin: 0, color: "#D66829" }}>Unsubscribe</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
