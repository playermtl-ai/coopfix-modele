export function Illustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 320"
      fill="none"
      className={className}
      role="img"
      aria-label="Résidents devant leur coopérative d'habitation"
    >
      {/* soleil */}
      <circle cx="360" cy="54" r="24" fill="#FBE8A6" />
      {/* nuage */}
      <g fill="#FDF3DC">
        <ellipse cx="66" cy="58" rx="30" ry="12" />
        <ellipse cx="88" cy="50" rx="20" ry="10" />
      </g>
      {/* sol */}
      <ellipse cx="210" cy="286" rx="178" ry="18" fill="#F3E9CF" />
      {/* immeuble */}
      <rect x="118" y="104" width="154" height="178" rx="12" fill="#9B1B30" />
      <rect x="104" y="90" width="182" height="22" rx="9" fill="#7E1533" />
      {/* fenêtres */}
      {[138, 182, 226].map((x) =>
        [126, 162, 198].map((y) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="26" height="24" rx="5" fill="#FBE8A6" />
        ))
      )}
      {/* porte */}
      <rect x="180" y="228" width="30" height="54" rx="7" fill="#FBE8A6" />
      <circle cx="204" cy="256" r="2.2" fill="#9B1B30" />
      {/* arbre */}
      <rect x="303" y="240" width="10" height="38" rx="4" fill="#8A5A3B" />
      <circle cx="308" cy="222" r="24" fill="#9CB89B" />
      <circle cx="296" cy="234" r="14" fill="#AFC6AD" />
      {/* arbuste gauche */}
      <circle cx="98" cy="268" r="14" fill="#9CB89B" />
      <circle cx="112" cy="272" r="10" fill="#AFC6AD" />
      {/* résidente avec boîte à outils */}
      <circle cx="266" cy="240" r="10" fill="#F2C9A0" />
      <rect x="255" y="251" width="22" height="26" rx="9" fill="#C4536B" />
      <rect x="250" y="277" width="32" height="13" rx="4" fill="#8A5A3B" />
      <rect x="258" y="271" width="16" height="5" rx="2.5" fill="#8A5A3B" />
    </svg>
  );
}
