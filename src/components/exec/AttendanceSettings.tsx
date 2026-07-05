"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Clock, FloppyDisk } from "@phosphor-icons/react";

interface TimeGates {
  Sunday: { earlyThreshold: string; lateThreshold: string };
  "Mid-Week": { earlyThreshold: string; lateThreshold: string };
}

export function AttendanceSettings() {
  const [timeGates, setTimeGates] = useState<TimeGates | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/attendance-config");
        if (res.ok) {
          setTimeGates(await res.json());
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleUpdate = async (service: "Sunday" | "Mid-Week") => {
    if (!timeGates) return;
    setSaving(true);
    try {
      const res = await fetch("/api/attendance-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service,
          earlyThreshold: timeGates[service].earlyThreshold,
          lateThreshold: timeGates[service].lateThreshold,
        }),
      });
      if (res.ok) {
        toast.success(`${service} thresholds updated`);
      } else {
        toast.error("Failed to save");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !timeGates) {
    return <div className="text-sm text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={20} className="text-gray-600" />
        <h3 className="text-lg font-bold text-gray-900">Attendance Time Gates</h3>
      </div>

      {(["Sunday", "Mid-Week"] as const).map((service) => (
        <div key={service} className="bg-white p-6 rounded-2xl border border-gray-200">
          <h4 className="font-bold text-gray-900 mb-4">{service}</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 block">
                Early Threshold
              </label>
              <input
                type="time"
                value={timeGates[service].earlyThreshold}
                onChange={(e) =>
                  setTimeGates({
                    ...timeGates,
                    [service]: {
                      ...timeGates[service],
                      earlyThreshold: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold"
              />
              <p className="text-[9px] text-gray-400 mt-1">Mark before this time = early</p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 block">
                Late Threshold
              </label>
              <input
                type="time"
                value={timeGates[service].lateThreshold}
                onChange={(e) =>
                  setTimeGates({
                    ...timeGates,
                    [service]: {
                      ...timeGates[service],
                      lateThreshold: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold"
              />
              <p className="text-[9px] text-gray-400 mt-1">Mark after this time = late</p>
            </div>
          </div>
          <button
            onClick={() => handleUpdate(service)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all disabled:opacity-60"
          >
            <FloppyDisk size={16} weight="bold" />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      ))}
    </div>
  );
}
