'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/auth.types';
import { toast } from 'sonner';
import {
  FlaskConical, Play, FastForward, RotateCcw, CheckCircle2, Loader2,
  Calendar, Zap, TrendingUp, AlertTriangle,
} from 'lucide-react';

interface SimResult {
  action: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export default function SimulationPage() {
  const [userId, setUserId] = useState('');
  const [fastForwardWeeks, setFastForwardWeeks] = useState(1);
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<SimResult[]>([]);

  const addResult = useCallback((action: string, data: Record<string, unknown>) => {
    setResults(prev => [{
      action,
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      data,
    }, ...prev]);
  }, []);

  const callSimApi = useCallback(async (
    endpoint: string,
    action: string,
    method: 'POST' | 'GET' = 'POST'
  ) => {
    if (!userId.trim()) {
      toast.error('Vui lòng nhập User ID (credential ID)');
      return;
    }
    setLoading(action);
    try {
      const url = `/api/v1/admin/simulation${endpoint}`;
      const res = method === 'POST'
        ? await apiClient.post<ApiResponse<Record<string, unknown>>>(url, {}, true)
        : await apiClient.get<ApiResponse<Record<string, unknown>>>(url, true);
      addResult(action, res.result ?? {});
      toast.success(res.message || 'Thành công!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi không xác định';
      addResult(`❌ ${action}`, { error: message });
      toast.error(message);
    } finally {
      setLoading(null);
    }
  }, [userId, addResult]);

  const handleCompleteDay = (day: number) => callSimApi(`/complete-day/${userId}/${day}`, `Complete Day ${day}`);
  const handleCompleteWeek = () => callSimApi(`/complete-week/${userId}`, 'Complete Week');
  const handleEvaluateAndNext = () => callSimApi(`/evaluate-and-next/${userId}`, 'Evaluate & Generate Next');
  const handleFastForward = () => callSimApi(`/fast-forward/${userId}?weeks=${fastForwardWeeks}`, `Fast Forward ${fastForwardWeeks} weeks`);
  const handleReset = () => callSimApi(`/reset/${userId}`, 'Reset All Plans');

  const isLoading = loading !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-200">
            <FlaskConical className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Adaptive Learning Simulator</h1>
            <p className="text-sm text-gray-500">Giả lập time-skip để test hệ thống Weekly Plan</p>
          </div>
        </div>

        {/* User ID Input */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            User Credential ID
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Nhập credential ID của user cần test (VD: f320eb6c-...)"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
          />
          <p className="mt-2 text-xs text-gray-400">
            Lấy từ bảng <code className="bg-gray-100 px-1 rounded">user_credentials.id</code> trong database
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

          {/* Complete Individual Days */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-blue-500" />
              <h3 className="font-bold text-gray-800">Complete Day</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Hoàn thành tất cả slot của 1 ngày cụ thể với điểm ngẫu nhiên (40%-90%)
            </p>
            <div className="grid grid-cols-7 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map(day => (
                <button
                  key={day}
                  onClick={() => handleCompleteDay(day)}
                  disabled={isLoading}
                  className="px-2 py-2 rounded-lg text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading === `Complete Day ${day}` ? (
                    <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                  ) : (
                    `D${day}`
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Complete Entire Week */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <h3 className="font-bold text-gray-800">Complete Week</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Hoàn thành toàn bộ slot còn lại TODO trong tuần hiện tại
            </p>
            <button
              onClick={handleCompleteWeek}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading === 'Complete Week' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Hoàn thành toàn bộ tuần
            </button>
          </div>

          {/* Evaluate & Generate Next */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-violet-500" />
              <h3 className="font-bold text-gray-800">Evaluate & Next</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Đánh giá tuần hiện tại (accuracy, verdict) → đóng tuần → sinh tuần mới tự động
            </p>
            <button
              onClick={handleEvaluateAndNext}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl text-sm font-bold bg-violet-500 text-white hover:bg-violet-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading === 'Evaluate & Generate Next' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              Evaluate → Generate Next Week
            </button>
          </div>

          {/* Fast Forward N Weeks */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <FastForward className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-gray-800">Fast Forward</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Complete + Evaluate + Generate cho N tuần liên tiếp (full simulation)
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={12}
                value={fastForwardWeeks}
                onChange={(e) => setFastForwardWeeks(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                className="w-20 px-3 py-3 rounded-xl border border-gray-200 text-sm text-center font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <button
                onClick={handleFastForward}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading?.startsWith('Fast Forward') ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FastForward className="h-4 w-4" />
                )}
                Skip {fastForwardWeeks} tuần
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone: Reset */}
        <div className="bg-red-50 rounded-2xl border border-red-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h3 className="font-bold text-red-800">Danger Zone</h3>
          </div>
          <p className="text-xs text-red-600 mb-4">
            Xoá toàn bộ weekly plans + daily slots của user và sinh lại từ đầu (Week 1)
          </p>
          <button
            onClick={() => {
              if (window.confirm('Bạn có chắc muốn RESET toàn bộ lộ trình?')) {
                handleReset();
              }
            }}
            disabled={isLoading}
            className="px-4 py-3 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading === 'Reset All Plans' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Reset & Regenerate
          </button>
        </div>

        {/* Results Log */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm">Simulation Log</h3>
            {results.length > 0 && (
              <button
                onClick={() => setResults([])}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
            {results.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">
                Chưa có kết quả. Chạy một simulation action phía trên.
              </div>
            ) : (
              results.map((r, i) => (
                <div key={i} className="px-6 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      r.action.startsWith('❌') 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {r.action}
                    </span>
                    <span className="text-[10px] text-gray-400">{r.timestamp}</span>
                  </div>
                  <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 overflow-x-auto font-mono leading-relaxed">
                    {JSON.stringify(r.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Usage Guide */}
        <div className="mt-6 bg-violet-50 rounded-2xl border border-violet-100 p-6">
          <h3 className="font-bold text-violet-900 text-sm mb-3">📋 Hướng dẫn sử dụng</h3>
          <div className="space-y-2 text-xs text-violet-700 leading-relaxed">
            <p><strong>Luồng test cơ bản:</strong></p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Nhập User Credential ID vào ô phía trên</li>
              <li>Click <strong>Complete Week</strong> → hoàn thành toàn bộ slot với điểm ngẫu nhiên</li>
              <li>Click <strong>Evaluate & Next</strong> → đánh giá tuần, tính verdict (IMPROVED/STABLE/DECLINED), sinh tuần mới</li>
              <li>Reload dashboard để xem tuần mới với độ khó đã được điều chỉnh</li>
            </ol>
            <p className="mt-2"><strong>Test nhanh:</strong> Dùng <strong>Fast Forward</strong> để tua N tuần liên tiếp (complete + evaluate + generate per week)</p>
            <p><strong>Test từ đầu:</strong> Dùng <strong>Reset & Regenerate</strong> để xoá sạch và bắt đầu lại từ Week 1</p>
          </div>
        </div>
      </div>
    </div>
  );
}
