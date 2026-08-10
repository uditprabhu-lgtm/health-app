"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

// ---------------------------------------------------------
// STATIC EDUCATIONAL CONTENT DICTIONARY
// In the future, this can be replaced by an API call to a
// trusted medical knowledge base.
// ---------------------------------------------------------
const MEDICAL_CONTENT = {
  conditions: {
    "Fever": {
      title: "Understanding Fever",
      whatIsIt: "A fever is a temporary increase in your average body temperature, usually in response to an illness or infection. It is a normal sign that your body's immune system is actively working to fight off invaders.",
      thingsToKnow: [
        "Normal body temperature varies from person to person, but a fever is generally considered to be 38°C (100.4°F) or higher.",
        "Fever itself is not an illness, but rather a symptom of an underlying issue.",
        "Most mild fevers go away on their own within a few days and do not cause severe issues in healthy adults."
      ],
      selfCare: [
        "Drink plenty of fluids, such as water or clear broths, to prevent dehydration.",
        "Get plenty of rest to give your immune system energy to help your body recover.",
        "Keep your room comfortably cool and wear lightweight, breathable clothing."
      ],
      whenToSeekHelp: [
        "Your temperature reaches 103°F (39.4°C) or higher.",
        "The fever lasts for more than three days without improving.",
        "You experience severe headaches, a stiff neck, a new skin rash, confusion, or difficulty breathing."
      ]
    }
  },
  medications: {
    "Paracetamol": {
      title: "About Paracetamol",
      description: "Paracetamol (also known as Acetaminophen) is a widely used over-the-counter medication utilized to relieve mild to moderate pain and reduce high temperatures (fevers).",
      importantNotes: [
        "It helps reduce fever by interacting with the temperature-regulating center in the brain.",
        "It is crucial not to exceed the prescribed dosage, as taking too much can cause serious liver damage.",
        "Always check the labels of other cold or flu medications you are taking to ensure they do not also contain Paracetamol to avoid accidental overdose."
      ]
    }
  }
};

interface CarePlan {
  diagnosis: string;
  prescription: string;
}

export default function EducationalInfoPage() {
  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConditionData() {
      setLoading(true);

      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (patient) {
        const { data: treatment } = await supabase
          .from("treatments")
          .select("*, consultations(*)")
          .eq("patient_id", patient.id)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (treatment && treatment.consultations) {
          // Safely extract the consultation object whether it comes back as an array or a single object
          const consultationData: any = Array.isArray(treatment.consultations) 
            ? treatment.consultations[0] 
            : treatment.consultations;

          setCarePlan({
            diagnosis: consultationData?.diagnosis || "Fever",
            prescription: consultationData?.prescription || "Paracetamol",
          });
        }
      }

      setLoading(false);
    }

    fetchConditionData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-500 font-medium">Loading medical information...</p>
      </div>
    );
  }

  // Map the patient's actual diagnosis/prescription to our static dictionary
  const conditionInfo = carePlan 
    ? MEDICAL_CONTENT.conditions[carePlan.diagnosis as keyof typeof MEDICAL_CONTENT.conditions]
    : null;
    
  const medicationInfo = carePlan
    ? MEDICAL_CONTENT.medications[carePlan.prescription as keyof typeof MEDICAL_CONTENT.medications]
    : null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 py-4 px-6 sm:px-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Educational Information</h1>
          <p className="text-sm text-gray-500">Learn about your condition</p>
        </div>
        <Link
          href="/patient/careplan"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          &larr; Back to Care Plan
        </Link>
      </header>

      <main className="max-w-3xl mx-auto p-6 sm:p-8 space-y-8">
        
        {/* DISCLAIMER BANNER */}
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
          <h3 className="text-amber-800 font-bold text-sm uppercase tracking-wide mb-1">
            Important Medical Disclaimer
          </h3>
          <p className="text-amber-900 text-sm">
            The information below is for general educational purposes only. This application does not diagnose medical conditions. Always follow the specific care plan, dosages, and instructions provided by your healthcare professional.
          </p>
        </div>

        {/* CONDITION INFO */}
        {conditionInfo ? (
          <section className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Condition Overview</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">{conditionInfo.title}</h2>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">What is it?</h3>
              <p className="text-gray-700 text-sm leading-relaxed">{conditionInfo.whatIsIt}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">General Things to Know</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 marker:text-blue-500">
                {conditionInfo.thingsToKnow.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">General Self-Care Guidelines</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 marker:text-emerald-500">
                {conditionInfo.selfCare.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 bg-red-50 p-4 rounded-lg border border-red-100">
              <h3 className="text-red-800 font-semibold">When to Seek Immediate Medical Attention</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-red-900">
                {conditionInfo.whenToSeekHelp.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        ) : (
          <div className="bg-white p-6 rounded-xl border border-gray-200 text-center text-gray-500">
            No educational information available for the current diagnosis.
          </div>
        )}

        {/* MEDICATION INFO */}
        {medicationInfo && (
          <section className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Medication Overview</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">{medicationInfo.title}</h2>
            </div>
            
            <div className="space-y-2">
              <p className="text-gray-700 text-sm leading-relaxed">{medicationInfo.description}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Important Educational Notes</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 marker:text-blue-500">
                {medicationInfo.importantNotes.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}