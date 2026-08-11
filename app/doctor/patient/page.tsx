"use client";

export const dynamic = 'force-dynamic';

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

interface MedicalHistory {
  id: string;
  condition: string;
  notes: string;
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
  const [history, setHistory] = useState<MedicalHistory[]>([]);

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

        // 2. Fetch Active Treatment (Separately without joins)
        const { data: treatment } = await supabase
          .from("treatments")
          .select("*")
          .eq("patient_id", patientData.id)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        let consultationDiagnosis = "General Treatment";
        let consultationDosage = "";
        let consultationFrequency = "";
        let consultationDuration = "";

        if (treatment) {
          // If treatment has a consultation_id, fetch it separately
          if (treatment.consultation_id) {
            const { data: consultation } = await supabase
              .from("consultations")
              .select("diagnosis, dosage, frequency, duration")
              .eq("id", treatment.consultation_id)
              .maybeSingle();

            if (consultation) {
              consultationDiagnosis = consultation.diagnosis || consultationDiagnosis;
              consultationDosage = consultation.dosage || "";
              consultationFrequency = consultation.frequency || "";
              consultationDuration = consultation.duration || "";
            }
          }

          setClinical({
            diagnosis: consultationDiagnosis,
            medication: treatment.medication,
            dosage: treatment.dosage || consultationDosage || "N/A",
            frequency: treatment.frequency || consultationFrequency || "N/A",
            duration: treatment.duration || consultationDuration || "N/A",
          });

          // 3. Fetch Adherence Logs for this treatment
          const { data: logs } = await supabase
            .from("adherence")
            .select("status")
            .eq("treatment_id", treatment.id);

          if (logs && logs.length > 0) {
            const taken = logs.filter((l) => l.status === "taken").length;
            const missed = logs.filter((l) => l.status === "missed").length;
            const total = taken + missed;
            setAdherence({
              percentage: total > 0 ? Math.round((taken / total) * 100) : 0,
              taken,
              missed,
            });
          }
        } else {
          // Fallback: Check if there's at least a consultation if treatment is missing
          const { data: fallbackConsultation } = await supabase
            .from("consultations")
            .select("diagnosis, prescription, dosage, frequency, duration")
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (fallbackConsultation) {
            setClinical({
              diagnosis: fallbackConsultation.diagnosis || "Fever",
              medication: fallbackConsultation.prescription || "Paracetamol",
              dosage: fallbackConsultation.dosage || "650mg",
              frequency: fallbackConsultation.frequency || "Twice daily",
              duration: fallbackConsultation.duration || "5 days",
            });
          }
        }

        // 4. Fetch Patient Reports (Symptoms & Side effects)
        const { data: reports } = await supabase
          .from("reports")
          .select("id, type, description, severity, date")
          .eq("patient_id", patientData.id)
          .order("date", { ascending: false });

        if (reports) {
          setSymptoms(reports.filter((r) => r.type === "symptom"));
          setSideEffects(reports.filter((r) => r.type === "side_effect" || r.type === "side-effect"));
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

        // 7. Fetch Medical History
        const { data: hData } = await supabase
          .from("medical_history")
          .select("id, condition, notes")
          .eq("patient_id", patientData.id);

        if (hData) {
          setHistory(hData);
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
          <Link
            href="/doctor/consultation"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition shadow-sm"
          >
            Start New Consultation
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 sm:p-8 space-y-6">
        
        {/* ROW 1: CLINICAL & ADHERENCE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Clinical Context & Medical History */}
          <section className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">
              Clinical Context & Medical History
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
              <div>
                <p className="text-sm text-gray-500 mb-1">Current Diagnosis & Treatment</p>
                {clinical ? (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 space-y-1">
                    <p className="font-bold text-blue-900 text-base">{clinical.diagnosis}</p>
                    <p className="text-sm text-blue-800 font-semibold">{clinical.medication} ({clinical.dosage})</p>
                    <p className="text-xs text-blue-700">{clinical.frequency} • {clinical.duration}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic p-2">No active clinical data found.</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Past Medical History</p>
                {history.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {history.map((h) => (
                      <div key={h.id} className="bg-gray-50 p-2.5 rounded border border-gray-100 text-xs">
                        <p className="font-bold text-gray-800">{h.condition}</p>
                        {h.notes && <p className="text-gray-600 mt-0.5">{h.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic p-2">No past history recorded.</p>
                )}
              </div>
            </div>
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
                      <span className="font-bold text-gray-800 uppercase">{s.severity || "Standard"}</span>
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
                      <span className="font-bold text-amber-900 uppercase">{se.severity || "Standard"}</span>
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