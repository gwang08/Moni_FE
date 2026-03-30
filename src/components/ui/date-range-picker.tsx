'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  label?: string;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function DateRangePicker({ value, onChange, label }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [tempRange, setTempRange] = useState<DateRange>(value);
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempRange(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const handleDateClick = (day: number) => {
    const clickedDate = formatDate(new Date(currentMonth.year, currentMonth.month, day));
    
    if (selecting === 'start') {
      setTempRange({ startDate: clickedDate, endDate: clickedDate });
      setSelecting('end');
    } else {
      if (clickedDate >= tempRange.startDate) {
        const newRange = { startDate: tempRange.startDate, endDate: clickedDate };
        setTempRange(newRange);
        onChange(newRange);
        setIsOpen(false);
        setSelecting('start');
      } else {
        setTempRange({ startDate: clickedDate, endDate: clickedDate });
        setSelecting('end');
      }
    }
  };

  const isInRange = (day: number): boolean => {
    const date = formatDate(new Date(currentMonth.year, currentMonth.month, day));
    return date >= tempRange.startDate && date <= tempRange.endDate;
  };

  const isStartDate = (day: number): boolean => {
    return formatDate(new Date(currentMonth.year, currentMonth.month, day)) === tempRange.startDate;
  };

  const isEndDate = (day: number): boolean => {
    return formatDate(new Date(currentMonth.year, currentMonth.month, day)) === tempRange.endDate;
  };

  const isToday = (day: number): boolean => {
    const today = formatDate(new Date());
    return formatDate(new Date(currentMonth.year, currentMonth.month, day)) === today;
  };

  const isDisabled = (day: number): boolean => {
    if (selecting === 'start') return false;
    const date = formatDate(new Date(currentMonth.year, currentMonth.month, day));
    return date < tempRange.startDate;
  };

  const daysInMonth = getDaysInMonth(currentMonth.year, currentMonth.month);
  const firstDay = getFirstDayOfMonth(currentMonth.year, currentMonth.month);
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const disabled = isDisabled(day);
      const inRange = isInRange(day);
      const start = isStartDate(day);
      const end = isEndDate(day);
      const today = isToday(day);

      let cellClass = 'h-8 w-8 text-sm rounded-md flex items-center justify-center cursor-pointer transition-colors ';
      
      if (disabled) {
        cellClass += 'text-gray-300 cursor-not-allowed';
      } else if (start || end) {
        cellClass += 'bg-blue-600 text-white font-medium';
      } else if (inRange) {
        cellClass += 'bg-blue-100 text-blue-900';
      } else if (today) {
        cellClass += 'bg-orange-100 text-orange-600 font-medium';
      } else {
        cellClass += 'text-gray-700 hover:bg-gray-100';
      }

      days.push(
        <div
          key={day}
          className={cellClass}
          onClick={() => !disabled && handleDateClick(day)}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  const displayValue = value.startDate && value.endDate
    ? `${new Date(value.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} - ${new Date(value.endDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
    : 'Chọn khoảng ngày';

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="flex items-center gap-2 text-gray-700">
          <Calendar className="h-4 w-4" />
          {displayValue}
        </span>
        <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 rounded-lg border border-gray-200 bg-white p-4 shadow-lg min-w-[280px]">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="rounded-md p-1 hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-gray-900">
              {monthNames[currentMonth.month]} {currentMonth.year}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              className="rounded-md p-1 hover:bg-gray-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
              <span key={day} className="text-xs font-medium text-gray-500">
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {renderCalendarDays()}
          </div>

          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <span className="text-xs text-gray-500">
              {selecting === 'start' ? 'Chọn ngày bắt đầu' : 'Chọn ngày kết thúc'}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setSelecting('start');
              }}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
