const normalizeCardNumber = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[^0-9]/g, '');
};

// Luhn algorithm
const isValidLuhn = (digits) => {
  if (!digits || typeof digits !== 'string') return false;
  if (!/^[0-9]+$/.test(digits)) return false;
  // Typical PAN length is 12-19
  if (digits.length < 12 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = digits.charCodeAt(i) - 48;
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

const parseExpiry = (value) => {
  const raw = value === null || value === undefined ? '' : String(value).trim();

  // Accept: MM/YY, MM/YYYY, MM-YY, MM-YYYY
  const match = raw.match(/^\s*(\d{2})\s*[-\/]\s*(\d{2}|\d{4})\s*$/);
  if (!match) return null;

  const month = parseInt(match[1], 10);
  let year = parseInt(match[2], 10);

  if (Number.isNaN(month) || Number.isNaN(year)) return null;
  if (month < 1 || month > 12) return null;

  if (match[2].length === 2) {
    // Interpret 00-99 as 2000-2099
    year += 2000;
  }

  if (year < 2000 || year > 2099) return null;

  return { month, year, normalized: `${String(month).padStart(2, '0')}/${String(year).slice(-2)}` };
};

const isExpiryInFutureOrCurrentMonth = ({ month, year }) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year > currentYear) return true;
  if (year < currentYear) return false;
  return month >= currentMonth;
};

const maskCardNumber = (digits) => {
  const normalized = normalizeCardNumber(digits);
  const last4 = normalized.slice(-4);
  if (last4.length !== 4) return '****';
  return `**** **** **** ${last4}`;
};

const validateCard = ({ creditCardNumber, creditCardExpiry }) => {
  const digits = normalizeCardNumber(creditCardNumber);
  if (!isValidLuhn(digits)) {
    return { ok: false, message: 'Invalid credit card number' };
  }

  const expiry = parseExpiry(creditCardExpiry);
  if (!expiry) {
    return { ok: false, message: 'Invalid credit card expiry date' };
  }

  if (!isExpiryInFutureOrCurrentMonth(expiry)) {
    return { ok: false, message: 'Credit card is expired' };
  }

  return {
    ok: true,
    maskedNumber: maskCardNumber(digits),
    normalizedExpiry: expiry.normalized
  };
};

module.exports = {
  normalizeCardNumber,
  isValidLuhn,
  parseExpiry,
  maskCardNumber,
  validateCard
};
