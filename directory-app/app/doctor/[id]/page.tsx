export default async function DoctorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="p-10 text-center text-gray-500">
      Doctor Profile Coming Soon
    </div>
  );
}
