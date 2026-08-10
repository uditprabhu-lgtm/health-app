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

  // Relationships
  const [patientId, setPatientId] = useState<string | null>(null);
  const [treatmentId, setTreatmentId] = useState<string | null>(null);

  // Form State
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("Mild");

  useEffect(() => {
    async function fetchContext() {
      setLoading(true);

      // 1. Get the current patient
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (patient) {
        setPatientId(patient.id);

        // 2. Get the patient's active treatment to link the report to
        const { data: treatment } = await supabase
          .from("treatments")
          .select("id")
          .eq("patient_id", patient.id)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (treatment) {
          setTreatmentId(treatment.id);
        }
      }

      setLoading(false);
    }

    fetchContext();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId) {
      setErrorMsg("Patient context not found. Cannot submit report.");
      return;
    }

    if (!description.trim()) {
      setErrorMsg("Please describe what happened.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    const todayStr = new Date().toISOString().split("T")[0];

    // 3. Save the side effect report to the database
    // Type is strictly set to "side_effect" to differentiate from symptoms
    const { error } = await supabase.from("reports").insert([
      {
        patient_id: patientId,
        treatment_id: treatmentId, // Links to active treatment
        type: "side_effect",
        description: description,
        severity: severity,
        date: todayStr,
      },
    ]);

    if (error) {
      console.error("Database Error:", error);
      setErrorMsg(`Failed to record experience: ${error.message}`);
      setSubmitting(false);
    } else {
      // Show confirmation UI, then redirect back to dashboard
      setSuccess(true);
      setTimeout(() => {
        router.push("/patient");
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-500 font-medium">Loading form...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 py-4 px-6 sm:px-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Side Effect</h1>
          <p className="text-sm text-gray-500">Record an experience related to your medication</p>
        </div>
        <Link
          href="/patient"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          &larr; Cancel
        </Link>
      </header>

      <main className="max-w-2xl mx-auto p-6 sm:p-8">
        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-xl text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl">
              ✓
            </div>
            <h2 className="text-xl font-bold text-emerald-900">Experience Recorded</h2>
            <p className="text-emerald-700 text-sm">
              Your report has been securely saved to your history. Returning to your dashboard...
            </p>
          </div>
        ) : (
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm">
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  What happened?
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., I felt slightly nauseous about an hour after taking the medication..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white resize-none"
                  required
                />
              </div>

              {/* Severity Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Severity
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["Mild", "Moderate", "Severe"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSeverity(level)}
                      className={`py-3 text-sm font-medium rounded-lg border transition ${
                        severity === level
                          ? "bg-amber-50 border-amber-600 text-amber-700"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-amber-600 text-white font-medium text-base rounded-lg hover:bg-amber-700 transition disabled:opacity-50 shadow-sm"
                >
                  {submitting ? "Saving..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}