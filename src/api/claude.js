const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

export function buildGoalContext(goals, leakageReport, bofaData) {
  const lines = [];

  // BofA context
  if (goals?.bofaCurrentBalance) {
    lines.push(`BofA Cash Rewards balance: $${goals.bofaCurrentBalance.toLocaleString()}`);
    lines.push(`Target: $${goals.bofaTarget || 0}`);
    if (bofaData?.velocity) {
      lines.push(`Paydown velocity: $${bofaData.velocity}/month`);
      lines.push(`Months to payoff at current pace: ${bofaData.monthsToPayoff}`);
    }
    if (bofaData?.mtdPayments) {
      lines.push(`MTD payments to BofA: $${bofaData.mtdPayments}`);
    }
  }

  // Leakage context
  if (leakageReport && leakageReport.length > 0) {
    lines.push('');
    lines.push('Leakage categories this month:');
    for (const cat of leakageReport) {
      const overUnder = cat.delta >= 0 ? `$${cat.delta} OVER` : `$${Math.abs(cat.delta)} under`;
      lines.push(
        `- ${cat.category}: $${cat.mtdSpend} spent (baseline $${cat.baseline}) — ${overUnder}`
      );
    }
    const totalLeakage = leakageReport.reduce(
      (sum, c) => sum + Math.max(0, c.delta),
      0
    );
    if (totalLeakage > 0) {
      lines.push(`Total leakage over baseline: $${totalLeakage} — this is money NOT going to BofA.`);
    }
  }

  // Limits
  if (goals?.leakageLimits) {
    lines.push('');
    lines.push('Monthly leakage limits:');
    for (const [cat, limit] of Object.entries(goals.leakageLimits)) {
      lines.push(`- ${cat}: $${limit}/month`);
    }
  }

  return lines.join('\n');
}

export async function generateBrief(apiKey, goalContext, mtdSummary) {
  const systemPrompt = `You are MoneyHoney, a personal finance AI for Ben. You are opinionated, direct, and never hedge. Every response must reference at least one financial goal with specific dollar amounts. Keep responses to exactly 3 sentences. No filler. No "you might want to consider" — just tell it straight.

Goals context:
${goalContext}`;

  const userPrompt = `Here's Ben's spending this month so far:
${mtdSummary}

Give the morning brief. 3 sentences max. Reference BofA paydown or leakage with specific dollar amounts. Be direct.`;

  return callClaude(apiKey, systemPrompt, userPrompt);
}

export async function generateAllocation(apiKey, goalContext, paydayContext) {
  const systemPrompt = `You are MoneyHoney, a personal finance AI for Ben. Generate a payday allocation plan. Every dollar must be assigned. Priority order: bills due before next paycheck → groceries → gas → variable spending → BofA extra payment. Maximize the BofA extra payment. Output as a numbered list with dollar amounts. Be direct and specific.

Goals context:
${goalContext}`;

  const userPrompt = `Payday allocation needed:
${paydayContext}

Generate the full dollar-by-dollar allocation. Every dollar accounted for. BofA extra payment maximized.`;

  return callClaude(apiKey, systemPrompt, userPrompt);
}

async function callClaude(apiKey, systemPrompt, userPrompt, retries = 0) {
  if (!apiKey) {
    return 'AI brief unavailable — add your Anthropic API key in Settings.';
  }

  const url = 'https://api.anthropic.com/v1/messages';
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  };

  try {
    let res;

    if (window.electronAPI) {
      res = await window.electronAPI.fetch(url, fetchOptions);
    } else {
      const fetchRes = await fetch(url, {
        ...fetchOptions,
        headers: { ...fetchOptions.headers, 'anthropic-dangerous-direct-browser-access': 'true' },
      });
      res = { ok: fetchRes.ok, status: fetchRes.status, data: await fetchRes.json() };
    }

    if (!res.ok) {
      if (res.status === 401) {
        return 'AI brief unavailable — invalid Anthropic API key. Check Settings.';
      }
      if (res.status === 400 || res.status === 403) {
        return `AI brief unavailable — Claude API error ${res.status}.`;
      }
      throw new Error(`Claude API error: ${res.status}`);
    }

    const data = res.data;
    if (!data?.content?.[0]?.text) {
      return 'AI brief unavailable — unexpected response from Claude API.';
    }
    return data.content[0].text;
  } catch (err) {
    if (err.message.includes('unavailable') || err.message.includes('invalid')) {
      return err.message;
    }
    if (retries < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, retries);
      await new Promise((r) => setTimeout(r, delay));
      return callClaude(apiKey, systemPrompt, userPrompt, retries + 1);
    }
    return 'AI brief unavailable — could not reach Claude API. Check your connection.';
  }
}
