const twilio = require('twilio');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const { to } = req.body;

  try {
    const call = await client.calls.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
      twiml: `<Response>
        <Say voice="alice">
          Hello, this is Aria from NexVoice AI. This is a test call to confirm your voice agent is working correctly. Your AI assistant is now live and ready to handle calls for your business. Goodbye.
        </Say>
      </Response>`
    });
    res.status(200).json({ success: true, callSid: call.sid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}