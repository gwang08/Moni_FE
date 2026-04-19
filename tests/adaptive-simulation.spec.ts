import { test, Page, APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ─── Configuration ────────────────────────────────────────────────────────────
const CONFIG = {
  email: 'test2@gmail.com',
  password: ' A 1 a 2',
  baseUrl: 'https://moni-fe.vercel.app/',
  apiUrl: 'https://moni.hoangvu.qzz.io/api/v1',
  adminEmail: 'admin@cap.vn',
  adminPassword: 'admin123',
  daysToSimulate: 6,        // Simulate 6 days (full week minus Sunday assessment)
  screenshotDir: 'results',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** Decode JWT and extract a claim */
function jwtClaim(token: string, claim: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload[claim] ?? null;
  } catch { return null; }
}

/** Get token from Zustand auth-storage in localStorage */
async function getToken(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    try {
      const raw = localStorage.getItem('auth-storage');
      if (!raw) return null;
      return JSON.parse(raw)?.state?.token ?? null;
    } catch { return null; }
  });
}

/** Login as regular user */
async function loginUser(page: Page) {
  console.log('→ Logging in as test user...');
  await page.goto(CONFIG.baseUrl + 'login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Login form: inputs identified by placeholder (no name attribute)
  await page.getByPlaceholder('Email').first().fill(CONFIG.email);
  await page.getByPlaceholder('Mật khẩu').first().fill(CONFIG.password);

  // Click the green ĐĂNG NHẬP button (first one = login, second = register panel)
  await page.getByRole('button', { name: 'ĐĂNG NHẬP', exact: true }).first().click();

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 30000 });
  await page.waitForLoadState('networkidle');
  console.log('   ✓ Logged in.');
}

/** Get admin token by calling login API */
async function getAdminToken(request: APIRequestContext): Promise<string | null> {
  // Try with /api/v1 prefix first, then without (auth controller has no /api/v1 prefix)
  const urls = [
    `${CONFIG.apiUrl}/auth/token`,                                         // with /api/v1
    CONFIG.apiUrl.replace('/api/v1', '') + '/auth/token',                   // without /api/v1
  ];
  for (const url of urls) {
    try {
      console.log(`   Trying admin login at: ${url}`);
      const res = await request.post(url, {
        headers: { 'Content-Type': 'application/json' },
        data: { email: CONFIG.adminEmail, password: CONFIG.adminPassword },
      });
      if (res.ok()) {
        const body = await res.json();
        const token = body?.result?.token;
        if (token) {
          console.log(`   ✓ Admin token obtained from ${url}`);
          return token;
        }
      }
      const errBody = await res.text().catch(() => '');
      console.warn(`   ⚠ ${url} → ${res.status()} — ${errBody.substring(0, 150)}`);
    } catch (e) {
      console.warn(`   ⚠ ${url} → error:`, e);
    }
  }
  return null;
}

/** Call backend skip-day API with admin token */
async function skipDay(request: APIRequestContext, adminToken: string, userId: string): Promise<boolean> {
  const res = await request.post(
    `${CONFIG.apiUrl}/admin/simulation/skip-day/${userId}`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (res.ok()) {
    console.log('   ✓ Time advanced by 1 day on backend.');
    return true;
  }
  console.warn(`   ⚠ skip-day returned ${res.status()}`);
  return false;
}

/** Dismiss onboarding tour if present */
async function dismissTour(page: Page) {
  const btns = [
    page.getByRole('button', { name: /Tiếp theo/i }),
    page.getByRole('button', { name: /Bắt đầu học ngay/i }),
  ];
  for (const btn of btns) {
    if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await btn.click({ force: true });
      await page.waitForTimeout(500);
    }
  }
}

// ─── Skill-specific handlers ──────────────────────────────────────────────────

/**
 * READING / LISTENING
 * - Click MCQ radio buttons (first option per question)
 * - Fill text inputs for gap-filling with "migration" or similar
 * - Click matching option buttons
 * - Submit via the green check button (title="Nộp bài")
 */
