export function AnimatedHeading({ as: Tag = 'h1', text, highlight, className = '', delay = 0 }) {
  const words = text.split(' ').filter(Boolean);
  const accent = highlight ? highlight.split(' ').filter(Boolean) : [];
  const full = [text, highlight].filter(Boolean).join(' ');
  return (
    <Tag className={`anim-heading ${className}`} aria-label={full}>
      {[...words.map((w) => [w, false]), ...accent.map((w) => [w, true])].map(([word, isAccent], i) => (
        <span key={`${word}-${i}`} className={`anim-word ${isAccent ? 'accent' : ''}`} aria-hidden="true" style={{ '--i': i, '--d': `${delay}ms` }}>
          {word}
        </span>
      ))}
    </Tag>
  );
}
