'use client';
import { useState } from 'react';
export default function RuleEditor({ label, description, value, type, onSave }: any) {
  const [val, setVal] = useState(value);
  const [enabled, setEnabled] = useState(true);
  return (
    <div className='flex items-center justify-between p-4 border-b bg-white'>
      <div>
        <p className='font-bold'>{label}</p>
        <p className='text-sm text-gray-500'>{description}</p>
      </div>
      <div className='flex gap-4 items-center'>
        <input type={type === 'number' ? 'number' : 'text'} value={val} onChange={e => setVal(e.target.value)} className='border p-2 rounded' />
        <input type='checkbox' checked={enabled} onChange={e => setEnabled(e.target.checked)} />
        <button onClick={() => onSave({value: val, enabled})} className='bg-accent text-white px-4 py-2 rounded'>Save</button>
      </div>
    </div>
  );
}
