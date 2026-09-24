import { getInvisibleDoctors } from './actions'
import InvisibleDoctorsClient from './InvisibleDoctorsClient'

export const dynamic = 'force-dynamic'

export default async function InvisibleDoctorsPage() {
  const doctors = await getInvisibleDoctors()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Invisible Doctors</h1>
        <p className="text-gray-400 mt-1">
          Doctors with missing or failed coordinates. These are invisible to every location search.
        </p>
      </div>

      <InvisibleDoctorsClient doctors={doctors} />
    </div>
  )
}
