import { DoctorBand, SubTabs } from '@/components/doctor/chrome'
import { ToolChips } from '@/components/doctor/tool-chips'

const TABS = [
  { href: '/doctor/network', label: 'Refer' },
  { href: '/doctor/network/students', label: 'Students' },
  { href: '/doctor/network/grow', label: 'Grow' },
]

export function NetworkFrame({ active, children }: { active: string; children: React.ReactNode }) {
  return (
    <div>
      <DoctorBand
        place="network"
        title="Network"
        subtitle="Refer to other doctors, meet students, and grow."
        footer={<SubTabs tabs={TABS} active={active} />}
      />
      <ToolChips group="network" />
      {children}
    </div>
  )
}
