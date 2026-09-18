import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { ADMIN_CREDENTIALS } from '../../data';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      localStorage.setItem('ns_admin', '1');
      navigate('/admin/dashboard');
    } else {
      setError('Credenciales incorrectas. Verifica email y contraseña.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="font-serif text-3xl text-[#f0ebe4] mb-1">Nails <span className="text-[#c9a96e]">Studio</span></p>
          <p className="text-[#8a7d6e] text-sm">Panel de administración</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-[#181310] border border-[#2e2518] rounded-xl p-8 space-y-5">
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono mb-2 block">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
              className="w-full bg-[#2a2018] border border-[#2e2518] rounded px-3 py-2.5 text-sm text-[#f0ebe4] outline-none focus:border-[#c9a96e]" />
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono mb-2 block">Contraseña</label>
            <div className="relative">
              <input value={password} onChange={e => setPassword(e.target.value)} type={showPw ? 'text' : 'password'} required
                className="w-full bg-[#2a2018] border border-[#2e2518] rounded px-3 py-2.5 pr-10 text-sm text-[#f0ebe4] outline-none focus:border-[#c9a96e]" />
              <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a7d6e] hover:text-[#f0ebe4]">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          {error && (
            <div className="p-3 bg-[#d4613a]/10 border border-[#d4613a]/30 rounded text-[#d4613a] text-xs">
              {error}
            </div>
          )}
          <button type="submit" className="w-full py-3 bg-[#c9a96e] text-[#0d0b0a] font-medium rounded hover:bg-[#d4b87e] transition-colors">
            Ingresar
          </button>
        </form>
        <p className="text-center text-[#8a7d6e] text-xs mt-6">Demo: admin@nailsstudio.com / admin2026</p>
      </div>
    </div>
  );
}
