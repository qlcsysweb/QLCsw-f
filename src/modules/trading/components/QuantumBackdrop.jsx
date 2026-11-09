import './QuantumBackdrop.css';

const ORBITS = [
  { radius: 210, tilt: -24, speed: 'fast', dots: [0, 180] },
  { radius: 320, tilt: 18, speed: 'medium', dots: [60, 200, 300] },
  { radius: 450, tilt: -52, speed: 'slow', dots: [30, 150, 270] },
  { radius: 590, tilt: 42, speed: 'slower', dots: [100, 280] },
];

export default function QuantumBackdrop() {
  return (
    <div className="qlc-quantum" aria-hidden="true">
      <div className="qlc-quantum-floor" />
      <svg className="qlc-quantum-orbits" viewBox="-700 -700 1400 1400" preserveAspectRatio="xMidYMid slice">
        {ORBITS.map(({ radius, tilt, speed, dots }) => (
          <g key={radius} transform={`rotate(${tilt}) scale(1 0.42)`}>
            <circle className="qlc-quantum-ring" r={radius} vectorEffect="non-scaling-stroke" />
            <g className={`qlc-quantum-spin is-${speed}`}>
              {dots.map((angle, i) => (
                <circle
                  key={angle}
                  className={i % 2 ? 'qlc-quantum-dot is-gold' : 'qlc-quantum-dot'}
                  r={i % 2 ? 6 : 8}
                  cx={radius * Math.cos((angle * Math.PI) / 180)}
                  cy={radius * Math.sin((angle * Math.PI) / 180)}
                />
              ))}
            </g>
          </g>
        ))}
      </svg>
      <div className="qlc-quantum-wave" />
      <div className="qlc-quantum-wave is-late" />
      <div className="qlc-quantum-core" />
    </div>
  );
}
