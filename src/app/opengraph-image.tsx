import { ImageResponse } from 'next/og';

export const alt = 'Paisa Reality: Free Money Health Score and Smart Financial Tools for India';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Default social sharing card for the whole site (1200x630).
export default function OpengraphImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          backgroundColor: '#0c4a47',
          backgroundImage: 'linear-gradient(135deg, #0c4a47 0%, #007A78 100%)',
          padding: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 40,
            fontWeight: 700,
            color: '#a7f3d0',
            marginBottom: 24,
          }}
        >
          Paisa Reality
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 66,
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.1,
            maxWidth: 960,
          }}
        >
          Free Money Health Score and Smart Financial Tools
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 32,
            color: '#d1fae5',
            marginTop: 28,
            maxWidth: 900,
          }}
        >
          Retirement, debt, and tax planning for India. Plus live rates, schemes, and bank rate comparison.
        </div>
      </div>
    ),
    { ...size },
  );
}
