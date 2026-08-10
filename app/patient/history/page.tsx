"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function MedicalHistoryPage() {
  const router = useRouter();
  const [condition, setCondition] = useState("");
  const [notes, setNotes] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("patients").select("id").limit(1).maybeSingle().then(({ data }) => {
      if (data) setPatientId(data.id);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;

    setSubmitting(true);
    const { error } = await supabase.from("medical_history").insert([
      {
        patient_id: patientId,
        condition,
        notes,
      },
    ]);

    if (!error) {
      router.push("/patient");
    } else {
      console.error("Error saving history:", error.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      <header className="bg-white border-b border-gray-200 py-4 px-8 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold">Add Medical History</h1>
        <Link href="/patient" className="text-sm font-medium text-blue-600 hover:text-blue-800">
          &larr; Dashboard
        </Link>
      </header>
      <main className="max-w-xl mx-auto p-8">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Condition / Past Illness</label>
            <input
              type="text"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="e.g., Asthma, Past Surgeries, Allergies"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide context or dates..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white resize-none"
              rows={3}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            {submitting ? "Saving..." : "Save Medical History"}
          </button>
        </form>
      </main>
    </div>
  );
}