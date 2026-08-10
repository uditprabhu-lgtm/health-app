"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface WellnessLog {
  id: string;
  date: string;
  sleep: number | null;
  mood: string | null;
  activity: number | null;
  hydration: number | null;
}

export default function PatientWellnessPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [patientId, setPatientId] = useState<string | null>(null);

  // Form State (Today's Values)
  const [sleep, setSleep] = useState<string>("");
  const [mood, setMood] = useState<string>("Okay");
  const [activity, setActivity] = useState<string>("");
  const [hydration, setHydration] = useState<string>("");

  // Averages State
  const [averages, setAverages] = useState({
    sleep: 0,
    activity: 0,
    hydration: 0,
    daysLogged: 0
  });

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    async function fetchWellnessData() {
      setLoading(true);

      // 1. Fetch Patient
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (patient) {
        setPatientId(patient.id);

        // 2. Fetch the last 7 days of wellness logs for averages
        const pastWeekDate = new Date();
        pastWeekDate.setDate(pastWeekDate.getDate() - 7);
        const pastWeekStr = pastWeekDate.toISOString().split("T")[0];

        const { data: logs } = await supabase
          .from("wellness")
          .select("*")
          .eq("patient_id", patient.id)
          .gte("date", pastWeekStr)
          .order("date", { ascending: false });

        if (logs && logs.length > 0) {
          // Calculate Averages safely
          const validSleep = logs.filter(l => l.sleep !== null).map(l => Number(l.sleep));
          const validActivity = logs.filter(l => l.activity !== null).map(l => Number(l.activity));
          const validHydration = logs.filter(l => l.hydration !== null).map(l => Number(l.hydration));

          const avgSleep = validSleep.length ? validSleep.reduce((a, b) => a + b, 0) / validSleep.length : 0;
          const avgActivity = validActivity.length ? validActivity.reduce((a, b) => a + b, 0) / validActivity.length : 0;
          const avgHydration = validHydration.length ? validHydration.reduce((a, b) => a + b, 0) / validHydration.length : 0;

          setAverages({
            sleep: Number(avgSleep.toFixed(1)),
            activity: Math.round(avgActivity),
            hydration: Math.round(avgHydration),
            daysLogged: logs.length
          });

          // 3. Pre-fill form if today's entry already exists
          const todayLog = logs.find(l => l.date === todayStr);
          if (todayLog) {
            if (todayLog.sleep !== null) setSleep(todayLog.sleep.toString());
            if (todayLog.mood !== null) setMood(todayLog.mood);
            if (todayLog.activity !== null) setActivity(todayLog.activity.toString());
            if (todayLog.hydration !== null) setHydration(todayLog.hydration.toString());
          }
        }
      }

      setLoading(false);
    }

    fetchWellnessData();
  }, [todayStr]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;

    setSaving(true);
    setSuccess(false);

    // Prepare numerical values, convert empty strings to null for DB integrity
    const sleepVal = sleep === "" ? null : Number(sleep);
    const activityVal = activity === "" ? null : Number(activity);
    const hydrationVal = hydration === "" ? null : Number(hydration);

    // UPSERT: Create new log or update existing log for today
    const { error } = await supabase
      .from("wellness")
      .upsert(
        {
          patient_id: patientId,
          date: todayStr,
          sleep: sleepVal,
          mood: mood,
          activity: activityVal,
          hydration: hydrationVal,
        },
        { onConflict: "patient_id, date" }
      );

    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000); // hide success message after 3 seconds
    } else {
      console.error("Failed to save wellness data:", error.message);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-500 font-medium">Loading wellness data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 py-4 px-6 sm:px-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Wellness</h1>
          <p className="text-sm text-gray-500">Track your daily lifestyle factors</p>
        </div>
        <Link
          href="/patient"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          &larr; Dashboard
        </Link>
      </header>

      <main className="max-w-3xl mx-auto p-6 sm:p-8 space-y-6">
        
        {/* AVERAGES DASHBOARD */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-4 border-b border-gray-100 pb-2 flex justify-between">
            <span>7-Day Averages</span>
            <span className="font-medium normal-case text-gray-400">
              Based on {averages.daysLogged} day(s) logged
            </span>
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-indigo-600">{averages.sleep} <span className="text-sm text-gray-500 font-medium">hrs</span></p>
              <p className="text-xs text-gray-500 font-semibold uppercase mt-1">Sleep</p>
            </div>
            <div className="border-l border-r border-gray-100">
              <p className="text-2xl font-bold text-emerald-600">{averages.activity}</p>
              <p className="text-xs text-gray-500 font-semibold uppercase mt-1">Activity</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{averages.hydration} <span className="text-sm text-gray-500 font-medium">gls</span></p>
              <p className="text-xs text-gray-500 font-semibold uppercase mt-1">Hydration</p>
            </div>
          </div>
        </div>

        {/* LOGGING FORM */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm">
          <div className="mb-6 border-b border-gray-100 pb-4 flex justify-between items-end">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Today's Log</h2>
              <p className="text-sm text-gray-500">{todayStr}</p>
            </div>
            {success && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-semibold animate-pulse">
                ✓ Saved Successfully
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Sleep Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Sleep (hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={sleep}
                onChange={(e) => setSleep(e.target.value)}
                placeholder="e.g. 7.5"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                required
              />
            </div>

            {/* Mood Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Mood
              </label>
              <div className="grid grid-cols-3 gap-3">
                {["Bad", "Okay", "Good"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setMood(level)}
                    className={`py-3 text-sm font-medium rounded-lg border transition ${
                      mood === level
                        ? "bg-purple-50 border-purple-600 text-purple-700 shadow-sm"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Activity (number / score)
              </label>
              <input
                type="number"
                min="0"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="e.g. 30"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Enter a score or active minutes.</p>
            </div>

            {/* Hydration Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Hydration (number of glasses)
              </label>
              <input
                type="number"
                min="0"
                value={hydration}
                onChange={(e) => setHydration(e.target.value)}
                placeholder="e.g. 8"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-blue-600 text-white font-medium text-base rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
              >
                {saving ? "Saving Log..." : "Save Today's Wellness"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}