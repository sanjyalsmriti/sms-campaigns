const GSM7_CHARS = new Set(
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ' +
  ' !"#¤%&\'()*+,-./0123456789:;<=>?' +
  '¡ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
  'ÄÖÑÜabcdefghijklmnopqrstuvwxyz' +
  'äöñüà§'
);

// These each occupy 2 units in GSM-7 because they live in the extension table.
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
    charCount = 0;
    for (const char of text) {
      charCount += GSM7_EXTENSION.has(char) ? 2 : 1;
    }
    singleLimit = 160;
    multiLimit = 153;
  } else {
    encoding = 'Unicode';
    charCount = [...text].length;
    singleLimit = 70;
    multiLimit = 67;
  }

  const parts = charCount === 0 ? 0 : charCount <= singleLimit ? 1 : Math.ceil(charCount / multiLimit);

  return { encoding, charCount, parts };
}

function normalizePhone(raw) {
  if (!raw) return null;

  let phone = raw.toString().trim().replace(/[\s\-()]/g, '');

  if (phone.startsWith('+977')) {
    phone = phone.slice(4);
  } else if (phone.startsWith('977') && phone.length > 10) {
    phone = phone.slice(3);
  }

  if (!/^(97|98)\d{8}$/.test(phone)) return null;

  return phone;
}

function resolveMessage(template, contactName) {
  return template.replace(/\{name\}/gi, contactName || '');
}

function calculateCost(template, contactName) {
  const resolved = resolveMessage(template, contactName);
  return countParts(resolved).parts;
}

module.exports = { isGSM7, countParts, normalizePhone, resolveMessage, calculateCost };
