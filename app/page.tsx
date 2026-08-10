"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center space-y-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">CareFlow Portal</h1>
          <p className="text-sm text-gray-500 mt-2">Sign up or login to access your role-based dashboard</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Patient Portal Card */}
          <div className="p-6 border border-gray-200 rounded-xl space-y-4 hover:border-blue-500 transition shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Patient Portal</h2>
              <p className="text-xs text-gray-500 mt-1">Manage care plans, track treatment, log symptoms & wellness.</p>
            </div>
            <div className="space-y-2 pt-2">
              <Link
                href="/patient/signup"
                className="block w-full py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                Sign Up
              </Link>
              <Link
                href="/patient"
                className="block w-full py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition"
              >
                Login / Dashboard
              </Link>
            </div>
          </div>

          {/* Doctor Portal Card */}
          <div className="p-6 border border-gray-200 rounded-xl space-y-4 hover:border-emerald-500 transition shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Doctor Portal</h2>
              <p className="text-xs text-gray-500 mt-1">Review patient progress, prescribe plans & manage consultations.</p>
            </div>
            <div className="space-y-2 pt-2">
              <Link
                href="/doctor/signup"
                className="block w-full py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition shadow-sm"
              >
                Sign Up
              </Link>
              <Link
                href="/doctor"
                className="block w-full py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition"
              >
                Login / Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}