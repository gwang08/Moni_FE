'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// This page is deprecated — expert selection now happens inside SpeakingModeDialog.
// Redirect old URLs gracefully so existing links don't break.
export default function ExpertScoringPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = searchParams.get('testId');

  useEffect(() => {
    if (testId) {
      // Re-open the speaking practice page which will show the mode dialog
      router.replace(`/practice/speaking/${testId}`);
    } else {
      router.replace('/practice?skill=speaking');
    }
  }, [router, testId]);

  return null;
}
