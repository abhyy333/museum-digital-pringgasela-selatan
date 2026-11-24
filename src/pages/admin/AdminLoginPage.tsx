import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect to admin
  React.useEffect(() => {
    if (user) {
      navigate('/admin');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Mohon isi email dan kata sandi.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa kembali email dan password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
  };

  return (
    <div className="min-h-screen bg-sand-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-primary transition-colors mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Website Museum</span>
          </Link>
          
          <div className="w-12 h-12 rounded-2xl bg-primary text-surface flex items-center justify-center mx-auto shadow-sm">
            <Shield className="w-6 h-6" />
          </div>

          <h2 className="font-serif text-3xl font-bold tracking-tight text-text">
            Portal Pengelola Budaya
          </h2>
          <p className="text-xs text-muted">
            Museum Digital Pringgasela Selatan — Akses Terotentikasi Appwrite
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-surface py-8 px-6 sm:px-10 rounded-2xl border border-border shadow-md space-y-6">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Alamat Surel (Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pringgasela.desa.id"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-border bg-sand-50 focus:bg-surface focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-border bg-sand-50 focus:bg-surface focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-surface text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Mengotentikasi...' : 'Masuk ke Panel Kurator'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick-Fill Presets for Seed Administrators */}
          <div className="pt-4 border-t border-border/80 space-y-2">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
              Akun Demonstrasi / Presets:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('superadmin@pringgasela.desa.id', 'Pringgasela2026!Admin')}
                className="py-1.5 px-2 rounded-lg bg-sand-100 hover:bg-sand-200 border border-border/60 text-[11px] font-medium text-text text-center transition-colors"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admindesa@pringgasela.desa.id', 'Pringgasela2026!Sec')}
                className="py-1.5 px-2 rounded-lg bg-sand-100 hover:bg-sand-200 border border-border/60 text-[11px] font-medium text-text text-center transition-colors"
              >
                Admin Desa
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('kkn@pringgasela.desa.id', 'Pringgasela2026!Sec')}
                className="py-1.5 px-2 rounded-lg bg-sand-100 hover:bg-sand-200 border border-border/60 text-[11px] font-medium text-text text-center transition-colors"
              >
                Admin KKN
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
