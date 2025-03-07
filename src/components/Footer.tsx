import React from 'react';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#091428]/90 backdrop-blur-md border-t border-[#785A28] text-[#C8AA6E] p-4 mt-16">
      <div className="container mx-auto text-center text-sm">
        <p>{t('app.disclaimer')}</p>
        <p className="mt-2 text-[#F0E6D2]/60">{t('app.poweredBy')}</p>
      </div>
    </footer>
  );
}