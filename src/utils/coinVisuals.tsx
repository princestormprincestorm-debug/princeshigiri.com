import React from 'react';
import { CoinDatasetItem } from './coinModelLogic.ts';

interface CoinCanvasProps {
  denominationKey: '100_fcfa' | '250_fcfa' | '500_fcfa';
  side?: 'obverse' | 'reverse';
  angleDeg?: number;
  size?: number;
  showDetails?: boolean;
  className?: string;
  lighting?: 'natural' | 'studio' | 'overhead' | 'angled';
  wearLevel?: 'Mint' | 'Slight' | 'Circulated';
}

export const CoinSvg: React.FC<CoinCanvasProps> = ({
  denominationKey,
  side = 'obverse',
  angleDeg = 0,
  size = 120,
  showDetails = true,
  className = '',
  lighting = 'studio',
  wearLevel = 'Mint'
}) => {
  const is100 = denominationKey === '100_fcfa';
  const is250 = denominationKey === '250_fcfa';
  const is500 = denominationKey === '500_fcfa';

  // 100 FCFA: Gold outer ring, Silver inner core
  // 250 FCFA: Golden bronze outer ring, Silver inner core
  // 500 FCFA: Silver cupronickel outer ring, Golden bronze inner core (Inverted!)
  const outerGradientId = `outer-${denominationKey}-${side}-${angleDeg}`;
  const innerGradientId = `inner-${denominationKey}-${side}-${angleDeg}`;
  const textureFilterId = `wear-${denominationKey}-${wearLevel}`;

  // Palette settings
  const goldOuter = is100 || is250;
  const outerColors = goldOuter
    ? {
        start: '#E8C15A',
        mid: '#BF8C24',
        end: '#8C620D',
        highlight: '#FFF2C6',
      }
    : {
        start: '#E6E9EE',
        mid: '#B0B7C3',
        end: '#818894',
        highlight: '#FFFFFF',
      };

  const innerColors = goldOuter
    ? {
        start: '#EDF1F5',
        mid: '#BFC5D0',
        end: '#8D96A4',
        highlight: '#FFFFFF',
      }
    : {
        start: '#E8C15A',
        mid: '#BF8C24',
        end: '#8C620D',
        highlight: '#FFF2C6',
      };

  const lightingShift = lighting === 'overhead' ? '50%' : lighting === 'angled' ? '25%' : '40%';
  const wearOpacity = wearLevel === 'Circulated' ? 0.35 : wearLevel === 'Slight' ? 0.15 : 0.05;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={`inline-block select-none drop-shadow-md transition-transform duration-300 ${className}`}
      style={{ transform: `rotate(${angleDeg}deg)` }}
      aria-label={`${is100 ? '100' : is250 ? '250' : '500'} FCFA Central African CFA Franc coin (${side})`}
    >
      <defs>
        {/* Outer Ring Gradient */}
        <radialGradient id={outerGradientId} cx={lightingShift} cy={lightingShift} r="70%">
          <stop offset="0%" stopColor={outerColors.highlight} />
          <stop offset="45%" stopColor={outerColors.start} />
          <stop offset="85%" stopColor={outerColors.mid} />
          <stop offset="100%" stopColor={outerColors.end} />
        </radialGradient>

        {/* Inner Core Gradient */}
        <radialGradient id={innerGradientId} cx={lightingShift} cy={lightingShift} r="65%">
          <stop offset="0%" stopColor={innerColors.highlight} />
          <stop offset="50%" stopColor={innerColors.start} />
          <stop offset="85%" stopColor={innerColors.mid} />
          <stop offset="100%" stopColor={innerColors.end} />
        </radialGradient>

        {/* Subtle Coin Edge Milling Pattern */}
        <pattern id="milled-edge" width="6" height="6" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#554422" strokeWidth="1" opacity="0.3" />
        </pattern>
      </defs>

      {/* Rim Shadow & Outer Planchet */}
      <circle cx="100" cy="100" r="98" fill="#1e1e1e" opacity="0.35" />
      <circle cx="100" cy="100" r="96" fill={`url(#${outerGradientId})`} stroke="#634812" strokeWidth="1.5" />

      {/* Milled Outer Border */}
      <circle cx="100" cy="100" r="94" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeDasharray="2 3" />

      {/* Bimetallic Boundary Ring */}
      <circle cx="100" cy="100" r="66" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="65" fill={`url(#${innerGradientId})`} stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />

      {/* Wear & Patina Texture Overlay */}
      <circle cx="100" cy="100" r="96" fill="#695738" opacity={wearOpacity} />

      {/* Numismatic Artwork by Denomination and Side */}
      {showDetails && (
        <g textAnchor="middle" dominantBaseline="middle" className="font-sans">
          {side === 'obverse' ? (
            <>
              {/* Outer Ring Inscriptions */}
              <path
                id={`text-path-top-${outerGradientId}`}
                d="M 30,100 A 70,70 0 0,1 170,100"
                fill="none"
              />
              <path
                id={`text-path-bottom-${outerGradientId}`}
                d="M 170,100 A 70,70 0 0,1 30,100"
                fill="none"
              />
              <text fill={goldOuter ? '#4A3408' : '#2A303C'} fontSize="9" fontWeight="800" letterSpacing="2">
                <textPath href={`#text-path-top-${outerGradientId}`} startOffset="50%" textAnchor="middle">
                  {is500 ? 'CEMAC • UNION MONETAIRE' : 'BANQUE DES ÉTATS'}
                </textPath>
              </text>
              <text fill={goldOuter ? '#4A3408' : '#2A303C'} fontSize="8" fontWeight="700" letterSpacing="1.5">
                <textPath href={`#text-path-bottom-${outerGradientId}`} startOffset="50%" textAnchor="middle">
                  {is500 ? 'DE L’AFRIQUE CENTRALE' : 'DE L’AFRIQUE CENTRALE'}
                </textPath>
              </text>

              {/* Central Core Artwork */}
              <text
                x="100"
                y="88"
                fontSize={is100 ? '34' : is250 ? '30' : '32'}
                fontWeight="900"
                fill={goldOuter ? '#232A36' : '#4E3707'}
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="0.5"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {is100 ? '100' : is250 ? '250' : '500'}
              </text>
              <text
                x="100"
                y="118"
                fontSize="14"
                fontWeight="800"
                fill={goldOuter ? '#353F4E' : '#694E0C'}
                letterSpacing="2"
              >
                FCFA
              </text>

              {/* Decorative Wreath / Corn / Flora */}
              {is500 ? (
                <path
                  d="M 68,132 Q 100,146 132,132 M 85,124 Q 100,136 115,124"
                  stroke="#8B6914"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              ) : is100 ? (
                <path
                  d="M 72,134 C 85,142 115,142 128,134"
                  stroke="#5C6675"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M 75,133 L 100,140 L 125,133"
                  stroke="#5C6675"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                />
              )}
            </>
          ) : (
            <>
              {/* Reverse: BEAC Masks & Insignia */}
              <text fill={goldOuter ? '#4A3408' : '#2A303C'} fontSize="9" fontWeight="800" letterSpacing="1.8">
                <textPath href={`#text-path-top-${outerGradientId}`} startOffset="50%" textAnchor="middle">
                  BANQUE CENTRALE
                </textPath>
              </text>
              
              {/* Stylized Traditional BEAC Masks & Horn Emblem */}
              <circle cx="100" cy="85" r="24" fill="none" stroke={goldOuter ? '#3F4857' : '#6B4E0A'} strokeWidth="1.8" />
              <path
                d="M 88,85 Q 100,98 112,85 Q 100,72 88,85 Z"
                fill={goldOuter ? '#3F4857' : '#6B4E0A'}
                opacity="0.8"
              />
              <circle cx="94" cy="82" r="2" fill="#FFFFFF" />
              <circle cx="106" cy="82" r="2" fill="#FFFFFF" />

              <text
                x="100"
                y="126"
                fontSize="12"
                fontWeight="800"
                fill={goldOuter ? '#323B49' : '#574109'}
                letterSpacing="1"
              >
                2006
              </text>
            </>
          )}
        </g>
      )}
    </svg>
  );
};

