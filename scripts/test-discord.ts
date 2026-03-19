
import * as dotenv from 'dotenv';
dotenv.config();

const testDiscord = async (url: string) => {
  const message = `🚀 **Launch Test Successful!**\n🛡️ **Network Milestone:** 124 Verified Specialists\n📍 System ready for 5,000 users.`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message })
    });
    
    if (response.ok) {
      console.log("✅ Test message sent to Discord!");
    } else {
      console.error("❌ Discord API error:", response.status, await response.text());
    }
  } catch (err) {
    console.error("❌ Fetch error:", err);
  }
};

const url = process.argv[2] || process.env.DISCORD_WEBHOOK_URL;
if (!url || url.includes('...')) {
  console.error("❌ Error: Provide a valid webhook URL as an argument or set DISCORD_WEBHOOK_URL in .env");
} else {
  testDiscord(url);
}
