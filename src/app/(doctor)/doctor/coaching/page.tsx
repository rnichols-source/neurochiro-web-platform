"use client";

import { useState, useEffect, useRef } from "react";
import {
  Upload,
  Play,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  FileAudio,
  Calendar,
  Save,
  X,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  getCoachingSessions,
  uploadCoachingAudio,
  updateCoachingSession,
  deleteCoachingSession,
} from "./actions";

interface CoachingSession {
  id: string;
  session_date: string;
  audio_url: string;
  audio_filename: string;
  notes: string;
  transcript: string;
  action_items: string;
  status: string;
  created_at: string;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function CoachingPage() {
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Upload form state
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [transcript, setTranscript] = useState("");
  const [actionItems, setActionItems] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Session expansion state
  const [expandedSections, setExpandedSections] = useState<
    Record<string, { notes?: boolean; transcript?: boolean; actions?: boolean }>
  >({});

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editTranscript, setEditTranscript] = useState("");
  const [editActionItems, setEditActionItems] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    setLoading(true);
    try {
      const data = await getCoachingSessions();
      setSessions(data as CoachingSession[]);
    } catch {
      setError("Failed to load coaching sessions");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      setError("Please select an audio file");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("audio", selectedFile);
      formData.append("sessionDate", sessionDate);
      formData.append("notes", notes);
      formData.append("transcript", transcript);
      formData.append("actionItems", actionItems);

      const result = await uploadCoachingAudio(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Coaching session saved successfully!");
        setSelectedFile(null);
        setNotes("");
        setTranscript("");
        setActionItems("");
        setSessionDate(new Date().toISOString().split("T")[0]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        await loadSessions();
      }
    } catch {
      setError("An unexpected error occurred during upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this coaching session?"))
      return;

    const result = await deleteCoachingSession(id);
    if (result.error) {
      setError(result.error);
    } else {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  }

  function startEdit(session: CoachingSession) {
    setEditingId(session.id);
    setEditNotes(session.notes || "");
    setEditTranscript(session.transcript || "");
    setEditActionItems(session.action_items || "");
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);

    const result = await updateCoachingSession(editingId, {
      notes: editNotes,
      transcript: editTranscript,
      action_items: editActionItems,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? {
                ...s,
                notes: editNotes,
                transcript: editTranscript,
                action_items: editActionItems,
              }
            : s
        )
      );
      setEditingId(null);
    }
    setSaving(false);
  }

  function toggleExpand(
    sessionId: string,
    section: "notes" | "transcript" | "actions"
  ) {
    setExpandedSections((prev) => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        [section]: !prev[sessionId]?.[section],
      },
    }));
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && isAudioFile(file)) {
      setSelectedFile(file);
    } else {
      setError("Please drop a valid audio file (.mp3, .m4a, .wav, .webm, .ogg)");
    }
  }

  function isAudioFile(file: File) {
    const validTypes = [
      "audio/mpeg",
      "audio/mp4",
      "audio/x-m4a",
      "audio/wav",
      "audio/webm",
      "audio/ogg",
    ];
    const validExts = [".mp3", ".m4a", ".wav", ".webm", ".ogg"];
    return (
      validTypes.includes(file.type) ||
      validExts.some((ext) => file.name.toLowerCase().endsWith(ext))
    );
  }

  return (
    <div className="min-h-screen bg-neuro-navy p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-7 h-7 text-neuro-orange" />
            <h1 className="text-2xl md:text-3xl font-heading font-black text-white">
              Pro Coaching
            </h1>
          </div>
          <p className="text-gray-400 font-body text-sm md:text-base">
            Your 1-on-1 coaching call recordings and notes
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 text-sm flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-heading font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-neuro-orange" />
            Upload New Session
          </h2>

          {/* Date */}
          <div>
            <label className="block text-sm font-body font-medium text-gray-400 mb-1.5">
              Session Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-2.5 text-white text-sm font-body focus:outline-none focus:border-neuro-orange/50 focus:ring-1 focus:ring-neuro-orange/30"
              />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-body font-medium text-gray-400 mb-1.5">
              Audio File
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-neuro-orange bg-neuro-orange/5"
                  : selectedFile
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-white/10 hover:border-white/20 bg-white/[0.02]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.m4a,.wav,.webm,.ogg,audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setSelectedFile(file);
                }}
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileAudio className="w-6 h-6 text-green-400" />
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">
                      {selectedFile.name}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="ml-2 p-1 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">
                    Drag & drop your audio file here, or click to browse
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    Accepts .mp3, .m4a, .wav, .webm, .ogg
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-body font-medium text-gray-400 mb-1.5">
              Notes{" "}
              <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Key takeaways from this session..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-body placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange/50 focus:ring-1 focus:ring-neuro-orange/30 resize-y"
            />
          </div>

          {/* Transcript */}
          <div>
            <label className="block text-sm font-body font-medium text-gray-400 mb-1.5">
              Transcript{" "}
              <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={4}
              placeholder="Paste your transcript here..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-body placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange/50 focus:ring-1 focus:ring-neuro-orange/30 resize-y"
            />
          </div>

          {/* Action Items */}
          <div>
            <label className="block text-sm font-body font-medium text-gray-400 mb-1.5">
              Action Items{" "}
              <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <textarea
              value={actionItems}
              onChange={(e) => setActionItems(e.target.value)}
              rows={3}
              placeholder="What did you commit to doing?"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-body placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange/50 focus:ring-1 focus:ring-neuro-orange/30 resize-y"
            />
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            className="w-full md:w-auto px-8 py-3 bg-neuro-orange text-white font-heading font-bold rounded-xl hover:bg-neuro-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Session
              </>
            )}
          </button>
        </div>

        {/* Sessions List */}
        <div>
          <h2 className="text-lg font-heading font-bold text-white mb-4">
            Past Sessions
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-neuro-orange animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <FileAudio className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-body text-sm">
                No coaching sessions yet. Upload your first recording above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4"
                >
                  {/* Session Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-white font-heading font-bold text-base">
                        {formatDate(session.session_date)}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1.5">
                        <FileAudio className="w-3 h-3" />
                        {session.audio_filename}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(session)}
                        className="p-2 text-gray-500 hover:text-neuro-orange hover:bg-white/5 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Audio Player */}
                  <audio
                    controls
                    preload="none"
                    className="w-full h-10 rounded-lg"
                    src={session.audio_url}
                  >
                    Your browser does not support the audio element.
                  </audio>

                  {/* Edit Mode */}
                  {editingId === session.id ? (
                    <div className="space-y-3 pt-2 border-t border-white/5">
                      <div>
                        <label className="block text-xs font-body font-medium text-gray-400 mb-1">
                          Notes
                        </label>
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          rows={3}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-body placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange/50 focus:ring-1 focus:ring-neuro-orange/30 resize-y"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-body font-medium text-gray-400 mb-1">
                          Transcript
                        </label>
                        <textarea
                          value={editTranscript}
                          onChange={(e) => setEditTranscript(e.target.value)}
                          rows={4}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-body placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange/50 focus:ring-1 focus:ring-neuro-orange/30 resize-y"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-body font-medium text-gray-400 mb-1">
                          Action Items
                        </label>
                        <textarea
                          value={editActionItems}
                          onChange={(e) => setEditActionItems(e.target.value)}
                          rows={3}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-body placeholder:text-gray-600 focus:outline-none focus:border-neuro-orange/50 focus:ring-1 focus:ring-neuro-orange/30 resize-y"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          disabled={saving}
                          className="px-4 py-2 bg-neuro-orange text-white text-sm font-heading font-bold rounded-lg hover:bg-neuro-orange/90 disabled:opacity-50 transition-all flex items-center gap-1.5"
                        >
                          {saving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 bg-white/5 text-gray-400 text-sm font-heading font-bold rounded-lg hover:bg-white/10 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Expandable Notes */}
                      {session.notes && (
                        <ExpandableSection
                          label="Notes"
                          content={session.notes}
                          expanded={
                            expandedSections[session.id]?.notes || false
                          }
                          onToggle={() => toggleExpand(session.id, "notes")}
                        />
                      )}

                      {/* Expandable Transcript */}
                      {session.transcript && (
                        <ExpandableSection
                          label="Transcript"
                          content={session.transcript}
                          expanded={
                            expandedSections[session.id]?.transcript || false
                          }
                          onToggle={() =>
                            toggleExpand(session.id, "transcript")
                          }
                        />
                      )}

                      {/* Expandable Action Items */}
                      {session.action_items && (
                        <ExpandableSection
                          label="Action Items"
                          content={session.action_items}
                          expanded={
                            expandedSections[session.id]?.actions || false
                          }
                          onToggle={() => toggleExpand(session.id, "actions")}
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExpandableSection({
  label,
  content,
  expanded,
  onToggle,
}: {
  label: string;
  content: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-t border-white/5 pt-3">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm font-body font-medium text-gray-400 hover:text-gray-300 transition-colors w-full text-left"
      >
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
        {label}
      </button>
      {expanded && (
        <p className="text-gray-300 text-sm font-body mt-2 whitespace-pre-wrap leading-relaxed pl-5">
          {content}
        </p>
      )}
    </div>
  );
}
