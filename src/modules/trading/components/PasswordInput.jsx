import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export default function PasswordInput({ style, ...props }) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <input className="qlc-input" {...props} type={visible ? 'text' : 'password'} style={{ paddingRight: 76, ...style }} />
      <button
        type="button"
        aria-pressed={visible}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setVisible((v) => !v)}
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          padding: 4,
          cursor: 'pointer',
          color: 'var(--qlc-muted)',
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {visible ? t('auth.hidePassword') : t('auth.showPassword')}
      </button>
    </div>
  );
}
