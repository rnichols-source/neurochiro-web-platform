"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Check, Loader2 } from "lucide-react";
import { getVendorUsage, toggleVendorUsage } from "../review-actions";

interface UsageData {
  count: number;
  doctors: { name: string; photoUrl: string | null }[];
}

export default function VendorUsedBy({ vendorId }: { vendorId: string }) {
  const [data, setData] = useState<UsageData | null>(null);
  const [toggling, setToggling] = useState(false);
  const [isUsing, setIsUsing] = useState(false);

  useEffect(() => {
    getVendorUsage(vendorId).then(setData);
  }, [vendorId]);

  const handleToggle = async () => {
    setToggling(true);
    const result = await toggleVendorUsage(vendorId);
    if (result.error) {
      setToggling(false);
      return;
    }
    setIsUsing(result.added ?? false);
    // Refresh data
    const updated = await getVendorUsage(vendorId);
    setData(updated);
    setToggling(false);
  };

  if (!data) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-neuro-navy" />
          <h2 className="text-lg font-black text-neuro-navy">Used By Doctors</h2>
        </div>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
            isUsing
              ? 'bg-green-50 text-green-600 border border-green-200'
              : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-neuro-orange/5 hover:text-neuro-orange hover:border-neuro-orange/20'
          }`}
        >
          {toggling ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isUsing ? (
            <><Check className="w-3 h-3" /> I use this</>
          ) : (
            <><Plus className="w-3 h-3" /> I use this</>
          )}
        </button>
      </div>

      {data.count > 0 ? (
        <div className="flex items-center gap-3">
          {/* Doctor avatars */}
          <div className="flex -space-x-2">
            {data.doctors.slice(0, 5).map((doc, i) => (
              doc.photoUrl ? (
                <img key={i} src={doc.photoUrl} alt={doc.name} className="w-8 h-8 rounded-full border-2 border-white object-cover" />
              ) : (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-neuro-navy/10 flex items-center justify-center text-[10px] font-bold text-neuro-navy">
                  {doc.name.split(' ').map(n => n[0]).join('')}
                </div>
              )
            ))}
          </div>
          <p className="text-sm text-gray-500">
            <span className="font-bold text-neuro-navy">{data.count}</span> {data.count === 1 ? 'doctor' : 'doctors'} on NeuroChiro {data.count === 1 ? 'uses' : 'use'} this
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-400">No doctors have marked this vendor yet. Be the first!</p>
      )}
    </div>
  );
}
