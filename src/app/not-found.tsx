// Global fallback for non-localized unmatched routes. Needs its own html shell
// because the localized root layout only wraps /[locale]/* paths.
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 0
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 48, margin: 0 }}>404</h1>
          <p>
            <a href="/en" style={{ color: '#4f46e5' }}>
              Go to botbrix →
            </a>
          </p>
        </div>
      </body>
    </html>
  );
}
