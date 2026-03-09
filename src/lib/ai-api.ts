const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function getAuthToken(): string {
  const stored = localStorage.getItem('auth-storage');
  if (!stored) throw new Error('No authentication token found');
  try {
    const { state } = JSON.parse(stored);
    return state?.token || '';
  } catch {
    throw new Error('No authentication token found');
  }
}

// Writing score - multipart form data
export async function scoreWriting(params: {
  taskType: number;
  question: string;
  answer: string;
  chartImage?: File;
}): Promise<Record<string, unknown>> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('taskType', String(params.taskType));
  formData.append('question', params.question);
  formData.append('answer', params.answer);
  if (params.chartImage) {
    formData.append('chartImage', params.chartImage);
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/ai/writing/score`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) throw new Error('Failed to score writing');
  return response.json();
}

// Speaking score - multipart form data
export async function scoreSpeaking(params: {
  audio: File;
  question: string;
}): Promise<Record<string, unknown>> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('audio', params.audio);
  formData.append('question', params.question);

  const response = await fetch(`${API_BASE_URL}/api/v1/ai/speaking/score`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) throw new Error('Failed to score speaking');
  return response.json();
}
