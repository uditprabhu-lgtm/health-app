"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface Patient {
  id: string;
  name: string;
  age: number;
}

export default function DoctorConsultationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);

  // Form states
  const [diagnosis, setDiagnosis] = useState("Fever");
  const [prescription, setPrescription] = useState("Paracetamol");
  const [dosage, setDosage] = useState("650 mg");
  const [frequency, setFrequency] = useState("Twice daily");
  const [duration, setDuration] = useState("5");
  const [instructions, setInstructions] = useState("Take after food and maintain adequate hydration.");

  useEffect(() => {
    async function fetchActivePatient() {
      setLoading(true);
      // Fetch Udit (the active patient in our MVP)
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, age")
        .limit(1)
        .maybeSingle();

      if (data) {
        setPatient(data);
      } else if (error) {
        console.error("Error fetching patient:", error.message);
      }
      setLoading(false);
    }
    fetchActivePatient();
  }, []);

  const handleSaveCarePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;

    setSaving(true);

    // 1. Save Consultation
    const { data: consultationData, error: consultationError } = await supabase
      .from("consultations")
      .insert([
        {
          diagnosis,
          prescription,
          dosage,
          frequency,
          duration: `${duration} days`,
          instructions,
        },
      ])
      .select("id")
      .single();

    if (consultationError) {
      console.error("Consultation error:", consultationError.message);
      setSaving(false);
      return;
    }

    // 2. Save Active Treatment Plan linked to Udit
    const todayStr = new Date().toISOString().split("T")[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(duration || "5"));
    const endDateStr = endDate.toISOString().split("T")[0];

    const { error: treatmentError } = await supabase.from("treatments").insert([
      {
        patient_id: patient.id,
        consultation_id: consultationData.id,
        medication: prescription,
        dosage,
        frequency,
        duration: `${duration} days`,
        start_date: todayStr,
        end_date: endDateStr,
      },
    ]);

    if (treatmentError) {
      console.error("Treatment error:", treatmentError.message);
      setSaving(false);
    } else {
      router.push("/doctor/patient");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 font-medium">Loading patient context...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      <header className="bg-white border-b border-gray-200 py-4 px-8 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Doctor Consultation</h1>
          <p className="text-xs text-gray-500">Create & Save Patient Care Plan</p>
        </div>
        <Link href="/doctor" className="text-sm font-medium text-blue-600 hover:text-blue-800">
          &larr; Back to Doctor Dashboard
        </Link>
      </header>

      <main className="max-w-2xl mx-auto p-8">
        <form onSubmit={handleSaveCarePlan} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
          {/* Real Patient Badge */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Patient</p>
              <h2 className="text-lg font-bold text-gray-900">{patient ? patient.name : "Udit Nitin Prabhu"}</h2>
            </div>
            <span className="px-3 py-1 bg-white border border-blue-200 text-blue-800 text-xs font-bold rounded-full shadow-sm">
              Age: {patient ? patient.age : 19}
            </span>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Diagnosis</label>
            <select
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="Fever">Fever</option>
              <option value="Viral Infection">Viral Infection</option>
              <option value="Hypertension">Hypertension</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Prescription / Medication</label>
            <input
              type="text"
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Dosage</label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Frequency</label>
              <input
                type="text"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Duration (number of days)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Instructions</label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition shadow-sm"
          >
            {saving ? "Saving Care Plan..." : "Save Care Plan"}
          </button>
        </form>
      </main>
    </div>
  );
}