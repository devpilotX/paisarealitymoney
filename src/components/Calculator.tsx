'use client';

import { type ReactNode } from 'react';

interface CalculatorProps {
  title: string;
  description?: string;
  children: ReactNode;
  result?: ReactNode;
}

export default function Calculator({
  title,
  description,
  children,
  result,
}: CalculatorProps): React.ReactElement {
  return (
    <div className="card max-w-2xl">
      <h2 className="heading-3 mb-2">{title}</h2>
      {description && <p className="text-sm text-muted-2 mb-6">{description}</p>}

      <div className="space-y-5">{children}</div>

      {result && (
        <div className="mt-8 pt-6 border-t border-line">{result}</div>
      )}
    </div>
  );
}

export function CalcInput({
  id, label, value, onChange, type = 'number', min, max, step, prefix, suffix, placeholder,
}: {
  id: string; label: string; value: string;
  onChange: (val: string) => void;
  type?: 'number' | 'text'; min?: number; max?: number; step?: number;
  prefix?: string; suffix?: string; placeholder?: string;
}): React.ReactElement {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink mb-1">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-2 text-sm">{prefix}</span>
        )}
        <input
          id={id} type={type} value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min} max={max} step={step}
          placeholder={placeholder}
          className={`input-field ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-2 text-sm">{suffix}</span>
        )}
      </div>
    </div>
  );
}

export function CalcSlider({
  id, label, value, onChange, min, max, step = 1, prefix, suffix, displayValue,
}: {
  id: string; label: string; value: number;
  onChange: (val: number) => void;
  min: number; max: number; step?: number;
  prefix?: string; suffix?: string; displayValue?: string;
}): React.ReactElement {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className="text-sm font-medium text-ink">{label}</label>
        <span className="text-sm font-bold text-navy">
          {displayValue ?? `${prefix ?? ''}${value.toLocaleString('en-IN')}${suffix ?? ''}`}
        </span>
      </div>
      <input
        id={id} type="range" value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min} max={max} step={step}
        className="w-full h-2 bg-line/50 rounded-lg appearance-none cursor-pointer accent-navy"
      />
      <div className="flex justify-between text-xs text-muted-2 mt-1">
        <span>{prefix ?? ''}{min.toLocaleString('en-IN')}{suffix ?? ''}</span>
        <span>{prefix ?? ''}{max.toLocaleString('en-IN')}{suffix ?? ''}</span>
      </div>
    </div>
  );
}

export function CalcSelect({
  id, label, value, onChange, options,
}: {
  id: string; label: string; value: string;
  onChange: (val: string) => void;
  options: Array<{ value: string; label: string }>;
}): React.ReactElement {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink mb-1">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="input-field">
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export function CalcResult({
  items,
}: {
  items: Array<{ label: string; value: string; highlight?: boolean }>;
}): React.ReactElement {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className={`flex items-center justify-between py-2 ${
          item.highlight ? 'bg-brand-yellow-soft/40 border-l-4 border-brand-yellow rounded-r-[5px] px-4 -mx-1' : ''
        }`}>
          <span className={`text-sm ${item.highlight ? 'font-semibold text-navy' : 'text-muted'}`}>
            {item.label}
          </span>
          <span className={`font-bold ${item.highlight ? 'text-xl text-navy' : 'text-base text-ink'}`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
