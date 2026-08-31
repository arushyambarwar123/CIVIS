export default function PageHeader({ title, subtitle, actions }: any) {
  return (
    <div className='flex justify-between items-center mb-6'>
      <div>
        <h1 className='text-2xl font-bold text-primary'>{title}</h1>
        {subtitle && <p className='text-gray-500'>{subtitle}</p>}
      </div>
      <div>{actions}</div>
    </div>
  );
}
