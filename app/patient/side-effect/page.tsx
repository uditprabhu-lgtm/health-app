"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ReportSideEffectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [patientId, setPatientId] = useState<string | null>(null);
  const [treatmentId, setTreatmentId] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  useEffect(() => {
    async function fetchContext() {
      setLoading(true);
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (patient) {
        setPatientId(patient.id);
        const { data: treatment } = await supabase
          .from("treatments")
          .select("id")
          .eq("patient_id", patient.id)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (treatment) setTreatmentId(treatment.id);
      }
      setLoading(false);
    }
    fetchContext();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      setErrorMsg("Patient context not found.");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Please describe the side effect.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    const todayStr = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("reports").insert([
      {
        patient_id: patientId,
        treatment_id: treatmentId,
        type: "side_effect",
        description: description,
        date: todayStr,
      },
    ]);

    if (error) {
      setErrorMsg(`Failed to save: ${error.message}`);
      setSubmitting(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/patient"), 2000);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 py-4 px-8 flex justify-between items-center">
        <h1 className="text-xl font-bold">Report Medication Side Effect</h1>
        <Link href="/patient" className="text-sm text-blue-600 font-medium">&larr; Cancel</Link>
      </header>
      <main className="max-w-2xl mx-auto p-8">
        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-xl text-center space-y-2">
            <h2 className="text-lg font-bold text-emerald-900">Side Effect Logged</h2>
            <p className="text-sm text-emerald-700">Returning to dashboard...</p>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
            {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{errorMsg}</div>}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Describe the Side Effect</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Mild nausea after taking the afternoon dose..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
              >
                {submitting ? "Saving..." : "Submit Side Effect"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}