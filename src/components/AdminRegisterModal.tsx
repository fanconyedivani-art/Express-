import React, { useState } from 'react';
import { User } from '../types/index.ts';
import { EkumbiLogo } from './EkumbiLogo.tsx';
import {
  X,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface AdminRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AdminRegisterModal: React.FC<AdminRegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<'code' | 'form'>('code');
  const [accessCode, setAccessCode] = useState('');
  const [showCode, setShowCode] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+244 9');
  const [biNumber, setBiNumber] = useState('');
  const [province, setProvince] = useState('Luanda');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const angolaProvinces = [
    'Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando Cubango', 'Cuanza Norte',
    'Cuanza Sul', 'Cunene', 'Huambo', 'Huíla', 'Luanda', 'Lunda Norte',
    'Lunda Sul', 'Malanje', 'Moxico', 'Namibe', 'Uíge', 'Zaire'
  ];

  const resetAndClose = () => {
    setStep('code');
    setAccessCode('');
    setShowCode(false);
    setName('');
    setEmail('');
    setPhone('+244 9');
    setBiNumber('');
    setProvince('Luanda');
    setPassword('');
    setConfirmPassword('');
    setErrorMsg(null);
    onClose();
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/verify-admin-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode.trim() })
      });
      const data = await res.json();

      if (res.ok && data.valid) {
        setStep('form');
      } else {
        setErrorMsg(data.error || 'Código de autorização inválido. Acesso negado.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Falha de conexão ao validar o código de acesso.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('A palavra-passe e a confirmação não coincidem.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessCode: accessCode.trim(),
          name,
          email,
          phone,
          password,
          biNumber,
          province
        })
      });
      const data = await res.json();

      if (res.ok && data.user) {
        onSuccess(data.user);
        resetAndClose();
      } else {
        setErrorMsg(data.error || 'Erro ao cadastrar administrador.');
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
        <div className="p-6 bg-gradient-to-r from-neutral-950 via-neutral-900 to-red-900 text-white text-center relative">
          <button
            type="button"
            onClick={resetAndClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex justify-center mb-2">
            <EkumbiLogo size="md" light={true} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider mt-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Cadastro de Administrador
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'code' ? (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 leading-relaxed flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Área restrita à administração. Introduza o código oficial de autorização para desbloquear o cadastro de administrador.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Código de Autorização *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type={showCode ? 'text' : 'password'}
                    required
                    value={accessCode}
                    onChange={e => setAccessCode(e.target.value)}
                    placeholder="Introduza o código de acesso"
                    className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode(!showCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-neutral-950 hover:bg-black text-amber-400 font-extrabold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'A verificar código...' : 'VALIDAR CÓDIGO DE ACESSO'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterAdmin} className="space-y-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Código autorizado. Preencha os dados do administrador.</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nome completo do administrador"
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
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@ekumbi.ao"
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
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+244 9..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                    Nº do BI (Opcional)
                  </label>
                  <input
                    type="text"
                    value={biNumber}
                    onChange={e => setBiNumber(e.target.value)}
                    placeholder="008472918LA042"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                    Província
                  </label>
                  <select
                    value={province}
                    onChange={e => setProvince(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-neutral-300 bg-white"
                  >
                    {angolaProvinces.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
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
                    value={password}
                    onChange={e => setPassword(e.target.value)}
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
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? 'A registar administrador...' : 'CADASTRAR ADMINISTRADOR'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
