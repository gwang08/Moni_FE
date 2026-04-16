'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  Trash2, Plus, Code, LayoutGrid, Type, TrendingUp, Hash, 
  ChevronRight, ChevronDown, Settings2, AlignLeft, List, Box, Braces,
  Table as TableIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Props {
  data: string;
  onChange: (json: string) => void;
}

const KEY_LABELS: Record<string, string> = {
  title: 'Tiêu đề biểu đồ',
  chartType: 'Dạng bài (Loại biểu đồ)',
  keyTrends: 'Các xu hướng chính',
  values: 'Dữ liệu phân tích chi tiết',
};

/**
 * Modern Clean JSON Node Editor (Inspired by Jeremy Dorn's JSON Editor)
 */
function JsonNode({ 
  name, 
  value, 
  onUpdate, 
  onRemove,
  onRename,
  depth = 0 
}: { 
  name: string | number; 
  value: any; 
  onUpdate: (val: any) => void; 
  onRemove?: () => void;
  onRename?: (newName: string) => void;
  depth?: number;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isPrimitive = !isObject && !isArray;

  const handleTypeChange = (type: string) => {
    if (type === 'string') onUpdate('');
    else if (type === 'number') onUpdate(0);
    else if (type === 'object') onUpdate({});
    else if (type === 'array') onUpdate([]);
  };

  const displayName = typeof name === 'string' ? (KEY_LABELS[name] || name) : '';

  const NodeActions = () => (
    <div className="flex items-center gap-1 opacity-0 group-hover/node:opacity-100 transition-all duration-200">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1 hover:bg-gray-200 rounded text-gray-400" title="Đổi kiểu dữ liệu">
            <Settings2 className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="text-[11px]">
          <DropdownMenuItem onClick={() => handleTypeChange('string')}><AlignLeft className="h-3 w-3 mr-2" /> Chuyển sang Văn bản</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTypeChange('object')}><Box className="h-3 w-3 mr-2" /> Chuyển sang Nhóm thông tin</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTypeChange('array')}><List className="h-3 w-3 mr-2" /> Chuyển sang Danh sách</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {onRemove && (
        <button onClick={onRemove} className="p-1 hover:bg-red-50 text-red-400 rounded" title="Xóa">
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );

  const LabelArea = () => (
    <div className="flex items-center gap-2 flex-1 min-w-0 mb-1">
      {!isPrimitive && (
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-0.5 hover:bg-gray-100 rounded transition-colors"
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
        </button>
      )}
      {onRename && typeof name === 'string' && !KEY_LABELS[name] ? (
        <input
          value={name}
          onChange={(e) => onRename(e.target.value)}
          className="bg-transparent border-none focus:ring-0 p-0 text-[11px] font-bold text-gray-600 uppercase tracking-wide w-fit min-w-[60px] focus:bg-white px-1 rounded transition-all"
        />
      ) : (
        <span className={cn(
          "text-[11px] font-bold uppercase tracking-wider truncate",
          KEY_LABELS[name as string] ? "text-amber-700" : "text-gray-500"
        )}>
          {displayName || (typeof name === 'number' ? `#${name + 1}` : name)}
        </span>
      )}
    </div>
  );

  if (isPrimitive) {
    return (
      <div className="group/node flex flex-col py-2 px-1 transition-colors">
        <div className="flex items-center justify-between">
          <LabelArea />
          <NodeActions />
        </div>
        <Input
          value={value ?? ''}
          onChange={(e) => onUpdate(typeof value === 'number' ? Number(e.target.value) : e.target.value)}
          className="h-9 text-sm border-gray-200 focus-visible:ring-amber-500 shadow-none bg-white rounded-lg"
        />
      </div>
    );
  }

  return (
    <div className={cn(
      "group/node flex flex-col gap-1 transition-all rounded-xl",
      depth > 0 && "mt-2 p-3 border border-gray-100 bg-gray-50/30"
    )}>
      <div className="flex items-center justify-between">
        <LabelArea />
        <NodeActions />
      </div>

      {!isCollapsed && (
        <div className={cn(
          "space-y-4",
          depth === 0 ? "divide-y divide-gray-100" : "pl-2 border-l-2 border-gray-100 ml-1.5 pt-2"
        )}>
          {isArray ? (
            <>
              {value.map((item: any, idx: number) => (
                <JsonNode
                  key={idx}
                  name={idx}
                  value={item}
                  depth={depth + 1}
                  onUpdate={(v) => {
                    const next = [...value];
                    next[idx] = v;
                    onUpdate(next);
                  }}
                  onRemove={() => onUpdate(value.filter((_: any, i: number) => i !== idx))}
                />
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-[10px] text-blue-600 hover:bg-blue-50 w-full border border-dashed border-blue-100 rounded-lg mt-2"
                onClick={() => onUpdate([...value, typeof value[0] === 'object' ? {} : ""])}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Thêm mục mới vào danh sách
              </Button>
            </>
          ) : (
            <>
              {Object.keys(value).map((key) => (
                <JsonNode
                  key={key}
                  name={key}
                  value={value[key]}
                  depth={depth + 1}
                  onUpdate={(v) => onUpdate({ ...value, [key]: v })}
                  onRename={(newKey) => {
                    if (!newKey || newKey === key) return;
                    const next = { ...value };
                    next[newKey] = next[key];
                    delete next[key];
                    onUpdate(next);
                  }}
                  onRemove={() => {
                    const { [key]: _, ...rest } = value;
                    onUpdate(rest);
                  }}
                />
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-[10px] text-amber-600 hover:bg-amber-50 w-full border border-dashed border-amber-100 rounded-lg mt-2"
                onClick={() => {
                  const k = prompt('Nhập tên trường thông tin mới (tiếng Anh không dấu):');
                  if (k) onUpdate({ ...value, [k]: "" });
                }}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Thêm trường thông tin mới
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ChartDataEditor({ data, onChange }: Props) {
  const [mode, setLocalMode] = useState<'visual' | 'json'>('visual');
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    try {
      setParsedData(JSON.parse(data));
      setError(null);
    } catch (e) {
      setError('Dữ liệu JSON không hợp lệ.');
      if (mode === 'visual') setLocalMode('json');
    }
  }, [data]);

  const handleUpdate = (newData: any) => {
    setParsedData(newData);
    onChange(JSON.stringify(newData, null, 2));
  };

  if (mode === 'json' || !parsedData) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-100 rounded-lg"><Code className="h-4 w-4 text-slate-600" /></div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Trình soạn thảo JSON</h3>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocalMode('visual')} className="h-8 text-xs hover:bg-amber-50 hover:text-amber-700 rounded-xl">
            <LayoutGrid className="mr-1.5 h-4 w-4" /> Quay lại giao diện Form
          </Button>
        </div>
        <textarea
          value={data}
          onChange={(e) => onChange(e.target.value)}
          rows={20}
          className="w-full rounded-2xl border border-gray-300 bg-slate-900 text-emerald-400 p-6 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y shadow-2xl transition-all"
        />
        {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100">⚠️ {error}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-200">
            <Braces className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-tighter">Phân tích biểu đồ (Writing Task 1)</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Chỉnh sửa dữ liệu cấu trúc cho AI</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLocalMode('json')} 
          className="h-9 text-xs border-gray-200 text-gray-500 hover:bg-slate-900 hover:text-white transition-all shadow-sm rounded-2xl px-4"
        >
          <Code className="mr-1.5 h-4 w-4" /> Sửa JSON thô
        </Button>
      </div>

      <Card className="p-6 bg-white border-gray-100 shadow-2xl shadow-gray-200/50 rounded-3xl overflow-hidden border-t-4 border-t-amber-500">
        <div className="max-h-[700px] overflow-y-auto pr-4 custom-scrollbar">
          <JsonNode
            name="root"
            value={parsedData}
            onUpdate={handleUpdate}
          />
        </div>
      </Card>

      <div className="flex items-center justify-between px-2 text-gray-400">
        <p className="text-[10px] font-medium italic">Giao diện này tự động ánh xạ cấu trúc JSON của AI thành các ô nhập liệu.</p>
        <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100 transition-colors cursor-default">Cấu trúc chuẩn AI</Badge>
      </div>
    </div>
  );
}
