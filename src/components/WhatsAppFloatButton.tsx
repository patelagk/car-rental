import { MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl } from '../utils/whatsapp.ts';

interface WhatsAppFloatButtonProps {
  whatsappNumber?: string;
}

export function WhatsAppFloatButton({ whatsappNumber }: WhatsAppFloatButtonProps) {
  const href = buildWhatsAppUrl(
    'Hello Bhopal Wheel Self Drive, I want to check self-drive car availability in Bhopal.',
    whatsappNumber,
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Inquire on WhatsApp with Bhopal Wheel Self Drive"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 h-11 px-4 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-lg transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
    >
      <MessageCircle className="w-4 h-4 shrink-0" />
      <span className="whitespace-nowrap">WhatsApp</span>
    </a>
  );
}
