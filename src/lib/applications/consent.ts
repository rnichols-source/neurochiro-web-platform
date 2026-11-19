/** Exact wording on the doctor application. Version id is application_sms_v3. */
export const APPLICATION_SMS_CONSENT_VERSION = 'application_sms_v3'

export const APPLICATION_SMS_CONSENT =
  'Text me about my NeuroChiro application and send patient request alerts to this number. Msg & data rates may apply. Reply STOP to opt out, HELP for help.'

/** The apply checkbox blocked the card step when it was unchecked. */
export const APPLICATION_SMS_CONSENT_REQUIRED_ERROR =
  'Check the box so we can text you about new community member requests.'

export function applicationSmsConsentError(consent: unknown): string | null {
  return consent === true ? null : APPLICATION_SMS_CONSENT_REQUIRED_ERROR
}
