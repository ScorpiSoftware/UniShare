import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Get the base URL from the request
    const { origin } = new URL(request.url);

    // Get the page title from the query parameters
    const pageTitle = request.nextUrl.searchParams.get('title') || '';

    // Dynamic image generation as fallback
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            color: 'white',
            background: 'linear-gradient(to right, #000000, #333333)',
            width: '100%',
            height: '100%',
            padding: '50px',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 40,
            }}
          >
            {/* Use the logo from the og-assets folder that's excluded from middleware */}
            <img
              src={`${origin}/og-assets/logo.png`}
              width="80"
              height="80"
              alt="UniShare Logo"
              style={{ objectFit: 'contain' }}
            />
            <span style={{ marginLeft: 20, fontSize: 80, fontWeight: 'bold' }}>UniShare</span>
          </div>

          {pageTitle ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: '800px',
                marginBottom: 60,
              }}
            >
              <div
                style={{
                  width: '180px',
                  height: '2px',
                  background: 'rgba(255, 255, 255, 0.6)',
                  borderRadius: '10px',
                  marginBottom: '25px',
                }}
              />
              <div
                style={{
                  fontSize: 46,
                  fontWeight: '500',
                  textAlign: 'center',
                  lineHeight: 1.3,
                  color: 'white',
                  padding: '0 20px',
                  letterSpacing: '0.5px',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                }}
              >
                {pageTitle}
              </div>
            </div>
          ) : null}

          {!pageTitle ? (
            <div
              style={{
                fontSize: 36,
                opacity: 0.8,
                textAlign: 'center',
                maxWidth: '800px',
                lineHeight: 1.4,
                marginTop: 20,
                marginBottom: 60,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span>
                An exclusive platform for university students to collaborate, share academic resources, and form study groups
              </span>
            </div>
          ) : null}

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '30px',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '20px 30px',
                borderRadius: '10px',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span style={{ marginTop: 10, fontSize: 24 }}>Resources</span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '20px 30px',
                borderRadius: '10px',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path
                  d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="9"
                  cy="7"
                  r="4"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M23 21v-2a4 4 0 0 0-3-3.87"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 3.13a4 4 0 0 1 0 7.75"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span style={{ marginTop: 10, fontSize: 24 }}>Study Groups</span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '20px 30px',
                borderRadius: '10px',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="16"
                  y1="8"
                  x2="2"
                  y2="22"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="17.5"
                  y1="15"
                  x2="9"
                  y2="15"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span style={{ marginTop: 10, fontSize: 24 }}>Collaboration</span>
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 50,
              right: 50,
              display: 'flex',
              justifyContent: 'center',
              fontSize: 24,
              opacity: 0.7,
            }}
          >
            unishare.app
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            fontSize: 60,
            color: 'black',
            background: 'white',
            width: '100%',
            height: '100%',
            padding: '50px 200px',
            textAlign: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
          }}
        >
          <h1 style={{ margin: 0 }}>UniShare</h1>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  }
}
