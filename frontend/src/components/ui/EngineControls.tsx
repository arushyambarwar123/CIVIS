'use client';
export default function EngineControls({ engines, onResult }: any) {
  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
      {engines.map((e: any, i: number) => (
        <button key={i} onClick={() => onResult(e.label, 'Result')} className='bg-white border p-4 rounded hover:bg-gray-50 flex flex-col items-center justify-center text-center'>
          <span className='font-bold text-accent'>{e.label}</span>
          <span className='text-xs text-gray-500 mt-1'>{e.description}</span>
        </button>
      ))}
    </div>
  );
}
