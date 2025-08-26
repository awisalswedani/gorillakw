import { WEB_CONSTANTS } from '../app/web_constantsthe';

export default function ContactInfoBlock({ 
  className = '', 
  onlySocial = false, 
  textColor = '#222' 
}: { 
  className?: string, 
  onlySocial?: boolean,
  textColor?: string 
}) {
  return (
    <div className={`flex flex-col items-center ${onlySocial ? '' : 'space-y-1'} ${className}`}>
      {!onlySocial && (
        <>
          <span className="text-lg font-semibold" style={{ color: textColor }} dir="ltr">{WEB_CONSTANTS.phone}</span>
          <span className="text-base" style={{ color: textColor }} dir="ltr">{WEB_CONSTANTS.email}</span>
        </>
      )}
      <div className={`flex ${onlySocial ? 'justify-center gap-8 py-6' : 'space-x-6 mt-2'}`}>
        <a href={WEB_CONSTANTS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:opacity-80 transition-opacity">
          <img src="/Instagram_icon.png" alt="Instagram" className="w-7 h-7" />
        </a>
        <a href={WEB_CONSTANTS.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="hover:opacity-80 transition-opacity">
          <img src="/whatsapp-icon.png" alt="WhatsApp" className="w-7 h-7" />
        </a>
      </div>
    </div>
  );
} 