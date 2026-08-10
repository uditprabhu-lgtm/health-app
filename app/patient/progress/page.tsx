"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface Patient {
  id: string;
  name: string;
  age: number;
}

interface Treatment {
  id: string;
  medication: string;
  frequency: string;
  duration: string;
  start_date: string;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  doctors?: { name: string; specialty: string };
}

interface MedicalHistory {
  id: string;
  condition: string;
  notes: string;
}

export default function PatientDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [history, setHistory] = useState<MedicalHistory[]>([]);
  const [todayStatus, setTodayStatus] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);

      // 1. Fetch Patient
      const { data: patientData } = await supabase
        .from("patients")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (patientData) {
        setPatient(patientData);

        // 2. Fetch Active Treatment
        const { data: activeTreatment } = await supabase
          .from("treatments")
          .select("*")
          .eq("patient_id", patientData.id)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activeTreatment) {
          setTreatment(activeTreatment);

          // Check today's adherence status
          const { data: logs } = await supabase
            .from("adherence")
            .select("status")
            .eq("treatment_id", activeTreatment.id)
            .eq("date", todayStr);

          if (logs && logs.length > 0) {
            setTodayStatus(logs[0].status);
          }
        }

        // 3. Fetch Upcoming Appointment
        const { data: aptData } = await supabase
          .from("appointments")
          .select("id, date, time, status, doctors(name, specialty)")
          .eq("patient_id", patientData.id)
          .order("date", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (aptData) {
          setAppointment(aptData as unknown as Appointment);
        }

        // 4. Fetch Medical History
        const { data: histData } = await supabase
          .from("medical_history")
          .select("id, condition, notes")
          .eq("patient_id", patientData.id);

        if (histData) {
          setHistory(histData);
        }
      }

      setLoading(false);
    }

    loadDashboard();
  }, [todayStr]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      <header className="bg-white border-b border-gray-200 py-4 px-8 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Welcome, {patient?.name || "Patient"}</h1>
          <p className="text-xs text-gray-500">Patient Dashboard</p>
        </div>
        <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-800">
          &larr; Home
        </Link>
      </header>

      <main className="max-w-5xl mx-auto p-8 space-y-6">
        
        {/* Quick Actions Grid */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/patient/careplan" className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-sm rounded-lg text-center transition">
              View Care Plan
            </Link>
            <Link href="/patient/treatment" className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-sm rounded-lg text-center transition">
              Track Treatment
            </Link>
            <Link href="/patient/symptoms" className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-sm rounded-lg text-center transition">
              Report Symptoms
            </Link>
            <Link href="/patient/side-effects" className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-sm rounded-lg text-center transition">
              Report Side Effect
            </Link>
            <Link href="/patient/wellness" className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm rounded-lg text-center transition">
              Wellness Check
            </Link>
            <Link href="/patient/ask-doctor" className="p-3 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-sm rounded-lg text-center transition">
              Ask Doctor
            </Link>
            <Link href="/patient/history" className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm rounded-lg text-center transition border border-rose-200">
              + Medical History
            </Link>
          </div>
        </div>

        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Active Treatment Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Current Treatment Plan</h2>
              {treatment ? (
                <div className="space-y-1">
                  <p className="text-lg font-bold text-blue-900">{treatment.medication}</p>
                  <p className="text-sm text-gray-600">{treatment.frequency} • {treatment.duration}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No active treatment plan prescribed yet.</p>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-500">Today&apos;s Status:</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                todayStatus === "taken" ? "bg-emerald-100 text-emerald-800" :
                todayStatus === "missed" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"
              }`}>
                {todayStatus ? todayStatus.toUpperCase() : "PENDING"}
              </span>
            </div>
          </div>

          {/* Medical History Overview Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Medical History</h2>
                <Link href="/patient/history" className="text-xs font-bold text-blue-600 hover:underline">+ Add Condition</Link>
              </div>
              {history.length > 0 ? (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {history.map((h) => (
                    <div key={h.id} className="p-2 bg-gray-50 rounded border border-gray-100 text-xs">
                      <p className="font-bold text-gray-800">{h.condition}</p>
                      {h.notes && <p className="text-gray-500">{h.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No medical history logged yet.</p>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}