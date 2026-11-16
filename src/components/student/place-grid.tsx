import Link from 'next/link';
import { StudentPlaceIcon } from '@/components/student/icons';
import { STUDENT_PLACE_LIST, STUDENT_TOOL_LINKS } from '@/lib/students/places';

const NEXT = [
  STUDENT_PLACE_LIST[1],
  STUDENT_PLACE_LIST[2],
  STUDENT_PLACE_LIST[3],
  { ...STUDENT_PLACE_LIST[4], href: '/student/profile', label: 'Profile' },
];

export default function PlaceGrid() {
  const tools = STUDENT_TOOL_LINKS.filter((link) => ['/student/philosophy', '/student/techniques', '/student/contract-lab', '/student/seminars', '/student/community'].includes(link.href));
  return (
    <section className="mb-6 space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {NEXT.map((place) => (
          <Link key={place.href + place.label} href={place.href} className="rounded-2xl bg-white p-4 shadow-sm" style={{ boxShadow: 'inset 0 0 0 1px #ECE8E1' }}>
            <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: place.color }}>
              <StudentPlaceIcon id={place.id} size={20} />
            </span>
            <span className="dp-ui block text-[16px] font-extrabold" style={{ color: place.ink }}>{place.label}</span>
          </Link>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3" style={{ boxShadow: 'inset 0 0 0 1px #ECE8E1' }}>
            <span>
              <span className="dp-ui block text-[14px] font-extrabold text-[#15202B]">{tool.label}</span>
              <span className="block text-[13px] text-[#5b6773]">{tool.detail}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
