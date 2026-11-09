import { useEffect, useState } from 'react';

const LEAVE_MS = 460;

export function SectionStage({ activeKey, render }) {
  const [layers, setLayers] = useState([{ key: activeKey, state: 'enter' }]);

  useEffect(() => {
    setLayers((prev) => {
      if (prev[prev.length - 1]?.key === activeKey) return prev;
      return [...prev.filter((l) => l.key !== activeKey).map((l) => ({ ...l, state: 'leave' })), { key: activeKey, state: 'enter' }];
    });
    const timer = setTimeout(() => setLayers((prev) => prev.filter((l) => l.state !== 'leave')), LEAVE_MS);
    return () => clearTimeout(timer);
  }, [activeKey]);

  return (
    <div className="stage">
      {layers.map((layer) => (
        <section
          key={layer.key}
          className={`stage-layer is-${layer.state}`}
          aria-hidden={layer.state === 'leave'}
          inert={layer.state === 'leave' ? '' : undefined}
        >
          {render(layer.key)}
        </section>
      ))}
    </div>
  );
}
