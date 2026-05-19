import React from 'react';
import { QRCode } from 'react-qr-code';

const CertificateSVG = ({
  candidateName = 'YOUR NAME HERE',
  domain = 'Web Development',
  duration = 'April 16 2026 to June 01 2026',
  certificateCode = 'CGSC001',
  type = 'Internship', // 'Internship' or 'Training'
  qrUrl = '',
  id = 'certificate-svg'
}) => {
  // Split duration if it contains "to" or " - " to render on two lines if needed, matching the template
  let durationStart = duration;
  let durationEnd = '';
  
  const toIndex = duration.toLowerCase().indexOf(' to ');
  const dashIndex = duration.indexOf(' - ');
  
  if (toIndex !== -1) {
    durationStart = duration.substring(0, toIndex).trim();
    durationEnd = duration.substring(toIndex + 4).trim();
  } else if (dashIndex !== -1) {
    durationStart = duration.substring(0, dashIndex).trim();
    durationEnd = duration.substring(dashIndex + 3).trim();
  }

  // Choose the background template image
  const bgImage = type === 'Internship' ? '/internship_template.png' : '/training_template.png';

  return (
    <svg
      id={id}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1000 707"
      width="100%"
      height="100%"
      style={{
        background: '#ffffff',
        fontFamily: "'Outfit', 'Inter', sans-serif",
        userSelect: 'none',
        display: 'block',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        borderRadius: '8px'
      }}
    >
      <defs>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap');
          
          .cert-code {
            font-family: 'Outfit', sans-serif;
            font-weight: 700;
            fill: #ffffff;
            letter-spacing: 1px;
          }
          .candidate-name {
            font-family: 'Outfit', sans-serif;
            font-weight: 900;
            font-style: italic;
            fill: #0c1e5a;
          }
          .body-text {
            font-family: 'Inter', sans-serif;
            fill: #334155;
            line-height: 1.6;
          }
          .bold-highlight {
            font-weight: 700;
            fill: #0a227e;
          }
        `}</style>
      </defs>

      {/* Render the exact certificate template image as the background */}
      <image href={bgImage} x="0" y="0" width="1000" height="707" preserveAspectRatio="none" />

      {/* 1. Cover the old template Code at bottom left and draw the dynamic Certificate Code */}
      {/* The wave color is very dark blue. #081854 closely matches the template corner. */}
      <rect x="30" y="625" width="180" height="80" fill="#001e88ff" />
      <text x="45" y="655" className="cert-code" fontSize="22">{certificateCode}</text>

      {/* 2. Cover the old candidate name placeholder "YOUR NAME HERE" */}
      {/* Use pure white to match the bright spots of the background */}
      <rect x="360" y="230" width="580" height="75" fill="#ffffff" />
      
      {/* Draw the dynamic Candidate Name exactly where the template had it */}
      <text x="650" y="285" textAnchor="middle" className="candidate-name" fontSize="46" letterSpacing="1">
        {candidateName.toUpperCase()}
      </text>

      {/* 3. Cover the old body paragraph placeholder */}
      {/* Shifted X to 310 to perfectly cover the 'I' in Internship while clearing the wave */}
      <rect x="310" y="310" width="670" height="130" fill="#ffffff" />

      {/* Draw the dynamic Body Paragraph perfectly mapped to template baselines */}
      <g className="body-text" fontSize="17.5" textAnchor="middle">
        {/* Line 1 */}
        <text x="650" y="338">
          for successfully completing the <tspan className="bold-highlight">{domain}</tspan>
        </text>
        
        {/* Line 2 */}
        {durationEnd ? (
          <>
            <text x="650" y="370">
              {type} at <tspan className="bold-highlight">Carrezza Global Solutions</tspan> from <tspan className="bold-highlight">{durationStart}</tspan>
            </text>
            <text x="650" y="402">
              to <tspan className="bold-highlight">{durationEnd}</tspan>.
            </text>
          </>
        ) : (
          <text x="650" y="370">
            {type} at <tspan className="bold-highlight">Carrezza Global Solutions</tspan> during <tspan className="bold-highlight">{duration}</tspan>.
          </text>
        )}
      </g>

      {/* 4. Cover the old placeholder QR Code and draw the new dynamic QR Code */}
      {/* Expanded mask to catch the right edge peeking out */}
      <rect x="780" y="430" width="180" height="180" fill="#ffffff" />
      {qrUrl && (
        <g transform="translate(800, 450)">
          <svg width="140" height="140">
            <QRCode value={qrUrl} size={140} level="M" />
          </svg>
        </g>
      )}
    </svg>
  );
};

export default CertificateSVG;
