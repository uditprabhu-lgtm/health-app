export const dynamic = 'force-dynamic';

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Doctor {
  id: string;
  name: string;
  specialty?: string;
  role?: string;
}

interface Patient {
  id: string;
  name: string;
  age: number;
}

export default function DoctorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const router = useRouter();

  // Dynamically change the browser tab name
  useEffect(() => {
    document.title = "Diyagnosis | Doctor Dashboard";
  }, []);

  useEffect(() => {
    async function loadDoctorsList() {
      setLoading(true);
      const { data } = await supabase.from("doctors").select("*");
      if (data) setAllDoctors(data);

      const storedId = sessionStorage.getItem("doctorId");
      if (storedId && data) {
        const found = data.find((d) => d.id === storedId);
        if (found) setDoctor(found);
      }
      setLoading(false);
    }
    loadDoctorsList();
  }, []);

  useEffect(() => {
    if (!doctor) return;
    async function loadPatients() {
      const { data } = await supabase.from("patients").select("id, name, age");
      if (data) setPatients(data);
    }
    loadPatients();
  }, [doctor]);

  const selectDoctor = (d: Doctor) => {
    sessionStorage.setItem("doctorId", d.id);
    setDoctor(d);
  };

  const switchDoctor = () => {
    sessionStorage.removeItem("doctorId");
    setDoctor(null);
  };

  // The function to trigger the USP diagnosis page
  const startConsultation = (patientId: string) => {
    sessionStorage.setItem("diagnosePatientId", patientId);
    router.push("/doctor/consultation");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 font-medium">Loading...</p>
      </div>
    );
  }

  // Doctor Account Picker View
  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">Select Doctor Account</h1>
            <Link href="/" className="text-xs font-bold text-emerald-600">&larr; Home</Link>
          </div>

          {allDoctors.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No doctor profiles found.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allDoctors.map((d) => (
                <button
                  key={d.id}
                  onClick={() => selectDoctor(d)}
                  className="w-full p-4 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 rounded-xl text-left flex justify-between items-center transition"
                >
                  <div>
                    <p className="font-bold text-gray-900">{d.name}</p>
                    <p className="text-xs text-gray-500">{d.role || d.specialty || "General Medicine"}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">Select &rarr;</span>
                </button>
              ))}
            </div>
          )}

          <Link
            href="/doctor/signup"
            className="block w-full py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl text-center hover:bg-emerald-700 transition shadow-sm"
          >
            + Sign Up New Doctor
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      <header className="bg-white border-b border-gray-200 py-4 px-8 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{doctor.name}&apos;s Dashboard</h1>
          <p className="text-xs text-gray-500">{doctor.role || doctor.specialty || "General Medicine"} • Management Portal</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={switchDoctor} className="text-xs font-bold text-emerald-600 hover:underline">
            Switch Doctor
          </button>
          <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-800">
            Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-8 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Registered Patients</h2>
          {patients.length === 0 ? (
            <p className="text-sm text-gray-500">No patients found in the system.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {patients.map((p) => (
                <div key={p.id} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900 text-base">{p.name}</p>
                    <p className="text-xs text-gray-500">Age: {p.age} years old</p>
                  </div>
                  
                  {/* Updated Actions Section */}
                  <div className="flex items-center gap-3">
                    <Link
                      href="/doctor/patient"
                      className="px-4 py-2 bg-gray-100 text-gray-700 hover:text-gray-900 text-sm font-bold rounded-lg hover:bg-gray-200 transition shadow-sm"
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={() => startConsultation(p.id)}
                      className="px-4 py-2 bg-teal-600 text-white text-sm font-bold rounded-lg hover:bg-teal-700 transition shadow-sm"
                    >
                      Start Consultation
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}