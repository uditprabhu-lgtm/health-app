"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function AskDoctorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Context State
  const [patientId, setPatientId] = useState<string | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  // Form State
  const [question, setQuestion] = useState("");

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

        // 2. Get the most relevant (latest/upcoming) appointment to link this to
        const { data: appointment } = await supabase
          .from("appointments")
          .select("id")
          .eq("patient_id", patient.id)
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (appointment) {
          setAppointmentId(appointment.id);
        }
      }

      setLoading(false);
    }

    fetchContext();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId) {
      setErrorMsg("Patient context not found. Cannot submit question.");
      return;
    }

    if (!question.trim()) {
      setErrorMsg("Please enter a question before submitting.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    const todayStr = new Date().toISOString().split("T")[0];

    // 3. Save the question to the database (populating both column variants to prevent schema errors)
    const { error } = await supabase.from("questions").insert([
      {
        patient_id: patientId,
        appointment_id: appointmentId,
        question: question,         // Satisfies schemas expecting 'question'
        question_text: question,    // Satisfies schemas expecting 'question_text'
        answered: false,
        date: todayStr,
      },
    ]);

    if (error) {
      console.error("Database Error:", error);
      setErrorMsg(`Failed to send question: ${error.message}`);
      setSubmitting(false);
    } else {
      // Show confirmation UI
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
          <h1 className="text-2xl font-bold text-gray-900">Ask Doctor</h1>
          <p className="text-sm text-gray-500">Send a structured question for your follow-up</p>
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
            <h2 className="text-xl font-bold text-emerald-900">Question sent to your doctor.</h2>
            <p className="text-emerald-700 text-sm">
              They will review it during your next consultation. Returning to dashboard...
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
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  What would you like to ask your doctor?
                </label>
                <textarea
                  rows={5}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Type your question here..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white resize-none"
                  required
                />
              </div>

              <div className="pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 text-white font-medium text-base rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
                >
                  {submitting ? "Sending..." : "Send Question"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}