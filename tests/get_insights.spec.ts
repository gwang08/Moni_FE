import { test, expect } from '@playwright/test';

test('fetch insights for user', async ({ request }) => {
  const res = await request.post('https://moni.hoangvu.qzz.io/auth/token', {
    headers: { 'Content-Type': 'application/json' },
    data: { email: 'quan.le.1493@gmail.com', password: '123456' },
  });
  const data = await res.json();
  const token = data.result.token;
  
  const insightsRes = await request.get('https://moni.hoangvu.qzz.io/api/v1/learner/goals/insights', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const insights = await insightsRes.json();
  const allTags = (insights.result.weakestTags || []).concat(insights.result.strongestTags || []);
  console.log('Metrics:', JSON.stringify(allTags, null, 2));
});
