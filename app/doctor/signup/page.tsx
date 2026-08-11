"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function DoctorSignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [role, setRole] = useState("General Medicine");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !age) return;

    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase
      .from("doctors")
      .insert([
        {
          name,
          age: parseInt(age, 10),
          specialty: role,
          role,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      sessionStorage.setItem("doctorId", data.id);
      router.push("/doctor");
    } else {
      console.error(error?.message);
      setErrorMsg(error?.message || "Failed to register doctor.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-6">
      <div className="max-w-md w-full mx-auto bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Doctor Sign Up</h2>
          <p className="text-sm text-gray-500 mt-1">Register your clinical profile</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Sharma"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 42"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Role / Specialty</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="General Medicine">General Medicine</option>
              <option value="Cardiologist">Cardiologist</option>
              <option value="Orthopedic Surgeon">Orthopedic Surgeon</option>
              <option value="Neurologist">Neurologist</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition shadow-sm"
          >
            {loading ? "Registering..." : "Create Doctor Profile"}
          </button>
        </form>
        <div className="text-center">
          <Link href="/" className="text-sm text-emerald-600 font-medium hover:underline">&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  );
}