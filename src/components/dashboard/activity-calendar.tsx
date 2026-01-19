'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStore } from '@/store/user-store';
import { getCalendarData } from '@/lib/calendar-utils';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

export function ActivityCalendar() {
  const activities = useUserStore((state) => state.activities);
  const addActivity = useUserStore((state) => state.addActivity);

  const calendarData = getCalendarData(activities);

  // Get date 3 months ago
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);

  const handleAddMockActivity = () => {
    const today = new Date().toISOString().split('T')[0];
    const skills = ['listening', 'reading', 'writing', 'speaking'] as const;
    const randomSkill = skills[Math.floor(Math.random() * skills.length)];

    addActivity({
      id: crypto.randomUUID(),
      date: today,
      skill: randomSkill,
      duration: 30,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Calendar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="activity-calendar-container">
          <CalendarHeatmap
            startDate={startDate}
            endDate={endDate}
            values={calendarData}
            classForValue={(value) => {
              if (!value || value.count === 0) {
                return 'color-empty';
              }
              if (value.count <= 2) {
                return 'color-scale-1';
              }
              if (value.count <= 4) {
                return 'color-scale-2';
              }
              if (value.count <= 6) {
                return 'color-scale-3';
              }
              return 'color-scale-4';
            }}
            showWeekdayLabels
          />
        </div>
        <button
          onClick={handleAddMockActivity}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Add Activity
        </button>
        <style jsx global>{`
          .activity-calendar-container {
            padding: 1rem 0;
          }
          .react-calendar-heatmap {
            width: 100%;
          }
          .react-calendar-heatmap text {
            font-size: 10px;
            fill: hsl(var(--muted-foreground));
          }
          .react-calendar-heatmap .color-empty {
            fill: hsl(var(--muted));
          }
          .react-calendar-heatmap .color-scale-1 {
            fill: #9be9a8;
          }
          .react-calendar-heatmap .color-scale-2 {
            fill: #40c463;
          }
          .react-calendar-heatmap .color-scale-3 {
            fill: #30a14e;
          }
          .react-calendar-heatmap .color-scale-4 {
            fill: #216e39;
          }
          .react-calendar-heatmap rect {
            rx: 2;
          }
        `}</style>
      </CardContent>
    </Card>
  );
}
