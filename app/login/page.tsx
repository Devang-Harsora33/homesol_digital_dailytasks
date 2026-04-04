"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WaveBackground } from "@/components/WaveBackground";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to login");
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <WaveBackground />
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '30px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="/logo.png" alt="Homesol Digital" style={{ height: '48px', objectFit: 'contain', margin: '0 auto 12px auto' }} />
          <div className="header-title" style={{ fontSize: '18px' }}>Homesol Digital</div>
          <div className="header-sub">Sign in to your digital tasks dashboard</div>
        </div>

        {error && (
          <div className="badge b-red" style={{ display: 'block', marginBottom: '16px', padding: '10px', fontSize: '12px', whiteSpace: 'normal' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px', padding: '10px' }}>
            Sign In
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px' }}>
          <span style={{ color: 'var(--muted)' }}>Don't have an account? </span>
          <Link href="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '500' }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