/**
 * Converts a CoinDatasetItem or specification into an inline high-quality Base64 PNG
 * data URL using an offscreen HTML5 canvas, ensuring full compatibility with
 * both Gemini Vision API calls and browser image tags.
 */
export async function generateCoinDataUrl(
  denominationKey: '100_fcfa' | '250_fcfa' | '500_fcfa',
  side: 'obverse' | 'reverse' = 'obverse',
  angleDeg: number = 0,
  wearLevel: 'Mint' | 'Slight' | 'Circulated' = 'Mint'
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background neutral surface
  ctx.fillStyle = '#181A20';
  ctx.fillRect(0, 0, 400, 400);

  ctx.save();
  ctx.translate(200, 200);
  ctx.rotate((angleDeg * Math.PI) / 180);

  const is100 = denominationKey === '100_fcfa';
  const is250 = denominationKey === '250_fcfa';
  const is500 = denominationKey === '500_fcfa';
  const goldOuter = is100 || is250;

  // Outer ring
  const outerGrad = ctx.createRadialGradient(-40, -40, 20, 0, 0, 180);
  if (goldOuter) {
    outerGrad.addColorStop(0, '#FFE89E');
    outerGrad.addColorStop(0.5, '#C99726');
    outerGrad.addColorStop(1, '#7A5408');
  } else {
    outerGrad.addColorStop(0, '#FFFFFF');
    outerGrad.addColorStop(0.5, '#BDC4CF');
    outerGrad.addColorStop(1, '#788190');
  }
  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 180, 0, Math.PI * 2);
  ctx.fill();

  // Outer rim stroke
  ctx.strokeStyle = goldOuter ? '#593D06' : '#535965';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Inner core
  const innerGrad = ctx.createRadialGradient(-30, -30, 15, 0, 0, 120);
  if (goldOuter) {
    innerGrad.addColorStop(0, '#FFFFFF');
    innerGrad.addColorStop(0.5, '#CAD0DC');
    innerGrad.addColorStop(1, '#818B9C');
  } else {
    innerGrad.addColorStop(0, '#FFE89E');
    innerGrad.addColorStop(0.5, '#C99726');
    innerGrad.addColorStop(1, '#7A5408');
  }
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 120, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Typography
  ctx.fillStyle = goldOuter ? '#232935' : '#473307';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (side === 'obverse') {
    ctx.font = 'bold 64px Georgia, serif';
    ctx.fillText(is100 ? '100' : is250 ? '250' : '500', 0, -18);

    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('FCFA', 0, 42);

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = goldOuter ? '#4C3507' : '#2F3643';
    ctx.fillText(is500 ? 'CEMAC • BEAC' : 'AFRIQUE CENTRALE', 0, -145);
    ctx.fillText('BANQUE DES ÉTATS', 0, 145);
  } else {
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('BANQUE CENTRALE', 0, -145);
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText('BEAC', 0, -10);
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('2006', 0, 48);
    ctx.fillText('CEMAC', 0, 145);
  }

  ctx.restore();
  return canvas.toDataURL('image/jpeg', 0.92);
}
