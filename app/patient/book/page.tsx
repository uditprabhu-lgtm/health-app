"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

export default function BookAppointmentPage() {
  const router = useRouter();

  const [patientId, setPatientId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // Get patient ID
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (patientError || !patientData) {
        setErrorMsg("Failed to load patient information.");
        setLoading(false);
        return;
      }
      setPatientId(patientData.id);

      // Get doctor list
      const { data: doctorData, error: doctorError } = await supabase
        .from("doctors")
        .select("id, name, specialty");

      if (doctorError || !doctorData || doctorData.length === 0) {
        setErrorMsg("No available doctors found.");
        setLoading(false);
        return;
      }

      setDoctors(doctorData);
      setSelectedDoctorId(doctorData[0].id); // Default select first doctor (Dr. Sharma)
      setLoading(false);
    }

    loadData();
  }, []);

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !selectedDate || !selectedTime) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    setErrorMsg("");
    setStep("confirm");
  };

  const handleConfirmAppointment = async () => {
    if (!patientId || !selectedDoctorId || !selectedDate || !selectedTime) {
      setErrorMsg("Missing required appointment data.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    const { error } = await supabase.from("appointments").insert([
      {
        patient_id: patientId,
        doctor_id: selectedDoctorId,
        date: selectedDate,
        time: selectedTime,
        status: "scheduled",
      },
    ]);

    setSubmitting(false);

    if (error) {
      console.error("Error creating appointment:", error);
      setErrorMsg("Failed to create appointment. Please try again.");
      return;
    }

    setStep("success");
  };

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-500 font-medium">Loading appointment booking...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 py-4 px-6 sm:px-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
          <p className="text-sm text-gray-500">Schedule a consultation with your doctor</p>
        </div>
        <Link
          href="/patient"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          &larr; Back to Dashboard
        </Link>
      </header>

      <main className="max-w-2xl mx-auto p-6 sm:p-8">
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {errorMsg}
          </div>
        )}

        {/* STEP 1: Form */}
        {step === "form" && (
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Select Details</h2>
            <form onSubmit={handleProceedToConfirm} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Doctor
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  required
                >
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} — {doc.specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Time
                </label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  required
                >
                  <option value="">-- Choose Time --</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="04:30 PM">04:30 PM</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  Continue to Confirmation &rarr;
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: Confirmation Screen */}
        {step === "confirm" && (
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Confirm Your Appointment</h2>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3 text-sm">
              <p>
                <span className="font-semibold text-gray-700">Doctor:</span>{" "}
                {selectedDoctor?.name} ({selectedDoctor?.specialty})
              </p>
              <p>
                <span className="font-semibold text-gray-700">Date:</span> {selectedDate}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Time:</span> {selectedTime}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="w-1/2 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Back / Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmAppointment}
                disabled={submitting}
                className="w-1/2 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submitting ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Confirmed Success Screen */}
        {step === "success" && (
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm text-center space-y-6">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Appointment Confirmed!
              </h2>
              <p className="text-gray-600 text-sm">
                Your appointment with {selectedDoctor?.name} on {selectedDate} at{" "}
                {selectedTime} has been scheduled.
              </p>
            </div>

            <button
              onClick={() => router.push("/patient")}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
}