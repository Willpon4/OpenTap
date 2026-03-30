import { Suspense } from 'react';
import ReportForm from '@/components/ReportForm';

export const metadata = {
  title: 'Report a Problem — OpenTap',
  description: 'Report a broken, unsafe, or missing water fountain in under 60 seconds.',
};

export default function ReportPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px 20px', textAlign: 'center', color: '#7c7b77' }}>Loading...</div>}>
      <ReportForm />
    </Suspense>
  );
}
