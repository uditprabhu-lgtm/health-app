"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface Patient {
  id: string;
  name: string;
}

export default function DoctorFollowUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"summary" | "update">("summary");

  // Context Data
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [activeTreatmentId, setActiveTreatmentId] = useState<string | null>(null);
  
  // Clinical Summary Data
  const [diagnosis, setDiagnosis] = useState("");
  const [adherence, setAdherence] = useState({ percentage: 0, taken: 0, missed: 0 });
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [sideEffects, setSideEffects] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [wellness, setWellness] = useState<any | null>(null);

  // Form State for "Update Treatment"
  const [formMedication, setFormMedication] = useState("");
  const [formDosage, setFormDosage] = useState("");
  const [formFrequency, setFormFrequency] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formInstructions, setFormInstructions] = useState("");

  useEffect(() => {
    async function loadFollowUpData() {
      setLoading(true);

      const { data: patientData } = await supabase
        .from("patients")
        .select("id, name")
        .limit(1)
        .maybeSingle();

      if (patientData) {
        setPatient(patientData);

        // Get Latest Appointment for Context
        const { data: appData } = await supabase
          .from("appointments")
          .select("id")
          .eq("patient_id", patientData.id)
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (appData) setAppointmentId(appData.id);

        // Get Active Treatment & Diagnosis
        const { data: treatment } = await supabase
          .from("treatments")
          .select("*, consultations(*)")
          .eq("patient_id", patientData.id)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (treatment) {
          setActiveTreatmentId(treatment.id);
          
          const consultationData: any = Array.isArray(treatment.consultations)
            ? treatment.consultations[0]
            : treatment.consultations;

          const currentDiagnosis = consultationData?.diagnosis || "Unknown Diagnosis";
          setDiagnosis(currentDiagnosis);

          // Pre-fill update form with current values
          setFormMedication(treatment.medication || "");
          setFormDosage(treatment.dosage || consultationData?.dosage || "");
          setFormFrequency(treatment.frequency || consultationData?.frequency || "");
          setFormDuration(treatment.duration ? treatment.duration.replace(/\D/g, '') : ""); 
          setFormInstructions(consultationData?.instructions || "");

          // Get Adherence
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

          // Get Reports
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

        // Get Pending Questions
        const { data: qData } = await supabase
          .from("questions")
          .select("id, question_text, date")
          .eq("patient_id", patientData.id)
          .eq("answered", false)
          .order("date", { ascending: false });
        if (qData) setQuestions(qData);

        // Get Latest Wellness
        const { data: wData } = await supabase
          .from("wellness")
          .select("date, sleep, mood, activity, hydration")
          .eq("patient_id", patientData.id)
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (wData) setWellness(wData);
      }
      setLoading(false);
    }

    loadFollowUpData();
  }, []);

  const handleContinueTreatment = async () => {
    setSaving(true);
    // MVP: "Continue" just acknowledges the review and clears pending questions.
    if (patient) {
      await supabase.from("questions").update({ answered: true }).eq("patient_id", patient.id).eq("answered", false);
    }
    router.push("/doctor/patient");
  };

  const handleEndTreatment = async () => {
    setSaving(true);
    const todayStr = new Date().toISOString().split("T")[0];
    if (activeTreatmentId) {
      await supabase.from("treatments").update({ end_date: todayStr }).eq("id", activeTreatmentId);
    }
    if (patient) {
      await supabase.from("questions").update({ answered: true }).eq("patient_id", patient.id).eq("answered", false);
    }
    router.push("/doctor/patient");
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !appointmentId) return;

    setSaving(true);

    const startDate = new Date();
    const numDays = parseInt(formDuration, 10) || 1;
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + numDays);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // 1. Create a new Consultation record with the updated regimen
    const { data: newConsultation, error: cError } = await supabase
      .from("consultations")
      .insert([
        {
          appointment_id: appointmentId,
          diagnosis: diagnosis, // Carry over previous diagnosis
          prescription: formMedication,
          dosage: formDosage,
          frequency: formFrequency,
          duration: `${formDuration} days`,
          instructions: formInstructions,
        },
      ])
      .select()
      .single();

    if (!cError && newConsultation) {
      // 2. Create the new Treatment record
      await supabase.from("treatments").insert([
        {
          patient_id: patient.id,
          consultation_id: newConsultation.id,
          medication: formMedication,
          dosage: formDosage,
          frequency: formFrequency,
          duration: `${formDuration} days`,
          start_date: startDateStr,
          end_date: endDateStr,
        },
      ]);
      
      // 3. Mark previous treatment as ended today (if it existed)
      if (activeTreatmentId) {
        await supabase.from("treatments").update({ end_date: startDateStr }).eq("id", activeTreatmentId);
      }

      // 4. Clear pending questions
      await supabase.from("questions").update({ answered: true }).eq("patient_id", patient.id).eq("answered", false);
    }

    router.push("/doctor/patient");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-500 font-medium">Loading follow-up context...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      <header className="bg-white border-b border-gray-200 py-4 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow Up Review</h1>
          <p className="text-sm text-gray-500">{patient?.name}</p>
        </div>
        <Link href="/doctor/patient" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
          &larr; Back
        </Link>
      </header>

      <main className="max-w-3xl mx-auto p-6 sm:p-8">
        {view === "summary" ? (
          <div className="space-y-6">
            
            {/* SNAPSHOT REVIEW */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
              
              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-6">
                <div>
                  <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Previous Diagnosis</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{diagnosis}</p>
                </div>
                <div>
                  <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Current Plan</p>
                  <p className="text-lg font-bold text-blue-700 mt-1">{formMedication}</p>
                  <p className="text-sm text-gray-600">{formDosage} • {formFrequency}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-6 text-center">
                <div>
                  <p className="text-xl font-bold text-gray-900">{adherence.percentage}%</p>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Adherence</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-red-600">{symptoms.length + sideEffects.length}</p>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Total Reports</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-blue-600">{questions.length}</p>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Questions</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Wellness Snapshot</p>
                {wellness ? (
                  <div className="flex gap-4 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p>Sleep: <span className="font-semibold">{wellness.sleep}h</span></p>
                    <p>Mood: <span className="font-semibold">{wellness.mood}</span></p>
                    <p>Activity: <span className="font-semibold">{wellness.activity}</span></p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No wellness data logged.</p>
                )}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleContinueTreatment}
                disabled={saving}
                className="flex-1 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm"
              >
                Continue Treatment
              </button>
              <button
                onClick={() => setView("update")}
                className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                Update Treatment
              </button>
              <button
                onClick={handleEndTreatment}
                disabled={saving}
                className="flex-1 py-3 bg-white border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition disabled:opacity-50 shadow-sm"
              >
                End Treatment
              </button>
            </div>
          </div>
        ) : (
          
          /* UPDATE TREATMENT FORM */
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Update Care Plan</h2>
              <button onClick={() => setView("summary")} className="text-sm text-gray-500 hover:text-gray-800">
                Cancel
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medication</label>
                <input
                  type="text"
                  value={formMedication}
                  onChange={(e) => setFormMedication(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                  <input
                    type="text"
                    value={formDosage}
                    onChange={(e) => setFormDosage(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <input
                    type="text"
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (number of days)</label>
                <input
                  type="number"
                  min="1"
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                <textarea
                  rows={3}
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  required
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
                >
                  {saving ? "Saving Updated Plan..." : "Save Updated Treatment"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}