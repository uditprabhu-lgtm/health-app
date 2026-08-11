"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function PatientSignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !age) return;

    setLoading(true);
    // Insert and select the newly created patient record
    const { data, error } = await supabase.from("patients").insert([
      { name, age: parseInt(age, 10) }
    ]).select().single();

    if (!error && data) {
      // Save this specific patient's ID to browser storage
      sessionStorage.setItem("patientId", data.id);
      router.push("/patient");
    } else {
      console.error(error?.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-6">
      <div className="max-w-md w-full mx-auto bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Patient Sign Up</h2>
          <p className="text-sm text-gray-500 mt-1">Enter your details to get started</p>
        </div>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 24"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? "Registering..." : "Create Patient Profile"}
          </button>
        </form>
        <div className="text-center">
          <Link href="/" className="text-sm text-blue-600 font-medium">&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  );
}