'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminOrganizationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/super-admin/productores');
  }, [router]);

  return (
    <div className="p-8 text-sm text-slate-600">
      La gestion de organizaciones se movio al nivel Productor. Redirigiendo...
    </div>
  );
}
