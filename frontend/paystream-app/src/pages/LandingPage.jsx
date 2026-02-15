import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, SignOutButton } from "@clerk/clerk-react";

export default function LandingPage() {
    const navigate = useNavigate();
    const { isSignedIn, user, isLoaded } = useUser();

    if (!isLoaded) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
    }

    return (
        <div className="app-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
            <header style={{ marginBottom: '3rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💸</div>
                <h1 style={{ fontSize: '3.5rem', fontWeight: '800', background: 'linear-gradient(135deg, #FFD700 0%, #FDB931 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    PayStream
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                    The decentralized payroll streaming protocol. Real-time earnings, instant withdrawals, and automated tax compliance.
                </p>
            </header>


            <div className="glass-card" style={{ padding: '2rem', maxWidth: '400px', width: '100%' }}>
                <h2 style={{ marginBottom: '0.5rem' }}>Select Portal</h2>
                {isSignedIn && <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Signed in as {user.primaryEmailAddress?.emailAddress}</p>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button
                        className="btn btn-primary"
                        style={{ padding: '1rem', fontSize: '1.1rem' }}
                        onClick={() => navigate(isSignedIn ? '/hr' : '/hr/sign-in')}
                    >
                        👔 HR Portal
                    </button>

                    <button
                        className="btn"
                        style={{ padding: '1rem', fontSize: '1.1rem', background: 'var(--surface)', border: '1px solid var(--border)' }}
                        onClick={() => navigate(isSignedIn ? '/employee' : '/employee/sign-in')}
                    >
                        👷 Employee Portal
                    </button>

                    {isSignedIn && (
                        <SignOutButton>
                            <button className="btn-cancel" style={{ marginTop: '1rem', width: '100%' }}>
                                Sign Out
                            </button>
                        </SignOutButton>
                    )}
                </div>
            </div>

            <footer style={{ marginTop: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                HeLa Testnet • Secure • Real-time
            </footer>
        </div>
    );
}
