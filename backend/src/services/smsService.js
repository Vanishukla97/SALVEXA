const env = require('../config/env');

function normalizePhone(phone) {
  if (!phone) return null;
  const cleaned = String(phone).replace(/[^\d+]/g, '');
  if (cleaned.replace(/\D/g, '').length < 6) return null;
  return cleaned;
}

async function sendSms({ to, message, recipientType = 'other' }) {
  const provider = env.sms.provider;
  const recipient = normalizePhone(to);

  if (!recipient) {
    return {
      status: 'skipped',
      provider,
      error: 'Missing or invalid recipient phone number',
    };
  }

  if (provider === 'mock') {
    // eslint-disable-next-line no-console
    console.log(
      `\n===== [MOCK SMS → ${recipientType}] =====\nTo: ${recipient}\n${message}\n======================================\n`
    );
    return { status: 'mock', provider: 'mock' };
  }

  // Future providers (twilio / fast2sms) can be wired here.
  return {
    status: 'failed',
    provider,
    error: `Unsupported SMS provider: ${provider}`,
  };
}

module.exports = {
  sendSms,
  normalizePhone,
};
