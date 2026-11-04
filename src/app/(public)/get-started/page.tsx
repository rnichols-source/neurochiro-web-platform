import { isApplicationFlowEnabled } from '@/lib/applications/flag'
import GetStartedClient from './GetStartedClient'

export default function GetStartedPage() {
  return <GetStartedClient applicationFlow={isApplicationFlowEnabled()} />
}
