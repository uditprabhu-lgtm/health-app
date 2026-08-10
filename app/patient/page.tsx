"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface Patient {
  id: string;
  name: string;
  age: number;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  doctors: {
    name: string;
    specialty: string;
  } | null;
}

interface Treatment {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  start_date: string;
  end_date: string;
}

interface Adherence {
  id: string;
  date: string;
  status: string;
}

interface Wellness {
  id: string;
  date: string;
  sleep: string | null;
  mood: string | null;
  activity: string | null;
  hydration: string | null;
}

export default function PatientDashboard() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [todayAdherence, setTodayAdherence] = useState<Adherence | null>(null);
  const [wellness, setWellness] = useState<Wellness | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);

      // 1. Fetch the single patient record
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (patientError || !patientData) {
        console.error("Error fetching patient:", patientError);
        setLoading(false);
        return;
      }

      setPatient(patientData);

      // 2. Fetch upcoming appointment for this patient
      const { data: appointmentData } = await supabase
        .from("appointments")
        .select("id, date, time, status, doctors(name, specialty)")
        .eq("patient_id", patientData.id)
        .order("date", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (appointmentData) {
        setAppointment(appointmentData as unknown as Appointment);
      }

      // 3. Fetch active/latest treatment plan
      const { data: treatmentData } = await supabase
        .from("treatments")
        .select("*")
        .eq("patient_id", patientData.id)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (treatmentData) {
        setTreatment(treatmentData);

        // Fetch today's treatment adherence if treatment exists
        const todayStr = new Date().toISOString().split("T")[0];
        const { data: adherenceData } = await supabase
          .from("adherence")
          .select("*")
          .eq("treatment_id", treatmentData.id)
          .eq("date", todayStr)
          .maybeSingle();

        if (adherenceData) {
          setTodayAdherence(adherenceData);
        }
      }

      // 4. Fetch latest wellness overview
      const { data: wellnessData } = await supabase
        .from("wellness")
        .select("*")
        .eq("patient_id", patientData.id)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (wellnessData) {
        setWellness(wellnessData);
      }

      setLoading(false);
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-500 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top Navigation / Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 sm:px-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {patient ? patient.name : "Patient"}
          </h1>
          <p className="text-sm text-gray-500">Patient Dashboard</p>
        </div>
        <Link
          href="/"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          &larr; Home
        </Link>
      </header>

      <main className="max-w-5xl mx-auto p-6 sm:p-8 space-y-8">
        {/* Quick Action Navigation */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          {/* Adjusted grid layout to lg:grid-cols-4 so the 7 items wrap nicely */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <Link
              href="/patient/book"
              className="px-4 py-3 bg-blue-600 text-white text-center text-sm font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Book Appointment
            </Link>
            
            <Link
              href="/patient/careplan" 
              className="px-4 py-3 bg-white border border-gray-300 text-gray-700 text-center text-sm font-medium rounded-lg hover:bg-gray-50 transition"
            >
              View Care Plan
            </Link>

            <Link
              href="/patient/treatment"
              className="px-4 py-3 bg-white border border-gray-300 text-gray-700 text-center text-sm font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Track Treatment
            </Link>
            
            <Link
              href="/patient/report"
              className="px-4 py-3 bg-white border border-gray-300 text-gray-700 text-center text-sm font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Report Symptoms
            </Link>

            <Link
              href="/patient/side-effect"
              className="px-4 py-3 bg-white border border-gray-300 text-gray-700 text-center text-sm font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Report Side Effect
            </Link>

            <Link
              href="/patient/wellness"
              className="px-4 py-3 bg-white border border-gray-300 text-gray-700 text-center text-sm font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Wellness
            </Link>

            {/* NEW LINK ADDED HERE */}
            <Link
              href="/patient/ask-doctor"
              className="px-4 py-3 bg-white border border-gray-300 text-gray-700 text-center text-sm font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Ask Doctor
            </Link>
          </div>
        </section>

        {/* Core Dashboard Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming Appointment */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Upcoming Appointment
              </h2>
              {appointment ? (
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <span className="font-medium text-gray-900">Doctor:</span>{" "}
                    {appointment.doctors?.name || "Unknown"} (
                    {appointment.doctors?.specialty || "General"})
                  </p>
                  <p>
                    <span className="font-medium text-gray-900">Date:</span>{" "}
                    {appointment.date}
                  </p>
                  <p>
                    <span className="font-medium text-gray-900">Time:</span>{" "}
                    {appointment.time}
                  </p>
                  <p>
                    <span className="font-medium text-gray-900">Status:</span>{" "}
                    <span className="capitalize px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                      {appointment.status}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500 text-sm">
                  No upcoming appointments scheduled.
                </div>
              )}
            </div>
          </div>

          {/* Current Treatment Plan */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Current Treatment Plan
              </h2>
              {treatment ? (
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <span className="font-medium text-gray-900">Medication:</span>{" "}
                    {treatment.medication}
                  </p>
                  <p>
                    <span className="font-medium text-gray-900">Dosage:</span>{" "}
                    {treatment.dosage}
                  </p>
                  <p>
                    <span className="font-medium text-gray-900">Frequency:</span>{" "}
                    {treatment.frequency}
                  </p>
                  <p>
                    <span className="font-medium text-gray-900">Duration:</span>{" "}
                    {treatment.duration} ({treatment.start_date} to {treatment.end_date})
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500 text-sm">
                  No active treatment plan prescribed yet.
                </div>
              )}
            </div>
          </div>

          {/* Today's Treatment Status */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Today's Treatment Status
            </h2>
            {treatment ? (
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-medium text-gray-900">Medication:</span>{" "}
                  {treatment.medication}
                </p>
                <p>
                  <span className="font-medium text-gray-900">Status for Today:</span>{" "}
                  {todayAdherence ? (
                    <span
                      className={`capitalize px-2 py-0.5 text-xs font-semibold rounded ${
                        todayAdherence.status === "taken"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {todayAdherence.status}
                    </span>
                  ) : (
                    <span className="text-gray-500 italic">Not logged yet today</span>
                  )}
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500 text-sm">
                No active medications to track.
              </div>
            )}
          </div>

          {/* Basic Wellness Overview */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Latest Wellness Overview
            </h2>
            {wellness ? (
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <p className="text-xs text-gray-500">Sleep</p>
                  <p className="font-medium text-gray-900">{wellness.sleep || "N/A"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <p className="text-xs text-gray-500">Mood</p>
                  <p className="font-medium text-gray-900">{wellness.mood || "N/A"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <p className="text-xs text-gray-500">Activity</p>
                  <p className="font-medium text-gray-900">{wellness.activity || "N/A"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <p className="text-xs text-gray-500">Hydration</p>
                  <p className="font-medium text-gray-900">{wellness.hydration || "N/A"}</p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500 text-sm">
                No wellness data logged yet.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}