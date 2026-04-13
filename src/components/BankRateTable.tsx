'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';

interface BankRate {
  bankName: string;
  bankSlug: string;
  bankType: string;
  tenure?: string;
  generalRate: number;
  seniorCitizenRate?: number | null;
}

interface BankRateTableProps {
  title: string;
  rates: BankRate[];
  showTenure?: boolean;
  rateLabel?: string;
}

type SortField = 'bankName' | 'generalRate' | 'seniorCitizenRate';
type SortOrder = 'asc' | 'desc';

export default function BankRateTable({
  title, rates, showTenure = true, rateLabel = 'Rate',
}: BankRateTableProps): React.ReactElement {
  const [sortField, setSortField] = useState<SortField>('generalRate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = useCallback((field: SortField): void => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  }, [sortField]);

  const sortedRates = useMemo(() => {
    return [...rates].sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;
      if (sortField === 'bankName') { valA = a.bankName; valB = b.bankName; }
      else if (sortField === 'generalRate') { valA = Number(a.generalRate); valB = Number(b.generalRate); }
      else if (sortField === 'seniorCitizenRate') { valA = Number(a.seniorCitizenRate ?? 0); valB = Number(b.seniorCitizenRate ?? 0); }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [rates, sortField, sortOrder]);

  const SortArrow = ({ field }: { field: SortField }): React.ReactElement => (
    <span className={`ml-1 text-xs ${sortField === field ? 'text-primary' : 'text-gray-400'}`}>
      {sortField === field ? (sortOrder === 'asc' ? '\u25B2' : '\u25BC') : '\u25BC'}
    </span>
  );

  const bankTypeLabel = (type: string): string => {
    const map: Record<string, string> = {
      public: 'Public', private: 'Private', small_finance: 'Small Finance', cooperative: 'Co-op',
    };
    return map[type] ?? type;
  };

  return (
    <div className="mb-8">
      <h2 className="heading-3 mb-4">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-lg border border-gray-200">
          <thead>
            <tr className="bg-gray-50 text-left text-sm font-semibold text-gray-700">
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('bankName')}>
                Bank <SortArrow field="bankName" />
              </th>
              <th className="px-4 py-3">Type</th>
              {showTenure && <th className="px-4 py-3">Tenure</th>}
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('generalRate')}>
                {rateLabel} <SortArrow field="generalRate" />
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('seniorCitizenRate')}>
                Senior Citizen <SortArrow field="seniorCitizenRate" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRates.map((rate, index) => (
              <tr key={`${rate.bankSlug}-${rate.tenure}-${index}`} className="border-t border-gray-100 hover:bg-gray-50 text-sm">
                <td className="px-4 py-3">
                  <Link href={`/bank-rates/${rate.bankSlug}`} className="text-primary hover:underline font-medium">
                    {rate.bankName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{bankTypeLabel(rate.bankType)}</td>
                {showTenure && <td className="px-4 py-3 text-gray-600">{rate.tenure ?? '-'}</td>}
                <td className="px-4 py-3 font-semibold text-gray-900">{Number(rate.generalRate).toFixed(2)}%</td>
                <td className="px-4 py-3 text-gray-700">
                  {rate.seniorCitizenRate ? `${Number(rate.seniorCitizenRate).toFixed(2)}%` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rates.length === 0 && (
        <p className="text-center text-gray-500 py-8">No rates available yet.</p>
      )}
    </div>
  );
}