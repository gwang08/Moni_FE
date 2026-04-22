'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Code, LayoutGrid, Braces, Plus, Trash2, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Detail {
  label: string;
  value: string;
}

interface ValueItem {
  category: string;
  details: Detail[];
}

interface ChartData {
  title: string;
  chartType: string;
  keyTrends: string[];
  values: ValueItem[];
}

interface Props {
  data: string;
  onChange: (json: string) => void;
}

const CHART_TYPES = [
  'Line Graph', 'Bar Chart', 'Pie Chart', 'Table', 'Mixed Chart', 'Map', 'Process'
];

export function ChartDataEditor({ data, onChange }: Props) {
  const [mode, setLocalMode] = useState<'visual' | 'json'>('visual');
  const [formData, setFormData] = useState<ChartData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    try {
      const parsed = JSON.parse(data);
      // Ensure basic structure exists
      const sanitized: ChartData = {
        title: parsed.title || '',
        chartType: parsed.chartType || 'Line Graph',
        keyTrends: Array.isArray(parsed.keyTrends) ? parsed.keyTrends : [],
        values: Array.isArray(parsed.values) ? parsed.values.map((v: any) => ({
          category: v.category || '',
          details: Array.isArray(v.details) ? v.details.map((d: any) => ({
            label: d.label || '',
            value: d.value || ''
          })) : []
        })) : []
      };
      
      if (JSON.stringify(sanitized) !== JSON.stringify(formData)) {
        setFormData(sanitized);
      }
      setError(null);
    } catch (e) {
      setError('Dữ liệu JSON không hợp lệ.');
      if (mode === 'visual') setLocalMode('json');
    }
  }, [data]);

  const updateParent = (newData: ChartData) => {
    setFormData(newData);
    onChange(JSON.stringify(newData, null, 2));
  };

  const handleFieldChange = (field: keyof ChartData, value: any) => {
    if (!formData) return;
    updateParent({ ...formData, [field]: value });
  };

  const addKeyTrend = () => {
    if (!formData) return;
    handleFieldChange('keyTrends', [...formData.keyTrends, '']);
  };

  const removeKeyTrend = (index: number) => {
    if (!formData) return;
    const newTrends = [...formData.keyTrends];
    newTrends.splice(index, 1);
    handleFieldChange('keyTrends', newTrends);
  };

  const updateKeyTrend = (index: number, value: string) => {
    if (!formData) return;
    const newTrends = [...formData.keyTrends];
    newTrends[index] = value;
    handleFieldChange('keyTrends', newTrends);
  };

  const addValueItem = () => {
    if (!formData) return;
    handleFieldChange('values', [...formData.values, { category: '', details: [] }]);
  };

  const removeValueItem = (index: number) => {
    if (!formData) return;
    const newValues = [...formData.values];
    newValues.splice(index, 1);
    handleFieldChange('values', newValues);
  };

  const updateValueCategory = (index: number, category: string) => {
    if (!formData) return;
    const newValues = [...formData.values];
    newValues[index].category = category;
    handleFieldChange('values', newValues);
  };

  const addDetail = (valueIndex: number) => {
    if (!formData) return;
    const newValues = [...formData.values];
    newValues[valueIndex].details.push({ label: '', value: '' });
    handleFieldChange('values', newValues);
  };

  const removeDetail = (valueIndex: number, detailIndex: number) => {
    if (!formData) return;
    const newValues = [...formData.values];
    newValues[valueIndex].details.splice(detailIndex, 1);
    handleFieldChange('values', newValues);
  };

  const updateDetail = (valueIndex: number, detailIndex: number, field: keyof Detail, value: string) => {
    if (!formData) return;
    const newValues = [...formData.values];
    newValues[valueIndex].details[detailIndex][field] = value;
    handleFieldChange('values', newValues);
  };

  if (mode === 'json' || !formData) {
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

  const labelStyle = "block text-[0.875rem] font-extrabold text-[#92400e] mb-3 uppercase tracking-wider";
  const inputStyle = "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10 hover:border-amber-200";
  const sectionSpacing = "mb-8";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-200">
            <Braces className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-tighter">Phân tích biểu đồ (Writing Task 1)</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Trình soạn thảo dữ liệu AI chuyên dụng</p>
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

      <Card className="p-8 bg-white border-gray-100 shadow-2xl shadow-gray-200/50 rounded-[2.5rem] overflow-hidden border-t-8 border-t-amber-500">
        <div className="max-h-[750px] overflow-y-auto pr-2 custom-scrollbar space-y-8">
          
          {/* Section 1: Title */}
          <div className={sectionSpacing}>
            <label className={labelStyle}>Tiêu đề biểu đồ</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="VD: Comparison of Pebbleton: 20 years ago vs. Now"
              className={inputStyle}
            />
          </div>

          {/* Section 2: Chart Type */}
          <div className={sectionSpacing}>
            <label className={labelStyle}>Dạng bài (Loại biểu đồ)</label>
            <div className="relative">
              <select 
                value={formData.chartType}
                onChange={(e) => handleFieldChange('chartType', e.target.value)}
                className={`${inputStyle} appearance-none cursor-pointer`}
              >
                {CHART_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-600 pointer-events-none" />
            </div>
          </div>

          {/* Section 3: Key Trends */}
          <div className={sectionSpacing}>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[0.875rem] font-extrabold text-[#92400e] uppercase tracking-wider mb-0">Các xu hướng chính</label>
              <Button 
                onClick={addKeyTrend} 
                variant="ghost" 
                size="sm" 
                className="h-8 text-[10px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl px-3 border border-amber-100"
              >
                <Plus className="mr-1 h-3 w-3" /> THÊM XU HƯỚNG
              </Button>
            </div>
            <div className="space-y-3">
              {formData.keyTrends.map((trend, index) => (
                <div key={index} className="flex gap-2 group">
                  <input 
                    type="text" 
                    value={trend}
                    onChange={(e) => updateKeyTrend(index, e.target.value)}
                    placeholder="Nhập xu hướng..."
                    className={inputStyle}
                  />
                  <Button 
                    onClick={() => removeKeyTrend(index)} 
                    variant="ghost" 
                    size="icon" 
                    className="h-12 w-12 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shrink-0 border border-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {formData.keyTrends.length === 0 && (
                <div className="py-8 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center bg-slate-50/50">
                  <p className="text-xs text-gray-400 font-medium">Chưa có xu hướng nào</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Detailed Values */}
          <div className={sectionSpacing}>
            <div className="flex items-center justify-between mb-4">
              <label className="text-[0.875rem] font-extrabold text-[#92400e] uppercase tracking-wider mb-0">Dữ liệu phân tích chi tiết</label>
              <Button 
                onClick={addValueItem} 
                variant="ghost" 
                size="sm" 
                className="h-8 text-[10px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl px-3 border border-amber-100"
              >
                <Plus className="mr-1 h-3 w-3" /> THÊM NHÓM DỮ LIỆU
              </Button>
            </div>
            
            <div className="space-y-6">
              {formData.values.map((vItem, vIndex) => (
                <div key={vIndex} className="p-6 bg-amber-50/30 border border-amber-100/50 rounded-[2rem] relative group/item">
                  <Button 
                    onClick={() => removeValueItem(vIndex)} 
                    variant="ghost" 
                    size="icon" 
                    className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-white text-red-500 shadow-md border border-red-100 opacity-0 group-hover/item:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>

                  <div className="mb-6">
                    <label className="text-[10px] font-black text-amber-700/60 uppercase tracking-widest mb-2 block">Hạng mục / Mốc thời gian</label>
                    <input 
                      type="text" 
                      value={vItem.category}
                      onChange={(e) => updateValueCategory(vIndex, e.target.value)}
                      placeholder="VD: 1995 hoặc Urban areas..."
                      className={`${inputStyle} bg-white/80`}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-amber-700/60 uppercase tracking-widest">Chi tiết dữ liệu</label>
                      <Button 
                        onClick={() => addDetail(vIndex)} 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[9px] font-bold text-amber-600 bg-white hover:bg-amber-50 rounded-lg px-2 border border-amber-100"
                      >
                        <Plus className="mr-1 h-2.5 w-2.5" /> THÊM DÒNG
                      </Button>
                    </div>

                    <div className="grid gap-3">
                      {vItem.details.map((detail, dIndex) => (
                        <div key={dIndex} className="flex gap-2 items-center bg-white p-2 rounded-2xl border border-amber-100/30 shadow-sm">
                          <input 
                            type="text" 
                            value={detail.label}
                            onChange={(e) => updateDetail(vIndex, dIndex, 'label', e.target.value)}
                            placeholder="Đối tượng"
                            className="flex-1 rounded-xl border-none bg-slate-50 px-3 py-2 text-xs focus:ring-1 focus:ring-amber-400 focus:outline-none"
                          />
                          <input 
                            type="text" 
                            value={detail.value}
                            onChange={(e) => updateDetail(vIndex, dIndex, 'value', e.target.value)}
                            placeholder="Giá trị"
                            className="w-1/3 rounded-xl border-none bg-slate-50 px-3 py-2 text-xs font-bold text-amber-700 focus:ring-1 focus:ring-amber-400 focus:outline-none"
                          />
                          <Button 
                            onClick={() => removeDetail(vIndex, dIndex)} 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-xl text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {formData.values.length === 0 && (
                <div className="py-12 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center bg-slate-50/50">
                  <p className="text-xs text-gray-400 font-medium">Chưa có dữ liệu chi tiết</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </Card>

      <div className="flex items-center justify-between px-4 text-gray-400">
        <p className="text-[10px] font-medium italic">Công cụ tối ưu hóa cấu trúc dữ liệu cho mô hình ngôn ngữ lớn (LLM).</p>
        <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 px-3 py-1 rounded-full text-[9px] font-bold tracking-tight">AI READY FORMAT</Badge>
      </div>
    </div>
  );
}
