/* ... existing imports ... */
// import { client } from '../../../lib/sanity.client';

interface Doctor {
  id: string;
  isClaimed?: boolean;
}

export default async function DoctorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // const doctor = await client.fetch(`*[_type == "doctor" && _id == $id][0]`, { id: id });
  const doctor: Doctor | null = null; 

  if (!doctor) return <div className="p-10 text-center text-gray-500">Doctor Profile Coming Soon</div>;

  const claimUrl = doctor?.id ? `https://hub.neurochiro.co/claim?doctor_id=${doctor.id}` : '#';

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* ... Hero Section ... */}

      {!doctor.isClaimed && (
        <div className="bg-[#D66829]/10 border border-[#D66829]/30 p-8 rounded-2xl mb-12 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-[#1E2D3B]">Is this your practice?</h3>
            <p className="text-gray-600">Claim this profile to update your details, add photos, and manage appointments.</p>
          </div>
          <a 
            href={claimUrl}
            className="bg-white border border-[#D66829] text-[#D66829] px-6 py-3 rounded-lg font-bold hover:bg-[#D66829] hover:text-white transition-colors"
          >
            Claim Profile
          </a>
        </div>
      )}
      {/* ... Info Grid ... */}
    </div>
  );
}
