import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-900 p-4">
      <h1 className="text-5xl font-bold mb-4 tracking-tight">HEALTH APP</h1>
      <p className="text-xl text-gray-600 mb-12">Your health, connected.</p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
        <Link 
          href="/patient" 
          className="px-8 py-4 bg-blue-600 text-white rounded-lg text-center font-semibold hover:bg-blue-700 transition"
        >
          I'm a Patient
        </Link>
        <Link 
          href="/doctor" 
          className="px-8 py-4 bg-emerald-600 text-white rounded-lg text-center font-semibold hover:bg-emerald-700 transition"
        >
          I'm a Doctor
        </Link>
      </div>
    </div>
  );
}