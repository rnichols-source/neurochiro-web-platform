const axios = require('axios');

async function simulateWebhook() {
  const mockEvent = {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        customer_details: { email: 'test-user@neurochiro.com' },
        metadata: {
          userId: 'user_playwright_test',
          planId: 'price_doctor_membership_monthly'
        }
      }
    }
  };

  try {
    console.log("🚀 Sending mock Stripe webhook to http://localhost:3000/api/webhooks/stripe...");
    const response = await axios.post('http://localhost:3000/api/webhooks/stripe', mockEvent, {
      headers: {
        'Stripe-Signature': 't=123,v1=mock_sig', // The endpoint currently uses "whsec_mock" if not set
      }
    });
    console.log("✅ Response:", response.data);
  } catch (error) {
    console.error("❌ Failed:", error.response?.data || error.message);
  }
}

simulateWebhook();
