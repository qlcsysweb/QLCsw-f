import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { NOTICE_FLAG, NOTICE_TEXT } from './noticeContent.js';

const pending = () => {
  try {
    return sessionStorage.getItem(NOTICE_FLAG) === '1';
  } catch {
    return false;
  }
};

const dismiss = () => {
  try {
    sessionStorage.removeItem(NOTICE_FLAG);
  } catch {
    return;
  }
};

export function NoticeBody({ notice, text }) {
  return (
    <div className="stack login-notice">
      <p>{text.intro(notice.metrics)}</p>
      <div className="notice-metrics">
        {text.metrics(notice.metrics).map(([label, value, sub]) => (
          <div key={label}><span>{label}</span><b>{value}</b><small>{sub}</small></div>
        ))}
      </div>
      <p>{text.evaluate}</p>
      <p>{text.live}</p>
      <p className="small muted">{text.disclaimer}</p>
    </div>
  );
}

export function LoginNotice() {
  const { lang } = useI18n();
  const [notice, setNotice] = useState(null);
  const text = NOTICE_TEXT[lang] || NOTICE_TEXT.es;

  useEffect(() => {
    if (!pending()) return;
    let alive = true;
    api.get('/public/notice')
      .then((data) => {
        if (!alive) return;
        if (data?.active) setNotice(data);
        else dismiss();
      })
      .catch(dismiss);
    return () => {
      alive = false;
    };
  }, []);

  const close = () => {
    dismiss();
    setNotice(null);
  };

  return (
    <Modal
      open={!!notice}
      wide
      title={text.title}
      onClose={close}
      footer={notice && (
        <>
          {notice.bitgetUrl && <a className="btn-secondary" href={notice.bitgetUrl} target="_blank" rel="noopener noreferrer">{text.bitget}</a>}
          {notice.infoUrl && <a className="btn-primary" href={notice.infoUrl} target="_blank" rel="noopener noreferrer">{text.info}</a>}
          <Button variant="secondary" onClick={close}>{text.close}</Button>
        </>
      )}
    >
      {notice && <NoticeBody notice={notice} text={text} />}
    </Modal>
  );
}
