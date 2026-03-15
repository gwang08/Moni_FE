'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Check, Lock, FileText, ClipboardList, RotateCcw } from 'lucide-react';
import { getRoadmapGoals } from '@/lib/roadmap-api';
import { SkeletonCard } from '@/components/ui/skeleton';
import type { RoadmapGoal, RoadmapTask, RoadmapSkill } from '@/types/roadmap.types';

const SKILL_CONFIG: Record<RoadmapSkill, { label: string; color: string; activeColor: string }> = {
  READING: { label: 'Reading', color: 'text-blue-600', activeColor: 'bg-blue-50 border-blue-200 text-blue-700' },
  LISTENING: { label: 'Listening', color: 'text-purple-600', activeColor: 'bg-purple-50 border-purple-200 text-purple-700' },
  WRITING: { label: 'Writing', color: 'text-green-600', activeColor: 'bg-green-50 border-green-200 text-green-700' },
  SPEAKING: { label: 'Speaking', color: 'text-orange-600', activeColor: 'bg-orange-50 border-orange-200 text-orange-700' },
};

const TASK_TYPE_LABEL: Record<string, string> = {
  PRACTICE_STIMULUS: 'Luyện tập',
  MINI_TEST: 'Kiểm tra',
  PLACEMENT_TEST: 'Bài đánh giá',
};

function TaskIcon({ task }: { task: RoadmapTask }) {
  if (task.status === 'DONE') return <Check className="h-4 w-4 text-green-600" />;
  if (task.status === 'LOCKED') return <Lock className="h-4 w-4 text-gray-400" />;
  if (task.taskType === 'MINI_TEST') return <ClipboardList className="h-4 w-4 text-orange-500" />;
  return <FileText className="h-4 w-4 text-blue-500" />;
}

function TaskCard({ task, skill }: { task: RoadmapTask; skill: RoadmapSkill }) {
  const router = useRouter();
  const hasLink = task.testId != null;

  const handleClick = () => {
    if (task.status === 'LOCKED' || !hasLink) return;
    const skillPath = skill.toLowerCase();
    router.push(`/practice/${skillPath}/${task.testId}?roadmapTaskId=${task.id}`);
  };

  const isClickable = task.status !== 'LOCKED' && hasLink;

  return (
    <button
      onClick={handleClick}
      disabled={!isClickable}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
        task.status === 'DONE'
          ? 'bg-green-50 border border-green-100 hover:border-green-300 cursor-pointer'
          : task.status === 'LOCKED'
            ? 'bg-gray-50 border border-gray-100 opacity-60 cursor-not-allowed'
            : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer'
      }`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        task.status === 'DONE' ? 'bg-green-100' : task.status === 'LOCKED' ? 'bg-gray-100' : 'bg-blue-50'
      }`}>
        <TaskIcon task={task} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${
          task.status === 'DONE' ? 'text-green-700' : task.status === 'LOCKED' ? 'text-gray-400' : 'text-gray-800'
        }`}>
          {task.stimulusTitle || TASK_TYPE_LABEL[task.taskType] || task.taskType}
        </p>
        <p className="text-xs text-gray-400">
          {TASK_TYPE_LABEL[task.taskType]}
          {task.questionCount ? ` • ${task.questionCount} câu` : ''}
          {task.status === 'DONE' && ' • Hoàn thành'}
        </p>
      </div>
      {task.status === 'TODO' && isClickable && (
        <span className="text-xs font-medium text-blue-500 flex-shrink-0">Làm →</span>
      )}
      {task.status === 'DONE' && isClickable && (
        <span className="flex items-center gap-1 text-xs font-medium text-green-600 flex-shrink-0">
          <RotateCcw className="h-3 w-3" /> Làm lại
        </span>
      )}
    </button>
  );
}

function SkillGoalView({ goal }: { goal: RoadmapGoal }) {
  const daysLeft = goal.deadline
    ? Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="space-y-4">
      {/* Band info */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          Band hiện tại: <span className="font-semibold text-gray-800">{goal.startingBand}</span>
          {' → '}
          Mục tiêu: <span className="font-semibold text-gray-800">{goal.targetBand}</span>
        </span>
        <span className="text-xs text-gray-400">
          {goal.roadmapVersion ? `v${goal.roadmapVersion}` : ''}
          {daysLeft !== null ? ` • Còn ${daysLeft} ngày` : ''}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-400 to-rose-400 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(goal.progress, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 text-right">{Math.round(goal.progress)}% hoàn thành</p>

      {/* Task list */}
      <div className="space-y-2">
        {goal.tasks.map((task) => (
          <TaskCard key={task.id} task={task} skill={goal.skill} />
        ))}
      </div>
    </div>
  );
}

export function LearningRoadmap() {
  const [goals, setGoals] = useState<RoadmapGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSkill, setActiveSkill] = useState<RoadmapSkill | null>(null);

  const fetchGoals = async () => {
    try {
      const data = await getRoadmapGoals();
      setGoals(data);
      if (data.length > 0 && !activeSkill) setActiveSkill(data[0].skill);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGoals(); }, []);

  // Refresh when AI recommendation updates goals
  useEffect(() => {
    const handler = () => fetchGoals();
    window.addEventListener('roadmap-updated', handler);
    return () => window.removeEventListener('roadmap-updated', handler);
  }, []);

  if (loading) return <SkeletonCard className="h-72" />;

  const activeGoal = goals.find((g) => g.skill === activeSkill) ?? goals[0];
  const availableSkills = goals.map((g) => g.skill);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-orange-500" />
        <h2 className="text-lg font-bold text-gray-800">Lộ trình học tập</h2>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <BookOpen className="h-6 w-6 text-orange-400" />
          </div>
          <p className="text-sm text-gray-500">
            Làm bài đánh giá trình độ để nhận lộ trình học tập phù hợp nhé!
          </p>
        </div>
      ) : (
        <>
          {/* Skill tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {availableSkills.map((skill) => {
              const config = SKILL_CONFIG[skill];
              const isActive = skill === activeSkill;
              return (
                <button
                  key={skill}
                  onClick={() => setActiveSkill(skill)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    isActive ? config.activeColor : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* Active goal content */}
          {activeGoal && <SkillGoalView goal={activeGoal} />}
        </>
      )}
    </div>
  );
}
