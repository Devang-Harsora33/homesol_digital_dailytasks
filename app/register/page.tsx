"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WaveBackground } from "@/components/WaveBackground";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Initialize the user's document in Firestore with empty "done" state
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: new Date(),
        doneTasks: {}, // Object mapping dayIndex -> array of task indices e.g., { "0": [1, 2] }
      });

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to register");
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <WaveBackground />
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '30px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="/logo.png" alt="Homesol Digital" style={{ height: '48px', objectFit: 'contain', margin: '0 auto 12px auto' }} />
          <div className="header-title" style={{ fontSize: '18px' }}>Get Started</div>
          <div className="header-sub">Create your digital tasks account</div>
        </div>

        {error && (
          <div className="badge b-red" style={{ display: 'block', marginBottom: '16px', padding: '10px', fontSize: '12px', whiteSpace: 'normal' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
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
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px', padding: '10px' }}>
            Create Account
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px' }}>
          <span style={{ color: 'var(--muted)' }}>Already have an account? </span>
          <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '500' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
