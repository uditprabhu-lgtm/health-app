"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ReportSymptomsPage() {
  const [patientId, setPatientId] = useState<string | null>(null);
  const [symptom, setSymptom] = useState("");
  const [severity, setSeverity] = useState("mild");
  const [requestAppointment, setRequestAppointment] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    document.title = "Diyagnosis | Report Symptoms";
    const storedId = sessionStorage.getItem("patientId");
    if (storedId) setPatientId(storedId);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      alert("No patient session found. Please go back and select an account.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("symptom_logs").insert([
      {
        patient_id: patientId,
        symptom_description: symptom,
        severity: severity,
        requires_appointment: requestAppointment,
        preferred_date: requestAppointment && appointmentDate ? appointmentDate : null,
      },
    ]);

    setIsSubmitting(false);

    if (error) {
      console.error("Error logging symptom:", error);
      alert("Failed to submit. Check console for details.");
    } else {
      setSuccess(true);
      // Reset form
      setSymptom("");
      setSeverity("mild");
      setRequestAppointment(false);
      setAppointmentDate("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      <header className="bg-white border-b border-gray-200 py-4 px-8 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Report Symptoms</h1>
          <p className="text-xs text-gray-500">Log how you are feeling</p>
        </div>
        <Link href="/patient" className="text-sm font-medium text-blue-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
      </header>

      <main className="max-w-2xl mx-auto p-8 mt-6">
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          {success ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                ✓
              </div>
              <h2 className="text-xl font-bold text-gray-900">Symptoms Logged</h2>
              <p className="text-gray-500 text-sm">
                {requestAppointment 
                  ? "Your doctor has been notified and your appointment request has been sent." 
                  : "Your symptoms have been successfully added to your chart."}
              </p>
              <button 
                onClick={() => setSuccess(false)}
                className="mt-4 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg text-sm transition"
              >
                Log Another Symptom
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Symptom Description */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">What are you experiencing?</label>
                <textarea
                  required
                  rows={4}
                  placeholder="E.g., I've had a persistent headache since yesterday morning..."
                  value={symptom}
                  onChange={(e) => setSymptom(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                />
              </div>

              {/* Severity Scale */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">Severity Level</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSeverity("mild")}
                    className={`py-2 px-4 rounded-lg font-bold text-sm border transition ${
                      severity === "mild" ? "bg-amber-100 border-amber-400 text-amber-800" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Mild
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity("moderate")}
                    className={`py-2 px-4 rounded-lg font-bold text-sm border transition ${
                      severity === "moderate" ? "bg-orange-100 border-orange-400 text-orange-800" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Moderate
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity("severe")}
                    className={`py-2 px-4 rounded-lg font-bold text-sm border transition ${
                      severity === "severe" ? "bg-red-100 border-red-400 text-red-800" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Severe
                  </button>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Appointment Booking Integration */}
              <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requestAppointment}
                    onChange={(e) => setRequestAppointment(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="block text-sm font-bold text-blue-900">I need a doctor's appointment</span>
                    <span className="block text-xs text-blue-700">Request a follow-up consultation regarding these symptoms.</span>
                  </div>
                </label>

                {requestAppointment && (
                  <div className="pt-2 pl-8">
                    <label className="block text-xs font-bold text-blue-800 mb-1">Preferred Date</label>
                    <input
                      type="date"
                      required={requestAppointment}
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="p-2 border border-blue-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>

            </form>
          )}
        </div>
      </main>
    </div>
  );
}