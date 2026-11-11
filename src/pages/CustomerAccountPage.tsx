import React, { useState, useEffect } from 'react';
import { User, Booking, Ticket, SystemNotification } from '../types/index.ts';
import {
  User as UserIcon,
  Ticket as TicketIcon,
  Train,
  CreditCard,
  Bell,
  MapPin,
  Calendar,
  Clock,
  Download,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Compass,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  Eye,
  Radio
} from 'lucide-react';

interface CustomerAccountPageProps {
  currentUser: User;
  onUpdateUser: (updated: User) => void;
  onViewTicket: (ticket: Ticket) => void;
  onContinuePayment: (booking: Booking) => void;
  initialTab?: string;
}

export const CustomerAccountPage: React.FC<CustomerAccountPageProps> = ({
  currentUser,
  onUpdateUser,
  onViewTicket,
  onContinuePayment,
  initialTab = 'viagens'
}) => {
  const [activeTab, setActiveTab] = useState<'perfil' | 'viagens' | 'bilhetes' | 'pagamentos' | 'notificacoes'>(
    (initialTab as any) || 'viagens'
  );

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile edit states
  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [biNumber, setBiNumber] = useState(currentUser.biNumber || '');
  const [birthDate, setBirthDate] = useState(currentUser.birthDate || '');
  const [gender, setGender] = useState<'M' | 'F' | 'Outro'>(currentUser.gender || 'M');
  const [nationality, setNationality] = useState(currentUser.nationality || 'Angolana');
  const [address, setAddress] = useState(currentUser.address || '');
  const [province, setProvince] = useState(currentUser.province || 'Luanda');
  const [municipality, setMunicipality] = useState(currentUser.municipality || 'Luanda');
  const [locality, setLocality] = useState(currentUser.locality || '');
  const [locationPermission, setLocationPermission] = useState(currentUser.locationPermission || false);
  const [latitude, setLatitude] = useState<number | undefined>(currentUser.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(currentUser.longitude);
  const [profileSaved, setProfileSaved] = useState(false);

  // Cancellation modal state
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const angolaProvinces = [
    'Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando Cubango', 'Cuanza Norte',
    'Cuanza Sul', 'Cunene', 'Huambo', 'Huíla', 'Luanda', 'Lunda Norte',
    'Lunda Sul', 'Malanje', 'Moxico', 'Namibe', 'Uíge', 'Zaire'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resB, resT, resN] = await Promise.all([
        fetch('/api/bookings/my'),
        fetch('/api/tickets/my'),
        fetch('/api/notifications/my')
      ]);

      if (resB.ok) setBookings(await resB.json());
      if (resT.ok) setTickets(await resT.json());
      if (resN.ok) setNotifications(await resN.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setLocationPermission(true);
          alert(`Coordenadas obtidas com sucesso: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}.`);
        },
        err => {
          console.warn('Geolocation denied or unavailable', err);
          alert('Não foi possível obter a localização do dispositivo ou permissão não concedida.');
        }
      );
    } else {
      alert('Geolocalização não suportada pelo navegador.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          biNumber,
          birthDate,
          gender,
          nationality,
          address,
          province,
          municipality,
          locality,
          latitude,
          longitude,
          locationPermission
        })
      });

      if (res.ok) {
        const data = await res.json();
        onUpdateUser(data.user);
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingBookingId) return;
    setIsSubmittingCancel(true);

    try {
      const res = await fetch(`/api/bookings/${cancellingBookingId}/cancel-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      });

      if (res.ok) {
        alert('Pedido de cancelamento e reembolso submetido com sucesso. A administração entrará em contacto.');
        setCancellingBookingId(null);
        setCancelReason('');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Account Banner */}
      <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-neutral-900 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-red-600/30">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
                MINHA CONTA – EKUMBI EXPRESS
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-black">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-neutral-300 mt-1">
              {currentUser.name} · {currentUser.email} · {currentUser.phone}
            </p>
          </div>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-4 text-xs">
          <div className="p-3 rounded-2xl bg-white/10 text-center">
            <span className="text-neutral-400 block text-[10px] uppercase">Reservas</span>
            <span className="font-display font-black text-lg text-white font-mono">{bookings.length}</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 text-center">
            <span className="text-neutral-400 block text-[10px] uppercase">Bilhetes</span>
            <span className="font-display font-black text-lg text-amber-400 font-mono">{tickets.length}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-4 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('viagens')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'viagens'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <Train className="w-4 h-4" />
          <span>Minhas Viagens ({bookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bilhetes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'bilhetes'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <TicketIcon className="w-4 h-4" />
          <span>Meus Bilhetes Digitais ({tickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notificacoes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'notificacoes'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <Radio className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>Alertas de Viagem & SMS ({notifications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('perfil')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'perfil'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Perfil & Localização</span>
        </button>
      </div>

      {/* TAB: MINHAS VIAGENS */}
      {activeTab === 'viagens' && (
        <div className="space-y-6">
          {bookings.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200">
              <Train className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <h3 className="font-display font-bold text-lg text-neutral-800">
                Ainda não possui viagens agendadas
              </h3>
              <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1 mb-6">
                Descubra os comboios velozes da EKUMBI EXPRESS e explore Angola com total conforto e pontualidade.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map(b => (
                <div
                  key={b.id}
                  className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                        {b.bookingCode}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        b.paymentStatus === 'pagamento_confirmado'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : b.paymentStatus === 'comprovativo_recebido' || b.paymentStatus === 'em_analise'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-neutral-100 text-neutral-800'
                      }`}>
                        {b.paymentStatus.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-lg text-neutral-900">
                      {b.originStation} ➔ {b.destinationStation}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-neutral-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Train className="w-3.5 h-3.5 text-neutral-400" />
                        {b.trainName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        {b.travelDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        {b.departureTime}
                      </span>
                      <span className="font-semibold text-neutral-800">
                        Classe {b.travelClass} ({b.passengers?.length || 1} passageiro/s)
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 uppercase block">Total</span>
                      <span className="font-mono font-black text-lg text-neutral-900">
                        {b.totalAmount.toLocaleString('pt-AO')} Kz
                      </span>
                    </div>

                    {b.paymentStatus === 'aguardando_pagamento' && (
                      <button
                        onClick={() => onContinuePayment(b)}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        Pagar Agora
                      </button>
                    )}

                    {b.paymentStatus === 'pagamento_confirmado' && (
                      <button
                        onClick={() => {
                          const t = tickets.find(tkt => tkt.bookingId === b.id);
                          if (t) onViewTicket(t);
                          else setActiveTab('bilhetes');
                        }}
                        className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-black text-amber-300 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <TicketIcon className="w-3.5 h-3.5" />
                        <span>Ver Bilhete Digital</span>
                      </button>
                    )}

                    {/* Cancellation option */}
                    {b.paymentStatus !== 'pagamento_rejeitado' && !b.refundStatus && (
                      <button
                        onClick={() => setCancellingBookingId(b.id)}
                        className="px-3 py-2 rounded-xl text-neutral-500 hover:text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        Cancelar Viagem
                      </button>
                    )}

                    {b.refundStatus && (
                      <span className="text-xs text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                        Cancelamento: {b.refundStatus}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: MEUS BILHETES DIGITAIS */}
      {activeTab === 'bilhetes' && (
        <div className="space-y-6">
          {tickets.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200">
              <TicketIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <h3 className="font-display font-bold text-lg text-neutral-800">
                Nenhum bilhete emitido até ao momento
              </h3>
              <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1 mb-6">
                Os bilhetes digitais com QR Code e código numérico de 10 dígitos são emitidos automaticamente após a confirmação do pagamento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tickets.map(t => (
                <div
                  key={t.id}
                  className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-sm relative overflow-hidden group hover:border-red-400 transition-all"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                    <div>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                        CÓDIGO DE 10 DÍGITOS
                      </span>
                      <span className="font-mono text-xl font-black text-red-600 tracking-wider">
                        {t.numericCode}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {t.status}
                    </span>
                  </div>

                  <div className="py-4 space-y-2">
                    <h4 className="font-display font-bold text-base text-neutral-900">
                      {t.originStation} ➔ {t.destinationStation}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600">
                      <div>
                        <span className="text-neutral-400 block text-[10px]">Passageiro:</span>
                        <strong className="text-neutral-900 truncate block">{t.passengerName}</strong>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px]">Data & Partida:</span>
                        <strong className="text-neutral-900 font-mono block">{t.travelDate} ({t.departureTime})</strong>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px]">Lugar Reservado:</span>
                        <strong className="text-red-600 font-mono block">Carruagem {t.carriageNumber} · Assento {t.seatNumber}</strong>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px]">Classe:</span>
                        <strong className="text-neutral-900 uppercase block">{t.travelClass}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-xs text-neutral-400">
                      Valor: <strong className="text-neutral-900 font-mono">{t.amountPaid.toLocaleString('pt-AO')} Kz</strong>
                    </span>

                    <button
                      onClick={() => onViewTicket(t)}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Abrir / Descarregar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: NOTIFICAÇÕES DE VIAGEM (NEW REQUEST) */}
      {activeTab === 'notificacoes' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-3">
            <Radio className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
            <div>
              <strong className="block font-bold">Central de Alertas Operacionais de Viagem</strong>
              Atualizações automáticas transmitidas em tempo real para os passageiros com reserva ativa (atrasos, mudanças de plataforma, convocações de embarque e horários).
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200">
              <Bell className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <h3 className="font-display font-bold text-lg text-neutral-800">
                Sem alertas operacionais no momento
              </h3>
              <p className="text-xs text-neutral-500">
                Todas as composições e horários da EKUMBI EXPRESS estão a operar conforme a programação.
              </p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-5 rounded-2xl border transition-all ${
                  n.type === 'urgente'
                    ? 'bg-red-50/70 border-red-300'
                    : n.type === 'aviso'
                    ? 'bg-amber-50/70 border-amber-300'
                    : 'bg-white border-neutral-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                      n.type === 'urgente'
                        ? 'bg-red-600 text-white'
                        : n.type === 'aviso'
                        ? 'bg-amber-500 text-black'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-neutral-900">{n.title}</h4>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-black/5 text-neutral-600">
                          {n.type}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-neutral-400 mt-2 block font-mono">
                        {new Date(n.createdAt).toLocaleString('pt-AO')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: PERFIL & LOCALIZAÇÃO */}
      {activeTab === 'perfil' && (
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <div>
                <h3 className="font-display font-bold text-lg text-neutral-900">
                  Dados Pessoais & Localização
                </h3>
                <p className="text-xs text-neutral-500">
                  Mantenha as suas informações atualizadas para a emissão correta dos bilhetes de embarque.
                </p>
              </div>
              {profileSaved && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Perfil Atualizado!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  E-mail de Notificações *
                </label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 bg-neutral-100 text-neutral-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Número de Telefone (WhatsApp) *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Nº do Bilhete de Identidade (BI) *
                </label>
                <input
                  type="text"
                  value={biNumber}
                  onChange={e => setBiNumber(e.target.value)}
                  placeholder="008472918LA042"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Género
                </label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 bg-white"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Nacionalidade
                </label>
                <input
                  type="text"
                  value={nationality}
                  onChange={e => setNationality(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Província de Residência
                </label>
                <select
                  value={province}
                  onChange={e => setProvince(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 bg-white"
                >
                  {angolaProvinces.map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Município
                </label>
                <input
                  type="text"
                  value={municipality}
                  onChange={e => setMunicipality(e.target.value)}
                  placeholder="Ex: Luanda, Viana, Cazenga, Lobito..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Endereço / Morada Completa
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Rua, número de porta, bairro..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600"
              />
            </div>

            {/* Section 4: Localização do Dispositivo (Opcional, conforme solicitado) */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-neutral-900 block flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-600" />
                  Localização Geográfica (Opcional)
                </span>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  A localização GPS é estritamente opcional mediante a sua autorização para sugerir estações próximas.
                  {latitude && longitude && (
                    <span className="font-mono text-emerald-700 block mt-1 font-bold">
                      Coordenadas guardadas: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    </span>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={handleRequestLocation}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
              >
                Autorizar Localização GPS
              </button>
            </div>

            <div className="pt-4 border-t border-neutral-200 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                GUARDAR ALTERAÇÕES DO PERFIL
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cancellation Request Modal */}
      {cancellingBookingId && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200">
            <h3 className="font-display font-bold text-lg text-neutral-900 mb-2">
              Solicitar Cancelamento de Viagem
            </h3>
            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              O cancelamento está sujeito às condições comerciais e de reembolso da EKUMBI EXPRESS. O seu assento será libertado após confirmação.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Motivo do Cancelamento *
              </label>
              <textarea
                required
                rows={3}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Ex: Imprevisto de saúde, alteração de compromisso profissional..."
                className="w-full p-3 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancellingBookingId(null)}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={isSubmittingCancel || !cancelReason.trim()}
                onClick={handleConfirmCancel}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {isSubmittingCancel ? 'A submeter...' : 'Confirmar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
