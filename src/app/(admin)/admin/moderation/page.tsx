"use client";

import { useState, useEffect } from "react";
import { getModerationData, resolveAlert, moderateDoctor } from "./actions";
import { getPendingStories, approvePatientStory, rejectPatientStory } from "@/app/actions/patient-stories";
import { formatDistanceToNow } from "date-fns";

export default function ModerationCenter() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [moderating, setModerating] = useState<string | null>(null);
  const [pendingStories, setPendingStories] = useState<any[]>([]);
  const [storyActioning, setStoryActioning] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    getPendingStories().then(setPendingStories);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await getModerationData();
    if (res.success) setData(res.data);
    setLoading(false);
  };

  const handleModerateDoctor = async (doctorId: string, action: "approve" | "reject" | "flag") => {
    setModerating(doctorId);
    const res = await moderateDoctor(doctorId, action);
    if (res.success) await fetchData();
    else alert("Error: " + res.error);
    setModerating(null);
  };

  const handleResolveAlert = async (action: "Dismiss" | "Escalate" | "Resolve") => {
    if (!selectedAlert) return;
    setResolving(selectedAlert.id);
    const res = await resolveAlert(selectedAlert.id, action);
    if (res.success) { await fetchData(); setSelectedAlert(null); }
    setResolving(null);
  };

  if (loading && !data) return <p className="text-gray-500 text-center py-20">Loading...</p>;

  const queues = data?.queues || [];
  const alerts = (data?.alerts || []).filter((a: any) => a.status === "Critical" || a.status === "High");
  const activeQueue = queues.find((q: any) => q.id === selectedQueue);

  return (
    <div className="p-6 max-w-6xl mx-auto text-white space-y-6">
      <h1 className="text-2xl font-bold">Moderation</h1>

      {/* Queue Cards */}
      <div className="grid grid-cols-3 gap-4">
        {queues.map((q: any) => (
          <button
            key={q.id}
            onClick={() => setSelectedQueue(selectedQueue === q.id ? null : q.id)}
            className={`p-5 rounded-xl text-left border transition-all ${
              selectedQueue === q.id ? "border-white/30 bg-white/10" : "border-white/5 bg-white/5 hover:bg-white/10"
            }`}
          >
            <p className="text-xs text-gray-400 uppercase mb-1">{q.name}</p>
            <p className="text-3xl font-bold">{q.count}</p>
          </button>
        ))}
      </div>

      {/* Expanded Queue */}
      {activeQueue && (
        <div className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-semibold">{activeQueue.name} Queue</h2>
            <button onClick={() => setSelectedQueue(null)} className="text-gray-500 hover:text-white">&times;</button>
          </div>
          <div className="divide-y divide-white/5">
            {(!activeQueue.items || activeQueue.items.length === 0) ? (
              <p className="p-8 text-center text-gray-500 text-sm">No pending items.</p>
            ) : (
              activeQueue.items.map((item: any) => (
                <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {item.first_name ? `Dr. ${item.first_name} ${item.last_name}` : item.name || item.title || item.id}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.clinic_name && `${item.clinic_name} - `}
                      {item.created_at && formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={moderating === item.id}
                      onClick={() => handleModerateDoctor(item.id, "approve")}
                      className="px-3 py-1 bg-green-500/10 text-green-400 rounded text-xs hover:bg-green-500/20 disabled:opacity-50"
                    >Approve</button>
                    <button
                      disabled={moderating === item.id}
                      onClick={() => handleModerateDoctor(item.id, "reject")}
                      className="px-3 py-1 bg-red-500/10 text-red-400 rounded text-xs hover:bg-red-500/20 disabled:opacity-50"
                    >Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Security Alerts */}
      <div className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-semibold">Security Alerts</h2>
        </div>
        <div className="divide-y divide-white/5">
          {alerts.length === 0 ? (
            <p className="p-8 text-center text-gray-500 text-sm">No active alerts.</p>
          ) : (
            alerts.map((alert: any, i: number) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      alert.status === "Critical" ? "bg-red-500/10 text-red-400" : "bg-orange-500/10 text-orange-400"
                    }`}>{alert.status}</span>
                    <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(alert.date), { addSuffix: true })}</span>
                  </div>
                  <p className="text-sm font-medium">{alert.type}: {alert.source}</p>
                  <p className="text-xs text-gray-500">{alert.reason}</p>
                </div>
                <button
                  onClick={() => setSelectedAlert(alert)}
                  className="px-3 py-1 bg-white/10 rounded text-xs hover:bg-white/20 shrink-0"
                >Resolve</button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Patient Stories */}
      {pendingStories.length > 0 && (
        <div className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h2 className="font-semibold">Patient Stories ({pendingStories.length})</h2>
          </div>
          <div className="divide-y divide-white/5">
            {pendingStories.map((story) => (
              <div key={story.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">
                    {story.patient_first_name} — for Dr. {story.doctor?.first_name} {story.doctor?.last_name}
                  </p>
                  <span className="text-xs text-gray-500">{story.doctor?.clinic_name}</span>
                </div>
                <p className="text-xs text-gray-400 mb-1">
                  <span className="text-gray-500 font-semibold">Before:</span> {story.condition_before} &rarr;{" "}
                  <span className="text-gray-500 font-semibold">After:</span> {story.outcome_after}
                </p>
                <p className="text-xs text-gray-400 italic mb-3">&ldquo;{story.story_text}&rdquo;</p>
                <div className="flex gap-2">
                  <button
                    disabled={storyActioning === story.id}
                    onClick={async () => {
                      setStoryActioning(story.id);
                      await approvePatientStory(story.id);
                      setPendingStories((prev) => prev.filter((s) => s.id !== story.id));
                      setStoryActioning(null);
                    }}
                    className="px-3 py-1 bg-green-500/10 text-green-400 rounded text-xs hover:bg-green-500/20"
                  >Approve</button>
                  <button
                    disabled={storyActioning === story.id}
                    onClick={async () => {
                      setStoryActioning(story.id);
                      await rejectPatientStory(story.id);
                      setPendingStories((prev) => prev.filter((s) => s.id !== story.id));
                      setStoryActioning(null);
                    }}
                    className="px-3 py-1 bg-red-500/10 text-red-400 rounded text-xs hover:bg-red-500/20"
                  >Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert Resolution Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#0d1117] border border-white/10 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-bold">Resolve Alert</h2>
              <button onClick={() => setSelectedAlert(null)} className="text-gray-500 hover:text-white text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Reason</p>
                <p className="text-sm text-gray-300">{selectedAlert.reason}</p>
                <p className="text-xs text-gray-500 mt-3 mb-1">Source</p>
                <p className="text-sm font-medium">{selectedAlert.source}</p>
              </div>
              <div className="flex gap-3">
                <button
                  disabled={resolving !== null}
                  onClick={() => handleResolveAlert("Dismiss")}
                  className="flex-1 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 disabled:opacity-50"
                >Dismiss</button>
                <button
                  disabled={resolving !== null}
                  onClick={() => handleResolveAlert("Escalate")}
                  className="flex-1 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm hover:bg-red-500/20 disabled:opacity-50"
                >Escalate</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
