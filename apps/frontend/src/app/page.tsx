export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '2rem', margin: 0 }}>Casino (testnet)</h1>
      <p style={{ opacity: 0.7, margin: 0 }}>
        Block B skeleton — wallet connect, lobby and Dice arrive in later blocks.
      </p>
    </main>
  );
}
