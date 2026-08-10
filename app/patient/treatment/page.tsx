"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface Treatment {
  id: string;
  medication: string;
  frequency: string;
  duration: string;
  start_date: string;
  end_date: string;
}

interface DoseLog {
  id: string;
  date: string;
  dose_number: number;
  status: "taken" | "missed";
}

export default function TreatmentTrackerPage() {
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Get today's date in YYYY-MM-DD format based on local time
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // 1. Fetch patient ID
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (patient) {
        // 2. Fetch the active treatment
        const { data: activeTreatment } = await supabase
          .from("treatments")
          .select("*")
          .eq("patient_id", patient.id)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activeTreatment) {
          setTreatment(activeTreatment);

          // 3. Fetch ALL historical adherence logs for this specific treatment
          const { data: adherenceLogs } = await supabase
            .from("adherence")
            .select("id, date, dose_number, status")
            .eq("treatment_id", activeTreatment.id);

          setLogs(adherenceLogs || []);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleLogDose = async (doseNumber: number, status: "taken" | "missed") => {
    if (!treatment) return;

    // UPSERT: Insert the row, or update it if the unique constraint (treatment + date + dose) is hit.
    const { error } = await supabase
      .from("adherence")
      .upsert(
        {
          treatment_id: treatment.id,
          date: todayStr,
          dose_number: doseNumber,
          status: status,
        },
        { onConflict: "treatment_id, date, dose_number" }
      );

    if (!error) {
      // Refresh logs locally so the UI updates instantly without reloading the page
      const { data: updatedLogs } = await supabase
        .from("adherence")
        .select("id, date, dose_number, status")
        .eq("treatment_id", treatment.id);
        
      setLogs(updatedLogs || []);
    } else {
      console.error("Failed to log dose:", error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-500 font-medium">Loading tracking data...</p>
      </div>
    );
  }

  // Calculate Simple Statistics
  const takenCount = logs.filter((l) => l.status === "taken").length;
  const missedCount = logs.filter((l) => l.status === "missed").length;
  const totalLogged = takenCount + missedCount;
  const adherencePercentage = totalLogged > 0 ? Math.round((takenCount / totalLogged) * 100) : 0;
  
  // Calculate Treatment Day (Simple day difference)
  const startDate = treatment ? new Date(treatment.start_date) : new Date();
  const todayDate = new Date(todayStr);
  const diffTime = Math.abs(todayDate.getTime() - startDate.getTime());
  const treatmentDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // Filter logs just for today's UI rendering
  const todaysLogs = logs.filter((l) => l.date === todayStr);
  const getDoseStatus = (doseNum: number) => todaysLogs.find((l) => l.dose_number === doseNum)?.status;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 py-4 px-6 sm:px-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Track Treatment</h1>
          <p className="text-sm text-gray-500">Log your daily medications</p>
        </div>
        <Link href="/patient" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          &larr; Dashboard
        </Link>
      </header>

      <main className="max-w-2xl mx-auto p-6 sm:p-8 space-y-6">
        {!treatment ? (
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No active treatment</h2>
            <p className="text-gray-500 text-sm">You do not have a medication to track right now.</p>
          </div>
        ) : (
          <>
            {/* STATS OVERVIEW CARD */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Plan</p>
                  <h2 className="text-2xl font-bold text-gray-900 mt-1">{treatment.medication}</h2>
                  <p className="text-sm text-gray-600 font-medium">
                    {treatment.frequency} • {treatment.duration}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Timeline</p>
                  <p className="text-xl font-bold text-blue-600 mt-1">Day {treatmentDay}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{adherencePercentage}%</p>
                  <p className="text-xs text-gray-500 uppercase font-semibold mt-1">Adherence</p>
                </div>
                <div className="text-center border-l border-r border-gray-100">
                  <p className="text-3xl font-bold text-emerald-600">{takenCount}</p>
                  <p className="text-xs text-gray-500 uppercase font-semibold mt-1">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">{missedCount}</p>
                  <p className="text-xs text-gray-500 uppercase font-semibold mt-1">Missed</p>
                </div>
              </div>
            </div>

            {/* TODAY'S DOSES CARD */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-gray-900">Today's Doses</h3>
              
              {/* DOSE 1 */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Dose 1</h4>
                  <p className="text-sm text-gray-500">
                    Status: <span className="font-medium uppercase text-xs ml-1">
                      {getDoseStatus(1) === 'taken' ? '✅ Taken' : getDoseStatus(1) === 'missed' ? '❌ Missed' : 'Pending'}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleLogDose(1, "taken")}
                    className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition ${
                      getDoseStatus(1) === "taken" 
                        ? "bg-emerald-600 text-white shadow-inner" 
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Taken
                  </button>
                  <button
                    onClick={() => handleLogDose(1, "missed")}
                    className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition ${
                      getDoseStatus(1) === "missed" 
                        ? "bg-red-600 text-white shadow-inner" 
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Missed
                  </button>
                </div>
              </div>

              {/* DOSE 2 */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Dose 2</h4>
                  <p className="text-sm text-gray-500">
                    Status: <span className="font-medium uppercase text-xs ml-1">
                      {getDoseStatus(2) === 'taken' ? '✅ Taken' : getDoseStatus(2) === 'missed' ? '❌ Missed' : 'Pending'}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleLogDose(2, "taken")}
                    className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition ${
                      getDoseStatus(2) === "taken" 
                        ? "bg-emerald-600 text-white shadow-inner" 
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Taken
                  </button>
                  <button
                    onClick={() => handleLogDose(2, "missed")}
                    className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition ${
                      getDoseStatus(2) === "missed" 
                        ? "bg-red-600 text-white shadow-inner" 
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Missed
                  </button>
                </div>
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
}
