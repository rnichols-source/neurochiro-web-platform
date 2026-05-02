/**
 * Shared branded email template for all NeuroChiro automated emails.
 * Includes unsubscribe link (legally required for CAN-SPAM compliance).
 */
export function wrapEmail(body: string, options?: { unsubscribeUrl?: string }) {
  const unsubscribeUrl = options?.unsubscribeUrl || 'https://neurochiro.co/doctor/settings';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Lato', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #FCF9F5; }
    .wrapper { max-width: 600px; margin: 40px auto; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08); border: 1px solid #E5E7EB; }
    .header { background-color: #1E2D3B; padding: 30px; text-align: center; }
    .content { padding: 40px; color: #1E2D3B; font-size: 16px; line-height: 1.7; }
    .content h1 { font-size: 24px; font-weight: 900; margin-bottom: 16px; }
    .content h2 { font-size: 20px; font-weight: 900; color: #D66829; }
    .content h3 { font-size: 16px; font-weight: 900; }
    .content p { margin-bottom: 16px; color: #4B5563; }
    .content a { color: #D66829; }
    .content ul { padding-left: 20px; color: #4B5563; }
    .content li { margin-bottom: 8px; }
    .content strong { color: #1E2D3B; }
    .footer { text-align: center; padding: 30px; font-size: 11px; color: #9CA3AF; letter-spacing: 1px; font-weight: 700; border-top: 1px solid #F3F4F6; }
    .unsubscribe { text-align: center; padding: 0 30px 20px; font-size: 11px; color: #D1D5DB; }
    .unsubscribe a { color: #D1D5DB; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <img src="https://neurochiro.co/logo-white.png" alt="NeuroChiro" width="120" style="display: block; margin: 0 auto;">
    </div>
    <div class="content">
      ${body}
    </div>
    <div class="footer">
      &copy; 2026 NeuroChiro Network. All Rights Reserved.
    </div>
    <div class="unsubscribe">
      <a href="${unsubscribeUrl}">Manage email preferences</a> &middot;
      NeuroChiro &middot; neurochiro.co
    </div>
  </div>
</body>
</html>`;
}
