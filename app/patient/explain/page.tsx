"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ExplainCarePage() {
  const [loading, setLoading] = useState(true);
  const [hasFeverParacetamol, setHasFeverParacetamol] = useState(false);
  const [treatmentDetails, setTreatmentDetails] = useState<any>(null);

  useEffect(() => {
    async function checkActivePrescription() {
      setLoading(true);
      const patientId = sessionStorage.getItem("patientId");
      if (!patientId) {
        setLoading(false);
        return;
      }

      // 1. Fetch active treatment for this patient
      const { data: treatment } = await supabase
        .from("treatments")
        .select("*")
        .eq("patient_id", patientId)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (treatment) {
        let diagnosis = "";
        
        // 2. Fetch linked consultation diagnosis if available
        if (treatment.consultation_id) {
          const { data: consultation } = await supabase
            .from("consultations")
            .select("diagnosis")
            .eq("id", treatment.consultation_id)
            .maybeSingle();
          if (consultation) {
            diagnosis = consultation.diagnosis || "";
          }
        }

        const med = treatment.medication?.toLowerCase() || "";
        const diag = diagnosis.toLowerCase() || "";

        // 3. Strict check: Must be Fever + Paracetamol
        if (diag.includes("fever") && med.includes("paracetamol")) {
          setHasFeverParacetamol(true);
          setTreatmentDetails({
            medication: treatment.medication,
            dosage: treatment.dosage,
            frequency: treatment.frequency,
            duration: treatment.duration,
          });
        }
      }

      setLoading(false);
    }

    checkActivePrescription();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 font-medium">Checking care plan insights...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      <header className="bg-white border-b border-gray-200 py-4 px-8 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-bold">Understanding Your Care</h1>
          <p className="text-xs text-gray-500">Plain-language medical breakdown</p>
        </div>
        <Link href="/patient" className="text-sm font-medium text-blue-600 hover:text-blue-800">
          &larr; Patient Dashboard
        </Link>
      </header>

      <main className="max-w-3xl mx-auto p-8 space-y-6">
        {!hasFeverParacetamol ? (
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center space-y-3">
            <h2 className="text-lg font-bold text-gray-900">No Explanation Available</h2>
            <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
              Condition breakdowns are currently only available when a diagnosis of <strong>Fever</strong> and a prescription of <strong>Paracetamol</strong> are active on your care plan.
            </p>
          </div>
        ) : (
          <>
            {/* Diagnosis Breakdown */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
                Diagnosis Breakdown
              </span>
              <h2 className="text-2xl font-black text-gray-900">Why were you diagnosed with a Fever?</h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                A fever is not an illness on its own; it is your body&apos;s natural defense mechanism. When your immune system detects a viral or bacterial invader, it signals the brain&apos;s hypothalamus to raise your core body temperature. This warmer environment makes it harder for pathogens to multiply while boosting your immune cell activity.
              </p>
            </div>

            {/* Medication Breakdown */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                Medication Insights
              </span>
              <h2 className="text-2xl font-black text-gray-900">Why Paracetamol?</h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                Paracetamol ({treatmentDetails?.dosage || "650mg"}) prescribed at a frequency of <strong>{treatmentDetails?.frequency || "twice daily"}</strong> for <strong>{treatmentDetails?.duration || "5 days"}</strong> safely and effectively targets the chemical messengers in the brain that tell your body to feel hot and experience discomfort.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-2 mt-2">
                <p className="text-xs font-bold text-gray-500 uppercase">Key Reasons:</p>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li><strong>Temperature Regulation:</strong> Lowers high core body temperature back to normal ranges.</li>
                  <li><strong>Symptom Relief:</strong> Relieves associated body aches, headaches, and minor inflammation.</li>
                  <li><strong>High Safety Profile:</strong> Gentle on the stomach compared to other over-the-counter alternatives when taken at correct dosages.</li>
                </ul>
              </div>
            </div>

            {/* Commonality */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase tracking-wider">
                Context
              </span>
              <h2 className="text-2xl font-black text-gray-900">Why does this happen so often?</h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                Mild viral infections and fevers are among the most common human ailments. Because our bodies constantly encounter airborne pathogens in everyday environments, transient fevers are routine responses that typically resolve within a few days with adequate rest and proper hydration.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}