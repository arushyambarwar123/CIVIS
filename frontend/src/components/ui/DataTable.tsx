'use client';
import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
export default function DataTable({ columns, data, loading, emptyMessage }: any) {
  const [filter, setFilter] = useState('');
  if (loading) return <LoadingSpinner />;
  const filtered = data?.filter((r: any) => JSON.stringify(r).toLowerCase().includes(filter.toLowerCase()));
  return (
    <div className='bg-white border rounded-md'>
      <div className='p-4 border-b'>
        <input type='text' placeholder='Filter...' value={filter} onChange={e => setFilter(e.target.value)} className='border p-2 rounded w-full' />
      </div>
      <div className='overflow-x-auto'>
        <table className='w-full text-left border-collapse'>
          <thead>
            <tr className='bg-gray-50 border-b'>
              {columns.map((c: any, i: number) => <th key={i} className='p-3'>{c.header}</th>)}
            </tr>
          </thead>
          <tbody>
            {!filtered?.length ? <tr><td colSpan={columns.length} className='p-4 text-center'>{emptyMessage || 'No data'}</td></tr> :
              filtered.map((row: any, i: number) => (
                <tr key={i} className='border-b hover:bg-gray-50'>
                  {columns.map((c: any, j: number) => <td key={j} className='p-3'>{c.render ? c.render(row) : row[c.accessor]}</td>)}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
