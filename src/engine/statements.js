import { DEDUP_WINDOW_DAYS } from '../shared/constants';
import { categorizeTransaction } from './transactions';

/**
 * Parse a PDF statement's raw text into transactions
 * Supports Chase and BofA statement formats
 */
export function parseStatement(rawText) {
  if (!rawText || rawText.trim().length === 0) return [];

  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const transactions = [];

  // Common date pattern: MM/DD or MM/DD/YY or MM/DD/YYYY
  const datePattern = /^(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s+/;
  // Amount pattern: captures dollar amounts like 1,234.56 or -1,234.56
  const amountPattern = /(-?\$?\d{1,3}(?:,\d{3})*\.\d{2})\s*$/;

  for (const line of lines) {
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;

    const amountMatch = line.match(amountPattern);
    if (!amountMatch) continue;

    const dateStr = dateMatch[1];
    const amountStr = amountMatch[1].replace(/[$,]/g, '');
    const amount = parseFloat(amountStr);

    if (isNaN(amount)) continue;

    // Extract payee (everything between date and amount)
    const afterDate = line.substring(dateMatch[0].length);
    const payee = afterDate.replace(amountPattern, '').trim();

    if (!payee) continue;

    // Normalize date to YYYY-MM-DD
    const normalizedDate = normalizeDate(dateStr);
    if (!normalizedDate) continue;

    transactions.push({
      date: normalizedDate,
      payee: payee,
      amount: Math.round(amount * -1000), // Convert to milliunits (negative = spending)
      category: 'Uncategorized',
      accountId: 'statement-upload',
      memo: 'From statement upload',
      source: 'statement',
    });
  }

  // Categorize all parsed transactions
  return transactions.map(categorizeTransaction);
}

/**
 * Normalize a date string to YYYY-MM-DD
 */
function normalizeDate(dateStr) {
  const parts = dateStr.split('/');
  if (parts.length < 2) return null;

  const month = parts[0].padStart(2, '0');
  const day = parts[1].padStart(2, '0');
  let year;

  if (parts.length === 3) {
    year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
  } else {
    year = new Date().getFullYear().toString();
  }

  const result = `${year}-${month}-${day}`;
  // Validate
  const d = new Date(result);
  if (isNaN(d.getTime())) return null;
  return result;
}

/**
 * Normalize a payee string for matching
 */
export function normalizePayee(payee) {
  if (!payee) return '';
  return payee
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')        // Collapse whitespace
    .replace(/\d{4,}/g, '')      // Remove long numbers (transaction IDs)
    .trim();
}

/**
 * Deduplicate statement transactions against YNAB transactions
 * Match on: date ± DEDUP_WINDOW_DAYS + amount + normalized payee
 */
export function deduplicateAgainstYNAB(parsedTxns, ynabTxns) {
  if (!parsedTxns || parsedTxns.length === 0) return [];
  if (!ynabTxns || ynabTxns.length === 0) return parsedTxns;

  return parsedTxns.filter((parsed) => {
    const normalizedParsedPayee = normalizePayee(parsed.payee);
    const parsedAmount = parsed.amount;
    const parsedDate = new Date(parsed.date + 'T12:00:00');

    // Check if any YNAB transaction matches
    const isDuplicate = ynabTxns.some((ynab) => {
      // Amount must match (within tolerance for rounding)
      if (Math.abs(ynab.amount - parsedAmount) > 10) return false; // 1 cent tolerance in milliunits

      // Date must be within window
      const ynabDate = new Date(ynab.date + 'T12:00:00');
      const daysDiff = Math.abs((parsedDate - ynabDate) / (1000 * 60 * 60 * 24));
      if (daysDiff > DEDUP_WINDOW_DAYS) return false;

      // Payee similarity check
      const normalizedYnabPayee = normalizePayee(ynab.payee);
      if (normalizedParsedPayee && normalizedYnabPayee) {
        // Check if either contains the other or they share significant overlap
        return (
          normalizedParsedPayee.includes(normalizedYnabPayee) ||
          normalizedYnabPayee.includes(normalizedParsedPayee) ||
          computeSimilarity(normalizedParsedPayee, normalizedYnabPayee) > 0.6
        );
      }

      // If payees are empty, match on date + amount alone
      return true;
    });

    return !isDuplicate;
  });
}

/**
 * Simple string similarity (Dice coefficient)
 */
function computeSimilarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const bigrams = (str) => {
    const arr = [];
    for (let i = 0; i < str.length - 1; i++) {
      arr.push(str.substring(i, i + 2));
    }
    return arr;
  };

  const aBigrams = bigrams(a);
  const bBigrams = bigrams(b);
  const bCounts = {};
  for (const bg of bBigrams) {
    bCounts[bg] = (bCounts[bg] || 0) + 1;
  }
  let matches = 0;
  for (const bg of aBigrams) {
    if (bCounts[bg] > 0) {
      matches++;
      bCounts[bg]--;
    }
  }

  return (2 * matches) / (aBigrams.length + bBigrams.length);
}

/**
 * Merge new transactions into existing baseline history
 */
export function mergeIntoBaseline(existingHistory, newTxns) {
  if (!newTxns || newTxns.length === 0) return existingHistory || [];

  const existing = existingHistory || [];
  // Deduplicate against existing baseline
  const unique = deduplicateAgainstYNAB(newTxns, existing);
  return [...existing, ...unique];
}
