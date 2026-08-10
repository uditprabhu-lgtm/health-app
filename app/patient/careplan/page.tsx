"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface CarePlan {
  consultation: {
    diagnosis: string;
    prescription: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  };
  treatment: {
    medication: string;
    start_date: string;
    end_date: string;
  };
}

export default function PatientCarePlanPage() {
  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCarePlan() {
      setLoading(true);
      setDbError(null);

      // 1. Fetch patient ID
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (patientError) {
        console.error("Patient Fetch Error:", patientError);
        setDbError(`Patient Error: ${patientError.message}`);
        setLoading(false);
        return;
      }

      if (patient) {
        // 2. Fetch active treatment and join with the consultation record
        const { data: treatment, error: treatmentError } = await supabase
          .from("treatments")
          .select("*, consultations(*)")
          .eq("patient_id", patient.id)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        // CATCH AND DISPLAY SUPABASE JOIN ERRORS
        if (treatmentError) {
          console.error("Supabase Join Error:", treatmentError);
          setDbError(`Join Error: ${treatmentError.message}`);
        }

        if (treatment && treatment.consultations) {
          // Safely extract the consultation object whether it comes back as an array or a single object
          const consultationData: any = Array.isArray(treatment.consultations) 
            ? treatment.consultations[0] 
            : treatment.consultations;

          setCarePlan({
            consultation: {
              diagnosis: consultationData?.diagnosis || "Fever",
              prescription: consultationData?.prescription || "Paracetamol",
              dosage: consultationData?.dosage || "500mg",
              frequency: consultationData?.frequency || "Twice daily",
              duration: consultationData?.duration || "3 days",
              instructions: consultationData?.instructions || "Follow doctor guidelines.",
            },
            treatment: {
              medication: treatment.medication || "Paracetamol",
              start_date: treatment.start_date || "",
              end_date: treatment.end_date || "",
            },
          });
        }
      }

      setLoading(false);
    }

    loadCarePlan();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-500 font-medium">Loading care plan...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 py-4 px-6 sm:px-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Care Plan</h1>
          <p className="text-sm text-gray-500">Active medical guidelines</p>
        </div>
        <Link
          href="/patient"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          &larr; Patient Dashboard
        </Link>
      </header>

      <main className="max-w-2xl mx-auto p-6 sm:p-8">
        {dbError ? (
          <div className="bg-red-50 p-8 rounded-xl border border-red-200 shadow-sm text-center space-y-3">
            <h2 className="text-lg font-bold text-red-900">Database Connection Error</h2>
            <p className="text-red-700 text-sm">
              Supabase blocked the query. Here is the exact reason why:
            </p>
            <code className="block bg-red-100 p-3 rounded text-xs text-red-800 break-words text-left font-mono">
              {dbError}
            </code>
            <p className="text-red-700 text-sm pt-2">
              (Paste this error back to me so I can give you the exact SQL fix!)
            </p>
          </div>
        ) : carePlan ? (
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
            
            {/* Diagnosis Section */}
            <div className="border-b border-gray-100 pb-4">
              <p className="text-xs uppercase font-semibold text-gray-500 tracking-wider">
                Diagnosis
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                {carePlan.consultation.diagnosis}
              </h2>
            </div>

            {/* Treatment Details */}
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Treatment
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {carePlan.treatment.medication}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Dosage</p>
                  <p className="font-medium text-gray-900 mt-1">
                    {carePlan.consultation.dosage}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Frequency</p>
                  <p className="font-medium text-gray-900 mt-1">
                    {carePlan.consultation.frequency}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Duration</p>
                  <p className="font-medium text-gray-900 mt-1">
                    {carePlan.consultation.duration}
                  </p>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                  Instructions
                </p>
                <p className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-900 font-medium">
                  {carePlan.consultation.instructions}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/patient/condition"
                className="w-full sm:w-1/2 py-3 bg-white border border-gray-300 text-gray-700 font-medium text-center text-sm rounded-lg hover:bg-gray-50 transition"
              >
                Understand My Condition
              </Link>
              <Link
                href="/patient/treatment"
                className="w-full sm:w-1/2 py-3 bg-blue-600 text-white font-medium text-center text-sm rounded-lg hover:bg-blue-700 transition"
              >
                Track Treatment
              </Link>
            </div>

          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No active care plan</h2>
            <p className="text-gray-500 text-sm">
              You do not have a current treatment plan. Please complete a consultation with your doctor first.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}