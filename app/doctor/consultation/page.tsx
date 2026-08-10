"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface Patient {
  id: string;
  name: string;
  age: number;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  patient_id: string;
  doctor_id: string;
  patients: Patient | null;
}

export default function DoctorConsultationPage() {
  const router = useRouter();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form state initialized with demo default values
  const [diagnosis, setDiagnosis] = useState("Fever");
  const [prescription, setPrescription] = useState("Paracetamol");
  const [dosage, setDosage] = useState("500 mg");
  const [frequency, setFrequency] = useState("Twice daily");
  const [duration, setDuration] = useState("3");
  const [instructions, setInstructions] = useState(
    "Take after food and maintain adequate hydration."
  );

  useEffect(() => {
    async function loadAppointment() {
      setLoading(true);

      // Fetch the latest appointment with patient details
      const { data, error } = await supabase
        .from("appointments")
        .select("id, date, time, status, patient_id, doctor_id, patients(id, name, age)")
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching appointment:", error);
        setErrorMsg("Failed to load appointment details.");
      } else if (data) {
        setAppointment(data as unknown as Appointment);
      }

      setLoading(false);
    }

    loadAppointment();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appointment) {
      setErrorMsg("No active appointment found to link this consultation to.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      // 1. Create Consultation Record
      const { data: consultation, error: consultationError } = await supabase
        .from("consultations")
        .insert([
          {
            appointment_id: appointment.id,
            diagnosis: diagnosis,
            prescription: prescription,
            dosage: dosage,
            frequency: frequency,
            duration: `${duration} days`,
            instructions: instructions,
          },
        ])
        .select()
        .single();

      if (consultationError || !consultation) {
        throw new Error(
          consultationError?.message || "Failed to create consultation record."
        );
      }

      // 2. Calculate Start and End Dates for Treatment
      const startDate = new Date();
      const numDays = parseInt(duration, 10) || 1;
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + numDays);

      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      // 3. Create Associated Treatment Record
      const { error: treatmentError } = await supabase.from("treatments").insert([
        {
          patient_id: appointment.patient_id,
          consultation_id: consultation.id,
          medication: prescription,
          dosage: dosage,
          frequency: frequency,
          duration: `${duration} days`,
          start_date: startDateStr,
          end_date: endDateStr,
        },
      ]);

      if (treatmentError) {
        throw new Error(treatmentError.message);
      }

      // 4. Update Appointment Status to Completed
      await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", appointment.id);

      // Redirect to Doctor Patient Summary
      router.push("/doctor/patient");
    } catch (err: any) {
      console.error("Error saving care plan:", err);
      setErrorMsg(err.message || "An unexpected error occurred while saving.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-500 font-medium">Loading consultation session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 py-4 px-6 sm:px-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Consultation</h1>
          <p className="text-sm text-gray-500">Create & Save Patient Care Plan</p>
        </div>
        <Link
          href="/doctor"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          &larr; Back to Doctor Dashboard
        </Link>
      </header>

      <main className="max-w-2xl mx-auto p-6 sm:p-8">
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {errorMsg}
          </div>
        )}

        <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
          {/* Patient Header Badge */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-blue-600">
                Patient
              </p>
              <h2 className="text-xl font-bold text-gray-900">
                {appointment?.patients?.name || "Udit"}
              </h2>
            </div>
            <span className="text-sm font-semibold bg-blue-200 text-blue-800 px-3 py-1 rounded-full">
              Age: {appointment?.patients?.age || 19}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Diagnosis (Restricted to 'Fever') */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagnosis
              </label>
              <select
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                required
              >
                <option value="Fever">Fever</option>
              </select>
            </div>

            {/* Prescription Medication */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prescription
              </label>
              <input
                type="text"
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                placeholder="e.g. Paracetamol"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                required
              />
            </div>

            {/* Dosage & Frequency Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dosage
                </label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 500 mg"
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <input
                  type="text"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="e.g. Twice daily"
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  required
                />
              </div>
            </div>

            {/* Duration (Days) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (number of days)
              </label>
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="3"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                required
              />
            </div>

            {/* Instructions Multiline Textarea */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructions
              </label>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Take after food and maintain adequate hydration."
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white resize-none"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-emerald-600 text-white font-medium text-base rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm"
              >
                {saving ? "Saving Care Plan..." : "Save Care Plan"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}