"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface Patient {
  id: string;
  name: string;
  age: number;
}

interface ClinicalData {
  diagnosis: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Report {
  id: string;
  type: string;
  description: string;
  severity: string;
  date: string;
}

interface Question {
  id: string;
  question_text: string;
  date: string;
}

interface Wellness {
  date: string;
  sleep: string | null;
  mood: string | null;
  activity: string | null;
  hydration: string | null;
}

export default function DoctorPatientProgressPage() {
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  
  // Snapshot Data
  const [clinical, setClinical] = useState<ClinicalData | null>(null);
  const [adherence, setAdherence] = useState({ percentage: 0, taken: 0, missed: 0 });
  const [symptoms, setSymptoms] = useState<Report[]>([]);
  const [sideEffects, setSideEffects] = useState<Report[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [wellness, setWellness] = useState<Wellness | null>(null);

  useEffect(() => {
    async function loadPatientProgress() {
      setLoading(true);

      // 1. Fetch Patient
      const { data: patientData } = await supabase
        .from("patients")
        .select("id, name, age")
        .limit(1)
        .maybeSingle();

      if (patientData) {
        setPatient(patientData);

        // 2. Fetch Active Treatment & Joined Consultation (Diagnosis)
        const { data: treatment } = await supabase
          .from("treatments")
          .select("*, consultations(*)")
          .eq("patient_id", patientData.id)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (treatment) {
          const consultationData: any = Array.isArray(treatment.consultations)
            ? treatment.consultations[0]
            : treatment.consultations;

          setClinical({
            diagnosis: consultationData?.diagnosis || "Unknown Diagnosis",
            medication: treatment.medication,
            dosage: treatment.dosage || consultationData?.dosage || "N/A",
            frequency: treatment.frequency || consultationData?.frequency || "N/A",
            duration: treatment.duration || consultationData?.duration || "N/A",
          });

          // 3. Fetch Adherence Logs for this treatment
          const { data: logs } = await supabase
            .from("adherence")
            .select("status")
            .eq("treatment_id", treatment.id);

          if (logs) {
            const taken = logs.filter((l) => l.status === "taken").length;
            const missed = logs.filter((l) => l.status === "missed").length;
            const total = taken + missed;
            setAdherence({
              percentage: total > 0 ? Math.round((taken / total) * 100) : 0,
              taken,
              missed,
            });
          }

          // 4. Fetch Patient Reports (Symptoms & Side effects)
          const { data: reports } = await supabase
            .from("reports")
            .select("id, type, description, severity, date")
            .eq("treatment_id", treatment.id)
            .order("date", { ascending: false });

          if (reports) {
            setSymptoms(reports.filter((r) => r.type === "symptom"));
            setSideEffects(reports.filter((r) => r.type === "side_effect"));
          }
        }

        // 5. Fetch Pending Questions
        const { data: qData } = await supabase
          .from("questions")
          .select("id, question_text, date")
          .eq("patient_id", patientData.id)
          .eq("answered", false)
          .order("date", { ascending: false });

        if (qData) {
          setQuestions(qData);
        }

        // 6. Fetch Latest Wellness Check
        const { data: wData } = await supabase
          .from("wellness")
          .select("date, sleep, mood, activity, hydration")
          .eq("patient_id", patientData.id)
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (wData) {
          setWellness(wData);
        }
      }

      setLoading(false);
    }

    loadPatientProgress();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-500 font-medium">Loading clinical summary...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-500 font-medium">No patient records found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 pb-12">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
          <p className="text-sm text-gray-500">Age: {patient.age} • Patient Progress Summary</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/doctor" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
            &larr; Dashboard
          </Link>
          
          {/* ---> THIS IS THE BUTTON THAT CHANGED <--- */}
          <Link
            href="/doctor/follow-up"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition shadow-sm"
          >
            Follow Up
          </Link>

        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 sm:p-8 space-y-6">
        
        {/* ROW 1: CLINICAL & ADHERENCE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Clinical Context */}
          <section className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">
              Clinical Context
            </h2>
            {clinical ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Current Diagnosis</p>
                  <p className="text-xl font-bold text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {clinical.diagnosis}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Active Treatment</p>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <p className="font-bold text-blue-900 text-lg">{clinical.medication}</p>
                    <p className="text-sm text-blue-800 mt-1">
                      {clinical.dosage} • {clinical.frequency}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">Duration: {clinical.duration}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic py-4">No active clinical data found.</p>
            )}
          </section>

          {/* Adherence */}
          <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">
              Adherence
            </h2>
            <div className="flex-grow flex flex-col items-center justify-center">
              <div className="text-center mb-4">
                <span className={`text-5xl font-black ${
                  adherence.percentage >= 80 ? 'text-emerald-600' : adherence.percentage >= 50 ? 'text-amber-500' : 'text-red-600'
                }`}>
                  {adherence.percentage}%
                </span>
                <p className="text-sm text-gray-500 font-medium mt-1">Compliance Rate</p>
              </div>
              <div className="flex w-full justify-between px-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">{adherence.taken}</p>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Taken</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-red-600">{adherence.missed}</p>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Missed</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ROW 2: PATIENT REPORTS (Symptoms & Side Effects) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Symptoms */}
          <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2 flex justify-between">
              <span>Patient Symptoms</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{symptoms.length}</span>
            </h2>
            {symptoms.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {symptoms.map((s) => (
                  <div key={s.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-1 text-xs">
                      <span className="font-bold text-gray-800 uppercase">{s.severity}</span>
                      <span className="text-gray-500">{s.date}</span>
                    </div>
                    <p className="text-sm text-gray-700">{s.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic py-2">No symptoms reported.</p>
            )}
          </section>

          {/* Side Effects */}
          <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2 flex justify-between">
              <span>Reported Side Effects</span>
              <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{sideEffects.length}</span>
            </h2>
            {sideEffects.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {sideEffects.map((se) => (
                  <div key={se.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex justify-between items-start mb-1 text-xs">
                      <span className="font-bold text-amber-900 uppercase">{se.severity}</span>
                      <span className="text-amber-700">{se.date}</span>
                    </div>
                    <p className="text-sm text-amber-800">{se.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic py-2">No side effects reported.</p>
            )}
          </section>
        </div>

        {/* ROW 3: QUESTIONS & WELLNESS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Patient Questions */}
          <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2 flex justify-between">
              <span>Unanswered Questions</span>
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{questions.length}</span>
            </h2>
            {questions.length > 0 ? (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {questions.map((q) => (
                  <div key={q.id} className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
                    <span className="text-xl text-blue-400">?</span>
                    <div>
                      <p className="text-xs text-blue-500 font-semibold mb-0.5">{q.date}</p>
                      <p className="text-sm text-blue-900 font-medium">{q.question_text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic py-2">No pending questions.</p>
            )}
          </section>

          {/* Wellness Snapshot */}
          <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2 flex justify-between">
              <span>Latest Wellness Check</span>
              <span className="text-gray-400 font-normal normal-case tracking-normal text-xs">
                {wellness?.date || "No recent data"}
              </span>
            </h2>
            {wellness ? (
              <div className="grid grid-cols-2 gap-4 flex-grow content-center">
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Sleep</p>
                  <p className="font-semibold text-gray-900">{wellness.sleep || "Not logged"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Mood</p>
                  <p className="font-semibold text-gray-900">{wellness.mood || "Not logged"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Activity</p>
                  <p className="font-semibold text-gray-900">{wellness.activity || "Not logged"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Hydration</p>
                  <p className="font-semibold text-gray-900">{wellness.hydration || "Not logged"}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic py-2">Patient has not logged wellness data.</p>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}