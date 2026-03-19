export default function DoctorCard({ doctor }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <h3 className="text-lg font-semibold text-[#1a1a1a]">{doctor.name}</h3>
      <p className="text-[#00b09b] font-medium text-sm mt-1">{doctor.specialty}</p>
      <p className="text-gray-500 mt-4 text-sm leading-relaxed">{doctor.bio}</p>
      <button className="mt-6 w-full py-2.5 rounded-lg border border-[#004a99] text-[#004a99] font-medium hover:bg-[#004a99] hover:text-white transition-colors">
        View Profile
      </button>
    </div>
  );
}