async function handleReadingOrListening(page: Page, skill: string) {
  console.log(`   → Handling ${skill} task...`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // For listening: audio starts auto-play. We don't wait for it.
  // Answer MCQ radio buttons — pick first option per question group
  const radios = await page.locator('input[type="radio"]').all();
  let answered = 0;
  // Group radios by name (each question has a name="question-{id}")
  const seenNames = new Set<string>();
  for (const radio of radios) {
    const name = await radio.getAttribute('name').catch(() => null);
    if (!name || seenNames.has(name)) continue;
    seenNames.add(name);
    await radio.click({ force: true }).catch(() => {});
    await page.waitForTimeout(100);
    answered++;
  }

  // Answer MCQ buttons (non-exam mode uses <button> not <input type=radio>)
  // These are styled buttons with class containing "border-gray-200"
  const questionDivs = await page.locator('[id^="question-"]').all();
  for (const qDiv of questionDivs) {
    // Click first clickable button option inside this question div
    const optBtn = qDiv.locator('button').first();
    if (await optBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await optBtn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(100);
      answered++;
    }
  }

  // Answer gap-filling text inputs
  const textInputs = await page.locator('input[type="text"]').all();
  const gapAnswers = ['migration', 'technology', 'environment', 'increase', 'global', 'research', 'energy', 'water', 'population', 'climate'];
  for (let i = 0; i < textInputs.length; i++) {
    const inp = textInputs[i];
    if (await inp.isDisabled().catch(() => true)) continue;
    await inp.fill(gapAnswers[i % gapAnswers.length]);
    await page.waitForTimeout(100);
    answered++;
  }

  // Answer matching dropdowns/selects if any
  const selects = await page.locator('select').all();
  for (const sel of selects) {
    const options = await sel.locator('option').all();
    if (options.length > 1) {
      await sel.selectOption({ index: 1 }).catch(() => {});
      answered++;
    }
  }

  console.log(`   ✓ Answered ~${answered} inputs.`);

  // Submit: The reading/listening nav has a button with title="Nộp bài"
  const submitByTitle = page.locator('[title="Nộp bài"]');
  if (await submitByTitle.isVisible({ timeout: 3000 }).catch(() => false)) {
    await submitByTitle.click({ force: true });
  } else {
    // Fallback: any green submit button
    const submitFallback = page.getByRole('button', { name: /Hoàn thành|Nộp bài/i }).last();
    if (await submitFallback.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submitFallback.click({ force: true });
    }
  }

  // Confirm dialog: "Hoàn thành" or "Nộp bài"
  await page.waitForTimeout(1000);
  const confirmBtn = page.getByRole('button', { name: /Hoàn thành|Nộp bài/i }).last();
  if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await confirmBtn.click({ force: true });
  }

  // Wait for result page
  await page.waitForURL(/\/result/, { timeout: 20000 }).catch(() => {
    console.log('   ⚠ Result page not detected (may have timed out or redirected).');
  });
  console.log('   ✓ Submitted.');
}

/**
 * WRITING
 * Type a sample essay into each section textarea, then submit.
 * The footer has a green check button that triggers onSubmit.
 */
