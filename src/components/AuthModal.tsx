import React, { useState } from 'react';
import { User } from '../types/index.ts';
import { EkumbiLogo } from './EkumbiLogo.tsx';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  MapPin,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('+244 9');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regBi, setRegBi] = useState('');
  const [regProvince, setRegProvince] = useState('Luanda');
  const [regMunicipality, setRegMunicipality] = useState('Luanda');
  const [regLocality, setRegLocality] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const angolaProvinces = [
    'Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando Cubango', 'Cuanza Norte',
    'Cuanza Sul', 'Cunene', 'Huambo', 'Huíla', 'Luanda', 'Lunda Norte',
    'Lunda Sul', 'Malanje', 'Moxico', 'Namibe', 'Uíge', 'Zaire'
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: loginPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess(data.user);
        onClose();
      } else {
        setErrorMsg(data.error || 'Credenciais inválidas.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Falha de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('A palavra-passe e a confirmação não coincidem.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          biNumber: regBi,
          province: regProvince,
          municipality: regMunicipality,
          locality: regLocality
        })
      });

      const data = await res.json();
      if (res.ok) {
        const registeredEmail = data.email || regEmail;
        setRegName('');
        setRegEmail('');
        setRegPhone('+244 9');
        setRegPassword('');
        setRegConfirmPassword('');
        setRegBi('');
        setRegLocality('');
        setLoginIdentifier(registeredEmail);
        setLoginPassword('');
        setMode('login');
        setSuccessMsg(
          data.message || 'Cadastro concluído com sucesso! Faça o login com a sua palavra-passe para aceder à sua conta.'
        );
      } else {
        setErrorMsg(data.error || 'Erro ao criar conta.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Falha de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 my-8">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-red-700 via-red-800 to-black text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex justify-center mb-2">
            <EkumbiLogo size="md" light={true} />
          </div>

          <div className="flex items-center justify-center gap-2 mt-4 bg-black/30 p-1 rounded-xl max-w-xs mx-auto">
            <button
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'login' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-300 hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'register' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-300 hover:text-white'
              }`}
            >
              Cadastrar-se
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  E-mail ou Número de Telefone *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    placeholder="exemplo@gmail.com ou +244 9..."
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-neutral-700">
                    Palavra-passe *
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Para redefinir a palavra-passe, contacte o suporte oficial pelo WhatsApp: +244 922 050 257.')}
                    className="text-[11px] text-red-600 hover:underline"
                  >
                    Esqueceu-se da palavra-passe?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'A verificar credenciais...' : 'ENTRAR NA CONTA'}
              </button>

              <div className="pt-2 text-center text-xs text-neutral-500">
                <span>Não possui conta? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="font-bold text-red-600 hover:underline"
                >
                  Criar conta individual
                </button>
              </div>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="Nome conforme Bilhete de Identidade"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="email@exemplo.ao"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                    Telefone *
                  </label>
                  <input
                    type="text"
                    required
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="+244 9..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                    Palavra-passe *
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                    Confirmar Palavra-passe *
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-100">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                    Nº do BI (Opcional agora)
                  </label>
                  <input
                    type="text"
                    value={regBi}
                    onChange={e => setRegBi(e.target.value)}
                    placeholder="008472918LA042"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                    Província
                  </label>
                  <select
                    value={regProvince}
                    onChange={e => setRegProvince(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-neutral-300 bg-white"
                  >
                    {angolaProvinces.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? 'A criar conta...' : 'CONCLUIR CADASTRO'}
              </button>

              <div className="text-center text-xs text-neutral-500 pt-1">
                <span>Já possui conta? </span>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-red-600 hover:underline"
                >
                  Entrar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
