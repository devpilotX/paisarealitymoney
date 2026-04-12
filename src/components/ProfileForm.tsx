'use client';

import { useState, useCallback } from 'react';
import { ALL_INDIAN_STATES } from '@/lib/cities';
import { trackSchemeSearch } from '@/lib/analytics';
import type { MatchedScheme } from '@/lib/matcher';

interface ProfileFormProps {
  onResults: (schemes: MatchedScheme[], totalBenefit: number) => void;
  onLoading: (loading: boolean) => void;
}

interface FormData {
  gender: string;
  age: string;
  state: string;
  district: string;
  area: string;
  category: string;
  bpl: boolean;
  minority: boolean;
  disability: boolean;
  income: string;
  occupation: string;
  education: string;
}

const INITIAL_FORM: FormData = {
  gender: '', age: '', state: '', district: '', area: '',
  category: '', bpl: false, minority: false, disability: false,
  income: '', occupation: '', education: '',
};

const STEPS = [
  { id: 1, title: 'About You', description: 'Gender and age' },
  { id: 2, title: 'Location', description: 'State and area' },
  { id: 3, title: 'Category', description: 'Caste and status' },
  { id: 4, title: 'Income', description: 'Income and work' },
  { id: 5, title: 'Education', description: 'Highest education' },
  { id: 6, title: 'Find Schemes', description: 'Get results' },
];