async function handleWriting(page: Page) {
  console.log('   → Handling WRITING task...');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const essayParts: Record<string, string> = {
    Introduction: 'The chart illustrates significant changes in the data presented over the given period. Overall, there is a clear upward trend throughout the time frame.',
    Overview: 'The most notable feature is the steady increase from the beginning to the end of the period. In contrast, other categories remained relatively stable.',
    'Body 1': 'Looking at the first category in more detail, the figures started at a modest level in the initial year and rose considerably by the end of the period. This represents a substantial growth of approximately fifty percent.',
    'Body 2': 'Turning to the second category, the trend was somewhat different. While there was a slight decline in the middle years, the overall trajectory was still positive, ending higher than where it began.',
    Conclusion: 'In conclusion, the data clearly shows that the overall trend is positive. The improvements are expected to continue in the coming years based on current trajectories.',
  };

  // Find all textareas (the writing editor renders one per section)
  const textareas = await page.locator('textarea').all();
  for (let i = 0; i < textareas.length; i++) {
    const ta = textareas[i];
    if (await ta.isDisabled().catch(() => true)) continue;
    await ta.click();
    await ta.fill('');
    // Determine which section by index
    const key = Object.keys(essayParts)[i % Object.keys(essayParts).length];
    await ta.type(essayParts[key], { delay: 5 }); // Type with minimal delay so word count updates
    await page.waitForTimeout(200);
  }

  console.log('   ✓ Typed essay content into all sections.');

  // Submit: footer has a button with title="Nộp bài" (Check icon)
  const submitBtn = page.locator('[title="Nộp bài"]').last();
  if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await submitBtn.click({ force: true });
  } else {
    const fallback = page.getByRole('button').filter({ has: page.locator('svg') }).last();
    await fallback.click({ force: true }).catch(() => {});
  }

  // After submit, a scoring options dialog appears — click "Bỏ qua" (Skip)
  await page.waitForTimeout(2000);
  const skipBtn = page.getByRole('button', { name: /Bỏ qua|Skip/i });
  if (await skipBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await skipBtn.click({ force: true });
    console.log('   ✓ Skipped AI scoring dialog.');
  }

  // Navigate to scoring history or back
  await page.waitForURL(/scoring-history|practice|dashboard/, { timeout: 10000 }).catch(() => {});
  console.log('   ✓ Writing submitted.');
}

/**
 * VOCAB_LEARN — Flashcard modal
 * Click "Đã học" for every word card shown.
 */
async function handleVocabLearn(page: Page) {
  console.log('   → Handling VOCAB_LEARN task...');
  let count = 0;
  const MAX = 60;

  // The confirm dialog should open when we click the slot
  // Then after confirming, a modal dialog opens with flashcards
  // Modal header: "Từ vựng hôm nay"
  await page.waitForSelector('role=heading[name="Từ vựng hôm nay"]', {
    timeout: 8000,
  }).catch(() => console.log('   ⚠ Vocab modal not detected.'));

  while (count < MAX) {
    const learnedBtn = page.getByRole('button', { name: 'Đã học' });
    if (!await learnedBtn.isVisible({ timeout: 2000 }).catch(() => false)) break;
    await learnedBtn.click({ force: true });
    await page.waitForTimeout(400);
    count++;
  }
  console.log(`   ✓ Clicked "Đã học" for ${count} vocab cards.`);
}

/**
 * VOCAB_TEST — Multiple choice quiz on /vocabulary/quiz
 * Click the first option button (option A) for each question, then "Tiếp".
 */
async function handleVocabTest(page: Page) {
  console.log('   → Handling VOCAB_TEST task...');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  let questionsAnswered = 0;
  const MAX_QUESTIONS = 30;

  while (questionsAnswered < MAX_QUESTIONS) {
    // Check if we're on the result screen
    const isResult = await page.locator('text=Kết quả').isVisible({ timeout: 500 }).catch(() => false);
    if (isResult) break;

    // The quiz card has option buttons (A, B, C, D)
    // They are buttons with a span containing A/B/C/D letter inside
    const optionBtns = page.locator('div.grid > button');
    const count = await optionBtns.count().catch(() => 0);
    if (count === 0) break;

    // Click first option (A)
    await optionBtns.first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(600); // Wait for feedback animation

    // Click "Tiếp" (Next) button
    const nextBtn = page.getByRole('button', { name: 'Tiếp' });
    if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextBtn.click({ force: true });
      await page.waitForTimeout(400);
    } else {
      break;
    }
    questionsAnswered++;
  }
  console.log(`   ✓ Answered ${questionsAnswered} vocab quiz questions.`);
}

/**
 * SPEAKING — This skill requires actual microphone access and WebSocket,
 * which is not automatable in headless mode. We log a skip.
 */
async function handleSpeaking(page: Page) {
  console.log('   → SPEAKING: requires microphone — using backend simulation only (skip UI).');
  // Navigate back to dashboard without doing anything
  await page.goto(CONFIG.baseUrl + 'dashboard');
}

// ─── Main slot handler ────────────────────────────────────────────────────────

interface SlotInfo {
  id: number;
  skill: string;
  taskType: string;
  testId: number | null;
  stimulusId: number | null;
  status: string;
  slotDate: string;
}

