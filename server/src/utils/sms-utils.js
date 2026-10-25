// GSM 7-bit default alphabet characters
const GSM7_CHARS = new Set(
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ' +
  ' !"#¤%&\'()*+,-./0123456789:;<=>?' +
  '¡ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
  'ÄÖÑÜabcdefghijklmnopqrstuvwxyz' +
  'äöñüà§'
);

// GSM 7-bit extension characters (each counts as 2 chars)
const GSM7_EXTENSION = new Set(['{', '}', '[', ']', '~', '\\', '|', '^', '€']);

function isGSM7(text) {
  for (const char of text) {
    if (!GSM7_CHARS.has(char) && !GSM7_EXTENSION.has(char)) {
      return false;
    }
  }
  return true;
}

function countParts(text) {
  if (!text) return { encoding: 'GSM-7', charCount: 0, parts: 0 };

  const gsm7 = isGSM7(text);
  let encoding, charCount, singleLimit, multiLimit;

  if (gsm7) {
    encoding = 'GSM-7';
    // Count GSM-7 chars (extension chars count as 2)
    charCount = 0;
    for (const char of text) {
      charCount += GSM7_EXTENSION.has(char) ? 2 : 1;
    }
    singleLimit = 160;
    multiLimit = 153;
  } else {
    encoding = 'Unicode';
    charCount = [...text].length; // proper unicode length
    singleLimit = 70;
    multiLimit = 67;
  }

  let parts;
  if (charCount <= singleLimit) {
    parts = charCount === 0 ? 0 : 1;
  } else {
    parts = Math.ceil(charCount / multiLimit);
  }

  return { encoding, charCount, parts };
}

function normalizePhone(raw) {
  if (!raw) return null;

  let phone = raw.toString().trim().replace(/[\s\-()]/g, '');

  // Strip +977 or 977 prefix
  if (phone.startsWith('+977')) {
    phone = phone.slice(4);
  } else if (phone.startsWith('977') && phone.length > 10) {
    phone = phone.slice(3);
  }

  // Must be exactly 10 digits starting with 97 or 98
  if (!/^(97|98)\d{8}$/.test(phone)) {
    return null;
  }

  return phone;
}

function resolveMessage(template, contactName) {
  return template.replace(/\{name\}/gi, contactName || '');
}

function calculateCost(template, contactName) {
  const resolved = resolveMessage(template, contactName);
  const { parts } = countParts(resolved);
  return parts; // 1 part = 1 credit
}

module.exports = {
  isGSM7,
  countParts,
  normalizePhone,
  resolveMessage,
  calculateCost,
};
