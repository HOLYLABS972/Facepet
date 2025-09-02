import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import LocaleSwitcher from '@/components/LocaleSwitcher';

const Footer = () => {
  const t = useTranslations('components.Footer');

  return (
    <footer className="mt-auto border-t">
      <div className="py-8">
        <div className="flex flex-col items-center gap-6">
          {/* Links */}
          <div className="flex gap-6 text-sm">
            <Link href="/terms" className="hover:text-primary transition-colors">
              {t('termsOfService')}
            </Link>
            <Link href="/contact" className="hover:text-primary transition-colors">
              {t('contact')}
            </Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">
              {t('privacyPolicy')}
            </Link>
          </div>

          {/* Love Message */}
          <div className="flex items-center gap-2 text-sm">
            <span className="opacity-90">{t('madeWithLove')}</span>
            <Heart className="text-primary m-1 h-4 w-4" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
