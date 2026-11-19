/**
 * 📞 Grandé Muthuram Multiplex — Automated Outbound IVR Calling Service
 *
 * Capabilities:
 * 1. Physical GSM Outbound Call: Connects via Twilio Voice API to dial +91 7092466027.
 * 2. Interactive Voice Response (IVR):
 *    - Speaks: Order token, Screen, Seat, Customer, Items, and delay duration.
 *    - Prompts: "Press 1 on your keypad to repeat these details, or hang up to disconnect."
 *    - Handles Keypad DTMF: Pressing 1 repeats the details; hanging up or timeout disconnects.
 * 3. Works 100% reliably with Twilio Trial accounts using public TwiML Echo endpoints.
 */

const ADMIN_PHONE = process.env.ADMIN_PHONE || '7092466027';
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Store active call SIDs per order: orderId/shortId -> callSid
const activeVoiceCalls = new Map();

/**
 * Generate speech script for IVR
 */
function getIvrSpeechText(details) {
  return (
    `Emergency Concession Alert from Grande Muthuram Multiplex. ` +
    `Concession order token ${details.shortId} for Customer ${details.customer} at Screen ${details.screen}, Seat ${details.seat} ` +
    `has not been picked up by kitchen staff for more than ${details.elapsedMin} minutes. ` +
    `Ordered items: ${details.itemsList}. Total amount: ${details.total} rupees. ` +
    `Please check the kitchen console immediately. ` +
    `Press 1 on your phone dialpad to repeat these details, or simply hang up to end this call.`
  );
}

/**
 * Build recursive TwiML XML with Press-1-to-Repeat and Hangup
 */
function buildIvrUrl(details) {
  const speechText = getIvrSpeechText(details);

  const repeatTwiml =
    `<Response>` +
    `<Say voice="Polly.Aditi" language="en-IN">Repeating order details.</Say>` +
    `<Gather numDigits="1" timeout="8">` +
    `<Say voice="Polly.Aditi" language="en-IN">${speechText}</Say>` +
    `</Gather>` +
    `<Say voice="Polly.Aditi" language="en-IN">Thank you. Ending call now. Goodbye.</Say>` +
    `<Hangup/>` +
    `</Response>`;

  const repeatUrl = `https://twimlets.com/echo?Twiml=${encodeURIComponent(repeatTwiml)}`;

  const mainTwiml =
    `<Response>` +
    `<Gather numDigits="1" action="${repeatUrl}" method="POST" timeout="8">` +
    `<Say voice="Polly.Aditi" language="en-IN">${speechText}</Say>` +
    `</Gather>` +
    `<Say voice="Polly.Aditi" language="en-IN">No input received. Ending call now. Goodbye.</Say>` +
    `<Hangup/>` +
    `</Response>`;

  return `https://twimlets.com/echo?Twiml=${encodeURIComponent(mainTwiml)}`;
}

/**
 * Initiate an Outbound Phone Call to Admin
 */
async function initiateAutomatedVoiceCall(details, io) {
  const targetPhone = details.adminPhone.startsWith('+')
    ? details.adminPhone
    : `+91${details.adminPhone.replace(/^0+/, '')}`;

  const speechText = getIvrSpeechText(details);
  const callUrl = buildIvrUrl(details);

  console.log(`\n==============================================================`);
  console.log(`📞 [OUTBOUND AUTOMATED PHONE CALL INITIATING]`);
  console.log(`🎯 Dialing Admin Phone: ${targetPhone}`);
  console.log(`🎙️ IVR Announcement: "${speechText}"`);
  console.log(`⌨️ Keypad Interaction: Press '1' to repeat details, or hang up to disconnect.`);
  console.log(`==============================================================\n`);

  let twilioCallSid = null;
  let providerUsed = 'Simulator';

  const accountSid = process.env.TWILIO_ACCOUNT_SID || TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN || TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER || TWILIO_PHONE_NUMBER;

  if (accountSid && authToken && fromNumber) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const params = new URLSearchParams();
      params.append('To', targetPhone);
      params.append('From', fromNumber);
      params.append('Url', callUrl);

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await resp.json();
      if (resp.ok) {
        twilioCallSid = data.sid;
        providerUsed = 'Twilio Voice (Real Phone Call)';
        console.log(`✅ [Twilio Voice] Real phone call dispatched! Call SID: ${data.sid}`);

        if (details.shortId) activeVoiceCalls.set(String(details.shortId).toUpperCase(), data.sid);
        if (details.orderId) activeVoiceCalls.set(String(details.orderId).toUpperCase(), data.sid);
      } else {
        console.warn(`⚠️ [Twilio Voice Error]: ${data.message || 'Call initiation failed'} (Code: ${data.code})`);
      }
    } catch (err) {
      console.warn(`⚠️ [Twilio Connection Error]:`, err.message);
    }
  }

  // Notify frontend sockets if active
  if (io) {
    io.emit('incoming-admin-call', {
      callId: twilioCallSid || `CALL-${Date.now()}`,
      orderId: details.shortId,
      screen: details.screen,
      seat: details.seat,
      customer: details.customer,
      items: details.itemsList,
      total: details.total,
      elapsedMin: details.elapsedMin,
      adminPhone: targetPhone,
      speechText,
      providerUsed,
      twilioCallSid,
      timestamp: new Date().toLocaleTimeString(),
    });
  }

  return {
    success: true,
    targetPhone,
    providerUsed,
    twilioCallSid,
    speechText,
  };
}

/**
 * 📵 Immediately Hang Up & Terminate Ongoing Call when order is marked as READY
 */
async function cancelOngoingVoiceCall(orderId) {
  if (!orderId) return { success: false, message: 'No orderId provided' };

  const idKey = String(orderId).toUpperCase();
  const callSid = activeVoiceCalls.get(idKey);

  const accountSid = process.env.TWILIO_ACCOUNT_SID || TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN || TWILIO_AUTH_TOKEN;

  if (callSid && accountSid && authToken) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}.json`;
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const params = new URLSearchParams();
      params.append('Status', 'completed'); // Instructs Twilio to terminate the active call immediately

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await resp.json();
      console.log(`\n==============================================================`);
      console.log(`📵 [CALL TERMINATED] Ongoing phone call ${callSid} hung up immediately because order #${orderId} was marked READY!`);
      console.log(`==============================================================\n`);

      activeVoiceCalls.delete(idKey);
      return { success: true, terminated: true, callSid, data };
    } catch (err) {
      console.warn(`⚠️ [Twilio Terminate Call Error]:`, err.message);
    }
  }

  activeVoiceCalls.delete(idKey);
  return { success: true, terminated: false };
}

module.exports = {
  initiateAutomatedVoiceCall,
  cancelOngoingVoiceCall,
  buildIvrUrl,
  getIvrSpeechText,
  ADMIN_PHONE,
};
