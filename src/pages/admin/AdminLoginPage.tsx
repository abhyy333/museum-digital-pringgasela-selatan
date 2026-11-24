import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { WovenGridLogo } from '../../components/common/DecorativeIcons';

export const AdminLoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-[#0B1623] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-[#F2E9DC]">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="text-center space-y-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#8D9CAE] hover:text-terracotta transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Website Museum</span>
          </Link>
          
          <div className="flex justify-center mb-1">
            <WovenGridLogo className="w-10 h-10 text-terracotta" />
          </div>

          <h2 className="font-serif text-3xl font-bold tracking-tight text-[#F8F5EF]">
            Portal Kurasi Budaya
          </h2>
          <p className="text-xs sm:text-sm text-[#E8DCC9]/75">
            Masuk dengan kredensial Appwrite untuk mengelola arsip tenun, tradisi, dan sejarah Desa Pringgasela Selatan.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#0E1A27] py-8 px-6 sm:px-10 rounded-lg border border-[#1E3246] shadow-xl space-y-6">
          
          {error && (
            <div className="p-3.5 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#E8DCC9]/90 uppercase tracking-wider mb-1.5">
                Alamat Email Kedinasan
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8D9CAE] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pringgasela.desa.id"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#1E3246] bg-[#0B1623] focus:border-terracotta focus:outline-hidden text-sm text-[#F8F5EF] placeholder-[#8D9CAE] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#E8DCC9]/90 uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8D9CAE] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#1E3246] bg-[#0B1623] focus:border-terracotta focus:outline-hidden text-sm text-[#F8F5EF] placeholder-[#8D9CAE] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-lg bg-terracotta hover:bg-terracotta-hover text-[#F8F5EF] font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Memverifikasi Sesi...' : 'Masuk ke Panel Kurasi'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick-fill seed credentials helper */}
          <div className="pt-4 border-t border-[#1E3246]/60 space-y-3">
            <span className="text-[11px] font-semibold text-[#8D9CAE] uppercase tracking-wider block">
              Pintas Akun Uji Coba:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('superadmin@pringgasela.desa.id', 'Pringgasela2026!')}
                className="p-2 rounded-md bg-[#132334] hover:bg-[#1E3246] border border-[#1E3246] text-center transition-colors cursor-pointer"
              >
                <span className="block text-[11px] font-bold text-[#F8F5EF]">Super Admin</span>
                <span className="block text-[10px] text-[#8D9CAE]">Kepala Desa</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admindesa@pringgasela.desa.id', 'DesaPringgasela2026!')}
                className="p-2 rounded-md bg-[#132334] hover:bg-[#1E3246] border border-[#1E3246] text-center transition-colors cursor-pointer"
              >
                <span className="block text-[11px] font-bold text-[#F8F5EF]">Admin Desa</span>
                <span className="block text-[10px] text-[#8D9CAE]">Aparatur</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('kkn@pringgasela.desa.id', 'KKNPringgasela2026!')}
                className="p-2 rounded-md bg-[#132334] hover:bg-[#1E3246] border border-[#1E3246] text-center transition-colors cursor-pointer"
              >
                <span className="block text-[11px] font-bold text-[#F8F5EF]">Admin KKN</span>
                <span className="block text-[10px] text-[#8D9CAE]">Mahasiswa</span>
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
