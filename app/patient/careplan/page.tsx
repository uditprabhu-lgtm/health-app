"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface Treatment {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  start_date: string;
  end_date: string;
  consultation_id?: string;
}

interface Consultation {
  diagnosis: string;
  instructions: string;
}

export default function CarePlanPage() {
  const [loading, setLoading] = useState(true);
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [dbError, setDbError] = useState("");

  useEffect(() => {
    async function loadCarePlan() {
      setLoading(true);
      setDbError("");

      // 1. Fetch active patient
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (patientError || !patient) {
        setDbError(patientError?.message || "Patient record not found.");
        setLoading(false);
        return;
      }

      // 2. Fetch the latest treatment plan securely without joins
      const { data: treatmentData, error: treatmentError } = await supabase
        .from("treatments")
        .select("*")
        .eq("patient_id", patient.id)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (treatmentError) {
        setDbError(`Database Error: ${treatmentError.message}`);
        setLoading(false);
        return;
      }

      if (treatmentData) {
        setTreatment(treatmentData);

        // 3. Fetch consultation separately if consultation_id exists
        if (treatmentData.consultation_id) {
          const { data: consultationData } = await supabase
            .from("consultations")
            .select("diagnosis, instructions")
            .eq("id", treatmentData.consultation_id)
            .maybeSingle();

          if (consultationData) {
            setConsultation(consultationData);
          }
        }
      }

      setLoading(false);
    }

    loadCarePlan();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-500 font-medium">Loading your care plan...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      <header className="bg-white border-b border-gray-200 py-4 px-6 sm:px-8 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Your Care Plan</h1>
          <p className="text-xs text-gray-500">Active medical guidelines</p>
        </div>
        <Link href="/patient" className="text-sm font-medium text-blue-600 hover:text-blue-800">
          &larr; Patient Dashboard
        </Link>
      </header>

      <main className="max-w-2xl mx-auto p-6 sm:p-8 space-y-6">
        {dbError && (
          <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-center space-y-2">
            <h2 className="text-base font-bold text-red-900">Database Connection Error</h2>
            <p className="text-xs text-red-700 font-mono bg-white p-3 rounded border border-red-100">{dbError}</p>
          </div>
        )}

        {!treatment ? (
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
            <h2 className="text-lg font-bold text-gray-900">No Active Care Plan</h2>
            <p className="text-sm text-gray-500 mt-1">Your doctor has not prescribed an active treatment plan yet.</p>
          </div>
        ) : (
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Diagnosis</p>
              <h2 className="text-2xl font-black text-gray-900">{consultation?.diagnosis || "General Treatment"}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Medication</p>
                <p className="text-lg font-bold text-blue-900">{treatment.medication}</p>
                <p className="text-sm text-gray-600 mt-0.5">{treatment.dosage}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Schedule</p>
                <p className="text-sm font-bold text-gray-900">{treatment.frequency}</p>
                <p className="text-xs text-gray-500 mt-1">Duration: {treatment.duration}</p>
              </div>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Doctor&apos;s Instructions</p>
              <p className="text-sm text-gray-800 leading-relaxed">
                {consultation?.instructions || "Take medication as prescribed and maintain adequate hydration."}
              </p>
            </div>

            <div className="text-xs text-gray-400 pt-2 border-t border-gray-100 flex justify-between">
              <span>Start Date: {treatment.start_date}</span>
              <span>End Date: {treatment.end_date}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}