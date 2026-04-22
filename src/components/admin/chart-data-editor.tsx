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
      
      // Flexible normalization for AI results
      let normalizedTrends: string[] = [];
      if (Array.isArray(parsed.keyTrends)) {
        normalizedTrends = parsed.keyTrends;
      } else if (typeof parsed.keyTrends === 'string') {
        normalizedTrends = [parsed.keyTrends];
      }

      let normalizedValues: ValueItem[] = [];
      if (Array.isArray(parsed.values)) {
        if (parsed.values.length > 0 && typeof parsed.values[0] === 'string') {
          // Flattened string array from AI (e.g. process steps)
          normalizedValues = [{
            category: 'Thông tin chi tiết',
            details: parsed.values.map((v: string) => ({ label: 'Chi tiết', value: v }))
          }];
        } else {
          // Standard object array
          normalizedValues = parsed.values.map((v: any) => ({
            category: v.category || '',
            details: Array.isArray(v.details) ? v.details.map((d: any) => ({
              label: d.label || '',
              value: d.value || ''
            })) : []
          }));
        }
      }

      const sanitized: ChartData = {
        title: parsed.title || '',
        chartType: parsed.chartType || 'Line Graph',
        keyTrends: normalizedTrends,
        values: normalizedValues
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
          <Button variant="outline" size="sm" onClick={() => setLocalMode('visual')} className="h-8 text-xs hover:bg-slate-100 rounded-xl">
            <LayoutGrid className="mr-1.5 h-4 w-4" /> Quay lại giao diện Form
          </Button>
        </div>
        <textarea
          value={data}
          onChange={(e) => onChange(e.target.value)}
          rows={20}
          className="w-full rounded-2xl border border-gray-300 bg-slate-900 text-emerald-400 p-6 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y shadow-2xl transition-all"
        />
        {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100">⚠️ {error}</div>}
      </div>
    );
  }

  const labelStyle = "block text-sm font-semibold text-slate-700 mb-2";
  const inputStyle = "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/5 hover:border-slate-300";
  const sectionSpacing = "mb-8";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-8">
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
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Section 3: Key Trends */}
        <div className={sectionSpacing}>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-slate-700 mb-0">Các xu hướng chính</label>
            <Button 
              onClick={addKeyTrend} 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg px-3"
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Thêm xu hướng
            </Button>
          </div>
          <div className="space-y-3">
            {formData.keyTrends.map((trend, index) => (
              <div key={index} className="flex gap-2 group items-start">
                <textarea 
                  value={trend}
                  onChange={(e) => updateKeyTrend(index, e.target.value)}
                  placeholder="Nhập xu hướng..."
                  rows={2}
                  className={`${inputStyle} resize-none py-3`}
                />
                <Button 
                  onClick={() => removeKeyTrend(index)} 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shrink-0 mt-0.5"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {formData.keyTrends.length === 0 && (
              <div className="py-8 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center bg-slate-50/50">
                <p className="text-xs text-gray-400 font-medium">Chưa có xu hướng nào</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Detailed Values */}
        <div className={sectionSpacing}>
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-semibold text-slate-700 mb-0">Dữ liệu phân tích chi tiết</label>
            <Button 
              onClick={addValueItem} 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg px-3"
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Thêm nhóm dữ liệu
            </Button>
          </div>
          
          <div className="space-y-6">
            {formData.values.map((vItem, vIndex) => {
              const isDefaultCategory = vItem.category === 'Thông tin chi tiết' || !vItem.category;
              
              return (
                <div key={vIndex} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl relative group/item shadow-sm">
                  <Button 
                    onClick={() => removeValueItem(vIndex)} 
                    variant="ghost" 
                    size="icon" 
                    className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-white text-red-500 shadow-sm border border-red-100 opacity-0 group-hover/item:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>

                  {!isDefaultCategory && (
                    <div className="mb-6">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Hạng mục / Mốc thời gian</label>
                      <input 
                        type="text" 
                        value={vItem.category}
                        onChange={(e) => updateValueCategory(vIndex, e.target.value)}
                        placeholder="VD: 1995 hoặc Urban areas..."
                        className={`${inputStyle} bg-white`}
                      />
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {isDefaultCategory ? 'Danh sách chi tiết' : 'Chi tiết dữ liệu'}
                      </label>
                      <Button 
                        onClick={() => addDetail(vIndex)} 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[10px] font-bold text-blue-600 bg-white hover:bg-blue-50 rounded-md px-2 border border-blue-100"
                      >
                        <Plus className="mr-1 h-3 w-3" /> Thêm dòng
                      </Button>
                    </div>

                    <div className="grid gap-3">
                      {vItem.details.map((detail, dIndex) => {
                        const isDefaultLabel = detail.label === 'Chi tiết' || !detail.label;
                        
                        return (
                          <div key={dIndex} className="flex gap-2 items-start bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                            {!isDefaultLabel && (
                              <input 
                                type="text" 
                                value={detail.label}
                                onChange={(e) => updateDetail(vIndex, dIndex, 'label', e.target.value)}
                                placeholder="Đối tượng"
                                className="w-1/3 rounded-lg border-none bg-slate-50 px-3 py-2 text-xs focus:ring-1 focus:ring-blue-400 focus:outline-none"
                              />
                            )}
                            <textarea 
                              value={detail.value}
                              onChange={(e) => updateDetail(vIndex, dIndex, 'value', e.target.value)}
                              placeholder="Giá trị"
                              rows={1}
                              className={`flex-1 rounded-lg border-none bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-400 focus:outline-none resize-none min-h-[38px]`}
                              onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = `${target.scrollHeight}px`;
                              }}
                            />
                            <Button 
                              onClick={() => removeDetail(vIndex, dIndex)} 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg text-red-200 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
            {formData.values.length === 0 && (
              <div className="py-12 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center bg-slate-50/50">
                <p className="text-xs text-gray-400 font-medium">Chưa có dữ liệu chi tiết</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
