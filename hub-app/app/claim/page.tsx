import { useSearchParams } from 'next/navigation';

export default function ClaimPage() {
  const searchParams = useSearchParams();
  const doctorId = searchParams.get('doctor_id');

  return (
    <div className="max-w-2xl bg-white p-12 rounded-3xl border border-gray-100 shadow-sm">
      <h1 className="text-3xl font-bold text-[#1E2D3B] mb-6">Claim Your Profile</h1>
      <p className="text-lg text-gray-600 mb-8">
        You are claiming the profile for <strong>Doctor ID: {doctorId}</strong>.
      </p>
      
      <div className="space-y-4">
        <p>Please complete your registration to gain access to your management dashboard.</p>
        <button className="w-full bg-[#D66829] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#b05522] transition-all">
          Complete Registration
        </button>
      </div>
    </div>
  );
}
