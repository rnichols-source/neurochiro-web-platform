import { getDoctorTimezone, isQuietHours } from '../doctor-timezone.ts'
import { CANADIAN_AREA_CODES } from './signup-country.ts'

/** 9:00 PM through 7:59 AM local. 8:00 AM is outside quiet hours. */
export const REMINDER_QUIET_START = 21
export const REMINDER_QUIET_END = 8

const AREA_TZ: Record<string, string> = {}

function zone(codes: string[], timeZone: string) {
  for (const code of codes) AREA_TZ[code] = timeZone
}

zone(['709'], 'America/St_Johns')
zone(['506', '782', '902'], 'America/Halifax')
zone(['867'], 'America/Yellowknife')
zone(['204', '431', '584'], 'America/Winnipeg')
zone(['306', '474', '639'], 'America/Regina')
zone(['368', '403', '587', '780', '825'], 'America/Edmonton')
zone(['236', '250', '257', '604', '672', '778'], 'America/Vancouver')
zone(
  CANADIAN_AREA_CODES.filter((code) => !AREA_TZ[code]),
  'America/Toronto',
)
zone(
  ['212', '332', '347', '646', '718', '917', '929', '516', '631', '914', '845', '203', '475', '860', '959', '617', '857', '781', '339', '508', '774', '978', '351', '401', '603', '802', '207', '215', '267', '445', '610', '484', '717', '570', '272', '412', '724', '878', '814', '202', '240', '301', '227', '410', '443', '667', '703', '571', '757', '804', '540', '434', '276', '304', '681', '704', '980', '919', '984', '336', '743', '910', '252', '828', '803', '839', '843', '854', '864', '404', '470', '678', '770', '706', '762', '229', '478', '912', '305', '786', '954', '754', '561', '407', '321', '689', '352', '386', '904', '850', '239', '813', '727', '941', '863', '772', '216', '440', '330', '234', '419', '567', '614', '380', '513', '937', '740', '220', '502', '859', '606', '270', '364', '317', '463', '765', '812', '930', '260', '574', '219', '313', '734', '248', '947', '586', '810', '517', '989', '616', '269', '231', '906'],
  'America/New_York',
)
zone(
  ['312', '773', '872', '630', '331', '847', '224', '708', '815', '779', '309', '217', '618', '314', '636', '557', '816', '417', '573', '660', '214', '469', '972', '945', '817', '682', '430', '903', '430', '512', '737', '210', '726', '830', '956', '361', '713', '281', '832', '346', '409', '936', '979', '254', '325', '432', '806', '915', '405', '572', '918', '539', '504', '985', '225', '337', '318', '501', '479', '870', '205', '659', '251', '256', '334', '938', '601', '769', '228', '662', '901', '615', '629', '931', '423', '865', '731', '612', '651', '763', '952', '320', '507', '218', '414', '262', '920', '715', '534', '608', '515', '319', '563', '641', '712', '402', '531', '308', '316', '620', '785', '913'],
  'America/Chicago',
)
zone(['303', '720', '719', '970', '385', '801', '435', '505', '575', '406', '307', '208', '986', '702', '725', '775'], 'America/Denver')
zone(['480', '602', '623', '520', '928'], 'America/Phoenix')
zone(
  ['206', '253', '360', '425', '564', '503', '971', '458', '541', '213', '323', '310', '424', '818', '747', '626', '562', '714', '657', '949', '951', '760', '442', '858', '619', '909', '805', '820', '661', '559', '209', '916', '279', '530', '707', '415', '628', '650', '510', '341', '408', '669', '831', '925'],
  'America/Los_Angeles',
)
zone(['907'], 'America/Anchorage')
zone(['808'], 'Pacific/Honolulu')

export function timezoneFromPhone(phone: string | null | undefined, countryHint?: string | null): string | null {
  const digits = String(phone ?? '').replace(/\D/g, '')
  let national = ''
  if (digits.length === 11 && digits.startsWith('1')) national = digits.slice(1)
  else if (digits.length === 10) national = digits
  if (national) {
    const area = AREA_TZ[national.slice(0, 3)]
    if (area) return area
  }
  return getDoctorTimezone(null, countryHint || null)
}

/** Office state wins. Otherwise the mobile area code. Otherwise the country. */
export function applicationTimezone(input: {
  state?: string | null
  country?: string | null
  phone?: string | null
}): string {
  const fromOffice = getDoctorTimezone(input.state || null, input.country || null)
  if (fromOffice) return fromOffice
  const fromPhone = timezoneFromPhone(input.phone, input.country)
  if (fromPhone) return fromPhone
  const country = (input.country || '').trim().toUpperCase()
  const fallback = country === 'CA' ? 'America/Toronto' : 'America/New_York'
  return getDoctorTimezone(null, country || 'US', fallback) || fallback
}

export function reminderInQuietHours(timeZone: string, now: Date): boolean {
  return isQuietHours(timeZone, REMINDER_QUIET_START, REMINDER_QUIET_END, now)
}
