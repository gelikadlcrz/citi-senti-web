/**
 * Mountain-and-pine illustration used on the admin login brand panel.
 * Shapes are taken directly from the admin login design (admin_login.svg).
 */
const pines = [
  "M659.5 889L675.625 921H667.563L681 953H638L651.438 921H643.375L659.5 889Z",
  "M569 822L581 846H575L585 870H553L563 846H557L569 822Z",
  "M354 806L366 830H360L370 854H338L348 830H342L354 806Z",
  "M146 814L158 838H152L162 862H130L140 838H134L146 814Z",
  "M438.5 857L454.625 889H446.563L460 921H417L430.438 889H422.375L438.5 857Z",
  "M235.5 877L251.625 909H243.563L257 941H214L227.438 909H219.375L235.5 877Z",
  "M31.5 838L47.625 870H39.563L53 902H10L23.438 870H15.375L31.5 838Z",
];

export function PineLandscape({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 596 720 428"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M0.5 786L0 1024L719.5 1023.5V820L508.5 676L416.5 743L293 597L164.5 765L52 699.5L0.5 786Z"
        fill="#365C4C"
      />
      <path
        d="M0 882V1024L719.5 1023.5V865.5L602.5 801.5L496.5 882L325.5 754L206 865L107 812L0 882Z"
        fill="#14532D"
      />
      {pines.map((d) => (
        <path key={d} d={d} fill="#0E3B26" />
      ))}
    </svg>
  );
}
