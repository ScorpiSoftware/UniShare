export const runtime = 'edge';

export const alt = 'UniShare User Profile';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: { username: string } }) {
  const username = params.username;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                 (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://unishare.app');

  // Redirect to the profile-specific OG image API
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${baseUrl}/api/og/profile?username=${username}`,
    },
  });
}
