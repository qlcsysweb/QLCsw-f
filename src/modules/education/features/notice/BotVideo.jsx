import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Video del QLC Quantitative Trading Bot que se muestra al iniciar sesión, antes del aviso.
// Es un video de YouTube, pero se presenta como propio: sin controles ni marca de YouTube (se recortan
// las franjas del título y el logo, y una capa evita que al tocarlo se abra YouTube), con botones propios.
// Los navegadores solo permiten reproducir automáticamente sin sonido: por eso empieza silenciado.
const COPY = {
  es: { title: 'QLC Quantitative Trading Bot', sound: '🔊 Activar sonido', mute: '🔇 Silenciar', pause: 'Pausar', play: 'Reproducir', next: 'Continuar', close: 'Cerrar' },
  en: { title: 'QLC Quantitative Trading Bot', sound: '🔊 Turn sound on', mute: '🔇 Mute', pause: 'Pause', play: 'Play', next: 'Continue', close: 'Close' },
};

// Español → video en español; cualquier otro idioma → inglés (idioma universal). Si falta uno, se usa el otro.
export function pickVideo(video, lang) {
  if (!video) return null;
  const preferred = lang === 'es' ? video.es : video.en;
  return preferred || video.en || video.es || null;
}

export function BotVideo({ videoId, lang, onDone }) {
  const c = COPY[lang === 'es' ? 'es' : 'en'];
  const frame = useRef(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);

  const command = (func, args = []) => {
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
  };

  // Escucha al reproductor para saber cuándo termina el video y pasar al aviso.
  useEffect(() => {
    const onMessage = (e) => {
      if (!/^https:\/\/(www\.)?youtube(-nocookie)?\.com$/.test(String(e.origin))) return;
      let data;
      try {
        data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      const state = data?.event === 'onStateChange' ? data.info : data?.info?.playerState;
      if (state === 0) onDone();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onDone]);

  const startListening = () => {
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'qlc-bot-video' }), '*');
  };

  const toggleSound = () => {
    if (muted) {
      command('unMute');
      command('setVolume', [100]);
    } else command('mute');
    setMuted(!muted);
  };

  const togglePlay = () => {
    command(paused ? 'playVideo' : 'pauseVideo');
    setPaused(!paused);
  };

  const params = new URLSearchParams({
    autoplay: '1', mute: '1', controls: '0', rel: '0', playsinline: '1', modestbranding: '1',
    iv_load_policy: '3', disablekb: '1', fs: '0', cc_load_policy: '0', enablejsapi: '1', origin: window.location.origin,
  });

  return createPortal(
    <div className="bot-video-backdrop" role="dialog" aria-modal="true" aria-label={c.title}>
      <div className="bot-video">
        <div className="bot-video-head">
          <b>{c.title}</b>
          <button type="button" className="bot-video-x" onClick={onDone} aria-label={c.close}>×</button>
        </div>
        <div className="bot-video-frame">
          <iframe
            ref={frame}
            title={c.title}
            src={`https://www.youtube-nocookie.com/embed/${videoId}?${params}`}
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={startListening}
          />
          <div className="bot-video-shield" onClick={togglePlay} aria-hidden="true" />
          {muted && <button type="button" className="bot-video-sound" onClick={toggleSound}>{c.sound}</button>}
        </div>
        <div className="bot-video-actions">
          <button type="button" className="btn-secondary" onClick={togglePlay}>{paused ? c.play : c.pause}</button>
          {!muted && <button type="button" className="btn-secondary" onClick={toggleSound}>{c.mute}</button>}
          <button type="button" className="btn-primary" onClick={onDone}>{c.next}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