/**
 * Fetch the weekly plan via API and return today's TODO slots.
 */
async function fetchTodayTodoSlots(request: APIRequestContext, token: string): Promise<SlotInfo[]> {
  const res = await request.get(`${CONFIG.apiUrl}/learner/weekly-plan`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    console.warn(`   ⚠ weekly-plan API returned ${res.status()}`);
    return [];
  }
  const body = await res.json();
  const plan = body?.result ?? body;
  if (!plan?.slots) return [];

  // Get today's date in YYYY-MM-DD format
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return (plan.slots as any[])
    .filter(s => s.slotDate === today && s.status === 'TODO')
    .map(s => ({
      id: s.id,
      skill: s.skill,
      taskType: s.taskType,
      testId: s.testId,
      stimulusId: s.stimulusId,
      status: s.status,
      slotDate: s.slotDate,
    }));
}

/**
 * Process a single slot: navigate to the correct practice page and finish it.
 */
async function processSlot(page: Page, slot: SlotInfo): Promise<boolean> {
  console.log(`   → Processing slot #${slot.id}: skill=${slot.skill}, taskType=${slot.taskType}`);

  // ─── VOCAB_LEARN: Click on dashboard, confirm, learn flashcards ────
  if (slot.skill === 'VOCABULARY' && slot.taskType === 'VOCAB_LEARN') {
    // Navigate to dashboard and scroll to roadmap
    const roadmap = page.locator('#learning-roadmap-section');
    if (await roadmap.isVisible({ timeout: 5000 }).catch(() => false)) {
      await roadmap.scrollIntoViewIfNeeded();
    }
    await page.waitForTimeout(1500);

    // Find and click the VOCABULARY button that is NOT done
    // Slot buttons contain skill name as uppercase text
    const vocabBtns = page.getByRole('button').filter({ hasText: 'VOCABULARY' });
    const vocabCount = await vocabBtns.count();
    for (let i = 0; i < vocabCount; i++) {
      const btn = vocabBtns.nth(i);
      const hasDone = await btn.locator('svg').filter({ has: page.locator('.text-green-600') }).count().catch(() => 0);
      if (hasDone > 0) continue;
      const isDisabled = await btn.isDisabled().catch(() => false);
      if (isDisabled) continue;
      await btn.click({ force: true });
      break;
    }

    await page.waitForTimeout(800);

    // Confirm dialog: "Ok làm luôn"
    const confirmBtn = page.getByRole('button', { name: 'Ok làm luôn' });
    if (await confirmBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await confirmBtn.click({ force: true });
    }
    await page.waitForTimeout(2000);

    // Vocab modal: click "Đã học" for each word
    await handleVocabLearn(page);
    return true;
  }

  // ─── VOCAB_TEST: Navigate directly to quiz page ────
  if (slot.skill === 'VOCABULARY' && slot.taskType === 'VOCAB_TEST') {
    await page.goto(`${CONFIG.baseUrl}vocabulary/quiz?slotId=${slot.id}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await handleVocabTest(page);
    return true;
  }

  // ─── SPEAKING: Skip (requires mic) ────
  if (slot.skill === 'SPEAKING') {
    await handleSpeaking(page);
    return true;
  }

  // ─── READING / LISTENING / WRITING: Navigate directly ────
  const id = slot.testId ?? slot.stimulusId;
  if (!id) {
    console.log(`   ⚠ Slot has no testId or stimulusId. Skipping.`);
    return false;
  }

  const skillPath = slot.skill.toLowerCase(); // reading, listening, writing
  await page.goto(`${CONFIG.baseUrl}practice/${skillPath}/${id}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  if (slot.skill === 'WRITING') {
    await handleWriting(page);
  } else {
    await handleReadingOrListening(page, slot.skill);
  }
  return true;
}

// ─── Test ─────────────────────────────────────────────────────────────────────

test('Adaptive Learning Roadmap — Full Week Simulation', async ({ page, request }) => {
  test.setTimeout(600_000); // 10 minutes for multiple days

  ensureDir(CONFIG.screenshotDir);

  // 1. Login
  await loginUser(page);

  // 2. Get admin token for backend time-travel
  console.log('→ Getting admin token...');
  const adminToken = await getAdminToken(request);
  if (!adminToken) {
    console.warn('⚠ Could not get admin token — time-skip API will be skipped!');
  } else {
    console.log('   ✓ Admin token obtained.');
  }

  for (let day = 1; day <= CONFIG.daysToSimulate; day++) {
    console.log(`\n${'═'.repeat(55)}`);
    console.log(`  DAY ${day} of ${CONFIG.daysToSimulate}`);
    console.log(`${'═'.repeat(55)}`);

    // ── Navigate to dashboard (skip hard-reload on Day 1 to preserve session) ──
    if (day > 1) {
      await page.goto(CONFIG.baseUrl + 'dashboard');
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Dismiss onboarding tour
    await dismissTour(page);

    // Screenshot before
    await page.screenshot({
      path: path.join(CONFIG.screenshotDir, `day_${day}_before.png`),
      fullPage: true,
    });

    // ── Fetch today's TODO slots from API ──
    const userToken = await getToken(page);
    if (!userToken) {
      console.warn('   ⚠ No user token found. Cannot fetch weekly plan.');
      continue;
    }
    const todoSlots = await fetchTodayTodoSlots(request, userToken);
    console.log(`   Found ${todoSlots.length} TODO slot(s) for today.`);
    todoSlots.forEach(s => console.log(`      - ${s.skill} (${s.taskType}) testId=${s.testId} stimId=${s.stimulusId}`));

    // ── Process each TODO slot ──
    let slotsProcessed = 0;
    for (const slot of todoSlots) {
      try {
        // Navigate to dashboard before each slot for vocab learn
        if (slot.skill === 'VOCABULARY' && slot.taskType === 'VOCAB_LEARN') {
          await page.goto(CONFIG.baseUrl + 'dashboard');
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
          await dismissTour(page);
        }

        const ok = await processSlot(page, slot);
        if (ok) {
          slotsProcessed++;
          console.log(`   ✓ Slot ${slotsProcessed} done: ${slot.skill} (${slot.taskType})`);
        }
      } catch (e) {
        console.error(`   ✗ Error processing slot #${slot.id}:`, e);
        // Take error screenshot
        await page.screenshot({
          path: path.join(CONFIG.screenshotDir, `day_${day}_error_slot_${slot.id}.png`),
          fullPage: true,
        });
      }
      await page.waitForTimeout(1000);
    }

    // Screenshot after
    await page.goto(CONFIG.baseUrl + 'dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(CONFIG.screenshotDir, `day_${day}_after.png`),
      fullPage: true,
    });

    // ── Backend time-skip ──────────────────────────────────────────
    if (adminToken) {
      const userId = jwtClaim(userToken, 'userId');
      if (userId) {
        console.log(`\n→ Advancing time (userId=${userId})...`);
        await skipDay(request, adminToken, userId);
      } else {
        console.warn('   ⚠ Could not extract userId from token.');
      }
    }

    console.log(`\n  ✅ Day ${day} simulation complete (${slotsProcessed} slot(s) processed).`);
  }

  // ── Verify: call verify-assessment API ────────────────────────────
  console.log('\n→ Running verify-assessment diagnostic...');
  const userToken = await getToken(page);
  const userId = userToken ? jwtClaim(userToken, 'userId') : null;

  if (adminToken && userId) {
    const verifyRes = await request.get(
      `${CONFIG.apiUrl}/admin/simulation/verify-assessment/${userId}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (verifyRes.ok()) {
      const data = await verifyRes.json();
      console.log('\n📊 VERIFY-ASSESSMENT RESULT:');
      console.log(JSON.stringify(data?.result ?? data, null, 2));
      fs.writeFileSync(
        path.join(CONFIG.screenshotDir, 'verify_assessment_result.json'),
        JSON.stringify(data, null, 2)
      );
      console.log(`\n   → Result saved to ${CONFIG.screenshotDir}/verify_assessment_result.json`);
    } else {
      console.warn('   ⚠ verify-assessment returned', verifyRes.status());
    }
  }

  console.log('\n🎉 Simulation complete! Check the "results/" folder for screenshots and assessment data.');
});
