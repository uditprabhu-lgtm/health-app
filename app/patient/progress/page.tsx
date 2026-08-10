"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface Treatment {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  start_date: string;
}

interface Report {
  id: string;
  type: string;
  description: string;
  severity: string;
  date: string;
}

export default function PatientProgressPage() {
  const [loading, setLoading] = useState(true);

  // Snapshot State
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [treatmentDay, setTreatmentDay] = useState<number>(0);
  
  const [adherenceStats, setAdherenceStats] = useState({ percentage: 0, taken: 0, missed: 0 });
  const [symptoms, setSymptoms] = useState<Report[]>([]);
  const [sideEffects, setSideEffects] = useState<Report[]>([]);
  const [unansweredQuestions, setUnansweredQuestions] = useState(0);

  useEffect(() => {
    async function loadProgressSnapshot() {
      setLoading(true);

      // 1. Fetch Patient
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (patient) {
        // 2. Fetch Active Treatment
        const { data: activeTreatment } = await supabase
          .from("treatments")
          .select("id, medication, dosage, frequency, start_date")
          .eq("patient_id", patient.id)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activeTreatment) {
          setTreatment(activeTreatment);

          // Calculate Treatment Day
          const start = new Date(activeTreatment.start_date);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - start.getTime());
          const currentDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          setTreatmentDay(currentDay);

          // 3. Fetch Adherence Logs
          const { data: logs } = await supabase
            .from("adherence")
            .select("status")
            .eq("treatment_id", activeTreatment.id);

          if (logs) {
            const taken = logs.filter((l) => l.status === "taken").length;
            const missed = logs.filter((l) => l.status === "missed").length;
            const total = taken + missed;
            const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;
            setAdherenceStats({ percentage, taken, missed });
          }

          // 4. Fetch Reports (Symptoms & Side Effects)
          const { data: reports } = await supabase
            .from("reports")
            .select("id, type, description, severity, date")
            .eq("treatment_id", activeTreatment.id)
            .order("date", { ascending: false })
            .limit(10);

          if (reports) {
            setSymptoms(reports.filter((r) => r.type === "symptom"));
            setSideEffects(reports.filter((r) => r.type === "side_effect"));
          }
        }

        // 5. Fetch Pending Questions
        const { count } = await supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("patient_id", patient.id)
          .eq("answered", false);

        if (count !== null) {
          setUnansweredQuestions(count);
        }
      }

      setLoading(false);
    }

    loadProgressSnapshot();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-500 font-medium">Loading progress snapshot...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 py-4 px-6 sm:px-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Progress</h1>
          <p className="text-sm text-gray-500">Current treatment snapshot</p>
        </div>
        <Link
          href="/patient"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          &larr; Dashboard
        </Link>
      </header>

      <main className="max-w-4xl mx-auto p-6 sm:p-8 space-y-6">
        {!treatment ? (
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No active treatment</h2>
            <p className="text-gray-500 text-sm">
              Your progress dashboard will populate once a care plan is assigned.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CURRENT TREATMENT */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
              <h2 className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-4">
                Current Treatment
              </h2>
              <div className="space-y-4 flex-grow">
                <div>
                  <p className="text-sm text-gray-500">Medication</p>
                  <p className="text-xl font-bold text-gray-900">{treatment.medication}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Dosage</p>
                    <p className="font-medium text-gray-900">{treatment.dosage}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Frequency</p>
                    <p className="font-medium text-gray-900">{treatment.frequency}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  You are on <span className="font-bold text-blue-600">Day {treatmentDay}</span> of your treatment.
                </p>
              </div>
            </div>

            {/* ADHERENCE */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
              <h2 className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-4">
                Adherence
              </h2>
              <div className="flex-grow flex items-center justify-center py-4">
                <div className="text-center">
                  <p className="text-5xl font-black text-gray-900">{adherenceStats.percentage}%</p>
                  <p className="text-sm text-gray-500 mt-1 font-medium">Overall Rate</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 text-center">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{adherenceStats.taken}</p>
                  <p className="text-xs text-gray-500 uppercase font-semibold mt-1">Taken Doses</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{adherenceStats.missed}</p>
                  <p className="text-xs text-gray-500 uppercase font-semibold mt-1">Missed Doses</p>
                </div>
              </div>
            </div>

            {/* SYMPTOMS */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-4">
                Recent Symptoms
              </h2>
              {symptoms.length > 0 ? (
                <div className="space-y-3">
                  {symptoms.map((report) => (
                    <div key={report.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-gray-900">{report.severity}</span>
                        <span className="text-gray-500 text-xs">{report.date}</span>
                      </div>
                      <p className="text-gray-700">{report.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No symptoms reported recently.</p>
              )}
            </div>

            {/* SIDE EFFECTS */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-4">
                Reported Side Effects
              </h2>
              {sideEffects.length > 0 ? (
                <div className="space-y-3">
                  {sideEffects.map((report) => (
                    <div key={report.id} className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-amber-900">{report.severity}</span>
                        <span className="text-amber-700 text-xs">{report.date}</span>
                      </div>
                      <p className="text-amber-800">{report.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No side effects reported.</p>
              )}
            </div>

            {/* QUESTIONS */}
            <div className="md:col-span-2 bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-blue-900">Pending Questions</h2>
                <p className="text-sm text-blue-700 mt-1">
                  You have <span className="font-bold">{unansweredQuestions}</span> question(s) waiting to be answered by your doctor.
                </p>
              </div>
              <Link 
                href="/patient/ask-doctor"
                className="px-5 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                Ask Another
              </Link>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}