export default function ProfileForm({ onResults, onLoading }: ProfileFormProps): React.ReactElement {
  const [step, setStep] = useState<number>(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [error, setError] = useState<string>('');

  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  }, []);

  const nextStep = useCallback((): void => {
    if (step < 6) setStep((s) => s + 1);
  }, [step]);

  const prevStep = useCallback((): void => {
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    onLoading(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {};
      if (form.age) payload.age = parseInt(form.age, 10);
      if (form.gender) payload.gender = form.gender;
      if (form.state) payload.state = form.state;
      if (form.district) payload.district = form.district;
      if (form.area) payload.area = form.area;
      if (form.category) payload.category = form.category;
      if (form.income) payload.income = parseInt(form.income, 10);
      if (form.occupation) payload.occupation = form.occupation;
      if (form.education) payload.education = form.education;
      payload.bpl = form.bpl;
      payload.minority = form.minority;
      payload.disability = form.disability;

      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as { success: boolean; schemes?: MatchedScheme[]; totalBenefitValue?: number; error?: string };

      if (data.success && data.schemes) {
        onResults(data.schemes, data.totalBenefitValue ?? 0);
        trackSchemeSearch(form.state || 'all', data.schemes.length);
      } else {
        setError(data.error ?? 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Could not connect to the server. Please check your internet and try again.');
    } finally {
      onLoading(false);
    }
  }, [form, onResults, onLoading]);

  const renderRadioGroup = (_name: string, options: Array<{ value: string; label: string }>, selectedValue: string, onChange: (val: string) => void): React.ReactElement => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-3 rounded-lg border-2 text-base font-medium text-center
                     transition-all duration-200 min-h-[44px]
                     ${selectedValue === opt.value
                       ? 'border-primary bg-primary-50 text-primary'
                       : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="card max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-1 mb-6">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={`flex-1 h-2 rounded-full transition-colors duration-200 ${
              s.id <= step ? 'bg-primary' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className="text-sm text-gray-500 mb-1">Step {step} of 6</p>
      <h3 className="heading-3 mb-1">{STEPS[step - 1]?.title}</h3>
      <p className="text-sm text-gray-500 mb-6">{STEPS[step - 1]?.description}</p>

      {/* Step 1: Gender + Age */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-base font-medium text-gray-900 mb-3">Your Gender</label>
            {renderRadioGroup('gender', [
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'transgender', label: 'Transgender' },
            ], form.gender, (v) => updateField('gender', v))}
          </div>
          <div>
            <label htmlFor="age" className="block text-base font-medium text-gray-900 mb-2">Your Age</label>
            <input id="age" type="number" min="0" max="120" value={form.age} onChange={(e) => updateField('age', e.target.value)} className="input-field" placeholder="Enter your age (e.g. 25)" />
          </div>
        </div>
      )}

      {/* Step 2: State + Area */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <label htmlFor="state" className="block text-base font-medium text-gray-900 mb-2">Your State</label>
            <select id="state" value={form.state} onChange={(e) => updateField('state', e.target.value)} className="input-field">
              <option value="">Select your state</option>
              {ALL_INDIAN_STATES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-base font-medium text-gray-900 mb-3">Your Area Type</label>
            {renderRadioGroup('area', [
              { value: 'urban', label: 'Urban (City/Town)' },
              { value: 'rural', label: 'Rural (Village)' },
            ], form.area, (v) => updateField('area', v))}
          </div>
        </div>
      )}

      {/* Step 3: Category + BPL + Minority + Disability */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <label className="block text-base font-medium text-gray-900 mb-3">Caste Category</label>
            {renderRadioGroup('category', [
              { value: 'general', label: 'General' },
              { value: 'obc', label: 'OBC' },
              { value: 'sc', label: 'SC' },
              { value: 'st', label: 'ST' },
              { value: 'ews', label: 'EWS' },
            ], form.category, (v) => updateField('category', v))}
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
              <input type="checkbox" checked={form.bpl} onChange={(e) => updateField('bpl', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="text-base text-gray-900">Below Poverty Line (BPL) family</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
              <input type="checkbox" checked={form.minority} onChange={(e) => updateField('minority', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="text-base text-gray-900">Minority community</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
              <input type="checkbox" checked={form.disability} onChange={(e) => updateField('disability', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="text-base text-gray-900">Person with disability</span>
            </label>
          </div>
        </div>
      )}

      {/* Step 4: Income + Occupation */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <label htmlFor="income" className="block text-base font-medium text-gray-900 mb-2">Annual Family Income (Rs)</label>
            <input id="income" type="number" min="0" value={form.income} onChange={(e) => updateField('income', e.target.value)} className="input-field" placeholder="e.g. 300000" />
            <p className="text-xs text-gray-500 mt-1">Total income of your family per year. Enter 0 if no income.</p>
          </div>
          <div>
            <label className="block text-base font-medium text-gray-900 mb-3">Occupation</label>
            {renderRadioGroup('occupation', [
              { value: 'employed', label: 'Employed' },
              { value: 'self_employed', label: 'Self Employed' },
              { value: 'farmer', label: 'Farmer' },
              { value: 'student', label: 'Student' },
              { value: 'unemployed', label: 'Unemployed' },
              { value: 'homemaker', label: 'Homemaker' },
              { value: 'daily_wage', label: 'Daily Wage' },
              { value: 'business', label: 'Business' },
              { value: 'retired', label: 'Retired' },
            ], form.occupation, (v) => updateField('occupation', v))}
          </div>
        </div>
      )}

      {/* Step 5: Education */}
      {step === 5 && (
        <div>
          <label className="block text-base font-medium text-gray-900 mb-3">Highest Education</label>
          {renderRadioGroup('education', [
            { value: 'none', label: 'No formal education' },
            { value: 'primary', label: 'Primary (1st-5th)' },
            { value: '8th', label: 'Middle (6th-8th)' },
            { value: '10th', label: '10th Pass' },
            { value: '12th', label: '12th Pass' },
            { value: 'iti', label: 'ITI/Vocational' },
            { value: 'diploma', label: 'Diploma' },
            { value: 'graduate', label: 'Graduate' },
            { value: 'postgraduate', label: 'Post Graduate' },
          ], form.education, (v) => updateField('education', v))}
        </div>
      )}

      {/* Step 6: Review and Submit */}
      {step === 6 && (
        <div>
          <p className="text-body mb-4">We will now check your profile against active government schemes in the database and show you the ones you may be eligible for.</p>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            {form.gender && <p><strong>Gender:</strong> {form.gender}</p>}
            {form.age && <p><strong>Age:</strong> {form.age}</p>}
            {form.state && <p><strong>State:</strong> {form.state}</p>}
            {form.area && <p><strong>Area:</strong> {form.area}</p>}
            {form.category && <p><strong>Category:</strong> {form.category.toUpperCase()}</p>}
            {form.income && <p><strong>Annual Income:</strong> Rs {parseInt(form.income, 10).toLocaleString('en-IN')}</p>}
            {form.occupation && <p><strong>Occupation:</strong> {form.occupation.replace('_', ' ')}</p>}
            {form.education && <p><strong>Education:</strong> {form.education}</p>}
            {form.bpl && <p><strong>BPL:</strong> Yes</p>}
            {form.minority && <p><strong>Minority:</strong> Yes</p>}
            {form.disability && <p><strong>Disability:</strong> Yes</p>}
          </div>
          <p className="text-xs text-gray-500 mt-3">Your data is not stored. It is only used to find matching schemes.</p>
        </div>
      )}

      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 gap-4">
        {step > 1 ? (
          <button type="button" onClick={prevStep} className="btn-secondary">
            Back
          </button>
        ) : <div />}

        {step < 6 ? (
          <button type="button" onClick={nextStep} className="btn-primary">
            Next
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} className="btn-primary">
            Find My Schemes
          </button>
        )}
      </div>
    </div>
  );
}
