"use client";

import { useState, useEffect } from "react";
import { Loader2, Eye, MousePointer, Phone, Globe } from "lucide-react";
import { ROIData } from "@/types/analytics";
import { getDoctorROIData } from "../dashboard/actions";

export default function DoctorAnalytics() {
  const [period, setPeriod] = useState<"7D" | "30D" | "90D" | "1Y">("30D");
  const [roiData, setRoiData] = useState<ROIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDoctorROIData(period)
      .then((data) => { if (data) setRoiData(data as ROIData); })
      .finally(() => setLoading(false));
  }, [period]);

  const statCards = roiData
    ? [
        { label: "Profile Views", value: roiData.stats.profile_views, icon: Eye },
        { label: "Contact Clicks", value: roiData.stats.contact_clicks, icon: MousePointer },
        { label: "Phone Taps", value: roiData.stats.phone_taps, icon: Phone },
        { label: "Website Clicks", value: roiData.stats.website_clicks, icon: Globe },
      ]
    : [];

  const estimatedRevenue = roiData
    ? roiData.stats.confirmed_patients * roiData.stats.average_case_value
    : 0;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <div className="flex bg-white border border-gray-200 rounded-lg p-1">
          {(["7D", "30D", "90D", "1Y"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setPeriod(t)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                period === t ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : !roiData ? (
        <div className="text-center py-16 text-gray-500">
          <p>No data available for this period.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <div key={card.label} className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <card.icon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500">{card.label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Revenue Estimate */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-sm font-medium text-gray-500 mb-1">Estimated Revenue</p>
            <p className="text-3xl font-bold text-gray-900">${estimatedRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">
              {roiData.stats.confirmed_patients} confirmed patients x ${roiData.stats.average_case_value.toLocaleString()} avg case value
            </p>
          </div>

          {/* Lead Sources */}
          {roiData.patient_acquisition.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Lead Sources</h2>
              <div className="space-y-3">
                {roiData.patient_acquisition.map((channel, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{channel.source}</span>
                      <span className="text-gray-500">{channel.count}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-900 rounded-full"
                        style={{ width: `${channel.count}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
