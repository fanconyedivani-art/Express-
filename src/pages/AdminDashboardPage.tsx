import React, { useState, useEffect } from 'react';
import {
  AdminStats,
  Trip,
  Booking,
  User,
  Ticket,
  AuditLog,
  PaymentReceipt
} from '../types/index.ts';
import {
  BarChart3,
  Users,
  Train,
  Ticket as TicketIcon,
  CreditCard,
  AlertTriangle,
  Radio,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Plus,
  Send,
  MessageCircle,
  ShieldAlert,
  FileCheck,
  RefreshCw,
  QrCode,
  DollarSign,
  MapPin,
  Calendar,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface AdminDashboardPageProps {
  currentUser: User;
  onOpenTicket: (ticket: Ticket) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  currentUser,
  onOpenTicket
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'operacoes' | 'pagamentos' | 'viagens' | 'validacao' | 'clientes' | 'logs'>('dashboard');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Travel Alert Trigger Form State (NEW FEATURE!)
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [alertType, setAlertType] = useState<'embarque' | 'atraso' | 'horario' | 'plataforma' | 'geral'>('embarque');
  const [alertTitle, setAlertTitle] = useState('Embarque Imediato Aberto');
  const [alertMessage, setAlertMessage] = useState('Embarque iniciado para todas as carruagens. Tenha o bilhete digital e documento de identidade em mãos.');
  const [delayMinutes, setDelayMinutes] = useState<number>(15);
  const [platformNumber, setPlatformNumber] = useState('Plataforma 1');
  const [newDepartureTime, setNewDepartureTime] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(true);
  const [sendWhatsapp, setSendWhatsapp] = useState(true);
  const [isDispatchingAlert, setIsDispatchingAlert] = useState(false);
  const [alertSuccessMsg, setAlertSuccessMsg] = useState<string | null>(null);

  // Boarding Pass Validation State
  const [validationCode, setValidationCode] = useState('');
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Payment review rejection modal
  const [rejectingBookingId, setRejectingBookingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Comprovativo ilegível ou montante não creditado.');

  // Create new trip modal
  const [showNewTripModal, setShowNewTripModal] = useState(false);
  const [newTripOrigin, setNewTripOrigin] = useState('Estação Central do Bungo');
  const [newTripDest, setNewTripDest] = useState('Estação Central de Malanje');
  const [newTripDate, setNewTripDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTripDepTime, setNewTripDepTime] = useState('07:30');
  const [newTripArrTime, setNewTripArrTime] = useState('14:00');
  const [newTripTrainName, setNewTripTrainName] = useState('EKUMBI Veloz Kwanza 01');
  const [newTripPriceTur, setNewTripPriceTur] = useState(8500);
  const [newTripPriceExec, setNewTripPriceExec] = useState(16000);
  const [newTripPrice1st, setNewTripPrice1st] = useState(28000);

  // Search & filter query
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [resStats, resTrips, resClients, resLogs] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/trips'),
        fetch('/api/admin/clients'),
        fetch('/api/admin/audit-logs')
      ]);

      if (resStats.ok) setStats(await resStats.json());
      if (resTrips.ok) {
        const trps = await resTrips.json();
        setTrips(trps);
        if (trps.length > 0 && !selectedTripId) setSelectedTripId(trps[0].id);
      }
      if (resClients.ok) setClients(await resClients.json());
      if (resLogs.ok) setAuditLogs(await resLogs.json());

      // Fetch all bookings for payment review
      const resB = await fetch('/api/trips'); // placeholder or admin bookings
      // In our server, bookings are in dbService
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // TRAVEL STATUS OPERATIONAL ALERT DISPATCH (REAL-TIME NOTIFICATION)
  // ----------------------------------------------------------------
  const handleDispatchOperationalAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTripId) {
      alert('Selecione uma viagem programada.');
      return;
    }

    setIsDispatchingAlert(true);
    setAlertSuccessMsg(null);

    try {
      const res = await fetch(`/api/trips/${selectedTripId}/operational-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertType,
          title: alertTitle,
          message: alertMessage,
          delayMinutes: alertType === 'atraso' ? delayMinutes : undefined,
          platformNumber,
          newDepartureTime: alertType === 'horario' ? newDepartureTime : undefined,
          sendEmail,
          sendSms,
          sendWhatsapp
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAlertSuccessMsg(data.message || 'Alerta operacional disparado com sucesso para os passageiros!');
        fetchAllData();
      } else {
        alert(data.error || 'Erro ao disparar alerta operacional.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao disparar alerta.');
    } finally {
      setIsDispatchingAlert(false);
    }
  };

  // ----------------------------------------------------------------
  // ATOMIC BOARDING PASS VALIDATION (SECTION 16)
  // ----------------------------------------------------------------
  const handleValidateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validationCode.trim()) return;

    setIsValidating(true);
    setValidationResult(null);

    try {
      const res = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeOrQr: validationCode.trim() })
      });

      const data = await res.json();
      setValidationResult(data);
      fetchAllData();
    } catch (err) {
      console.error(err);
      alert('Erro de comunicação com o servidor de validação.');
    } finally {
      setIsValidating(false);
    }
  };

  // ----------------------------------------------------------------
  // PAYMENT APPROVAL / REJECTION
  // ----------------------------------------------------------------
  const handleApprovePayment = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/payments/${bookingId}/approve`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        alert('Pagamento validado com sucesso! Os bilhetes digitais foram emitidos.');
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectPayment = async () => {
    if (!rejectingBookingId) return;

    try {
      const res = await fetch(`/api/payments/${rejectingBookingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason })
      });

      if (res.ok) {
        alert('Pagamento rejeitado e motivo registado.');
        setRejectingBookingId(null);
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------------------
  // CREATE TRIP
  // ----------------------------------------------------------------
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainId: 'train-ekumbi-01',
          trainName: newTripTrainName,
          trainCode: 'EK-VEL-01',
          routeId: 'route-custom',
          originStation: newTripOrigin,
          originProvince: newTripOrigin.includes('Luanda') ? 'Luanda' : 'Malanje',
          destinationStation: newTripDest,
          destinationProvince: newTripDest.includes('Malanje') ? 'Malanje' : 'Luanda',
          departureDate: newTripDate,
          departureTime: newTripDepTime,
          arrivalDate: newTripDate,
          arrivalTime: newTripArrTime,
          estimatedDuration: '6h 30m',
          prices: {
            turistica: Number(newTripPriceTur),
            executiva: Number(newTripPriceExec),
            primeira: Number(newTripPrice1st)
          },
          stops: [
            { stationName: 'Estação de Viana', province: 'Luanda', arrivalTime: '08:00', departureTime: '08:15' },
            { stationName: 'Estação do Dondo', province: 'Cuanza Norte', arrivalTime: '10:30', departureTime: '10:45' },
            { stationName: 'Estação de Ndalatando', province: 'Cuanza Norte', arrivalTime: '11:45', departureTime: '12:00' }
          ],
          totalSeats: 160,
          availableSeats: 160
        })
      });

      if (res.ok) {
        alert('Nova viagem programada criada com sucesso!');
        setShowNewTripModal(false);
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Client suspension toggle
  const handleToggleClientStatus = async (client: User) => {
    const newStatus = client.status === 'activo' ? 'suspenso' : 'activo';
    try {
      const res = await fetch(`/api/admin/clients/${client.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner */}
      <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-neutral-950 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Train className="w-4 h-4" />
            <span>Módulo de Gestão Central Ferroviária</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            PAINEL ADMINISTRATIVO – EKUMBI EXPRESS
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Gestão operacional de comboios, validação de bilhetes, controle financeiro e disparo de alertas em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllData}
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="px-4 py-2 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold font-mono">
            Admin: {currentUser.name.split(' ')[0]}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-4 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-neutral-900 text-amber-400 shadow-md'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard & Estatísticas</span>
        </button>

        <button
          onClick={() => setActiveTab('operacoes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'operacoes'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <Radio className="w-4 h-4 animate-pulse text-amber-300" />
          <span>Disparo de Alertas de Viagem (SMS / Email)</span>
        </button>

        <button
          onClick={() => setActiveTab('validacao')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'validacao'
              ? 'bg-neutral-900 text-amber-400 shadow-md'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Validação de Bilhetes</span>
        </button>

        <button
          onClick={() => setActiveTab('viagens')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'viagens'
              ? 'bg-neutral-900 text-amber-400 shadow-md'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <Train className="w-4 h-4" />
          <span>Gestão de Viagens ({trips.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('clientes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'clientes'
              ? 'bg-neutral-900 text-amber-400 shadow-md'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Clientes ({clients.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-neutral-900 text-amber-400 shadow-md'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Histórico & Auditoria</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: DASHBOARD & ESTATÍSTICAS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-8">
          {/* Key Metrics Grid (Section 15) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
              <span className="text-neutral-500 text-xs block mb-1">Clientes Registados</span>
              <span className="font-display font-black text-2xl text-neutral-900 font-mono">
                {stats.totalClients}
              </span>
              <span className="text-[11px] text-neutral-400 block mt-1">
                {stats.totalLogins} logins registados
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
              <span className="text-neutral-500 text-xs block mb-1">Total de Reservas</span>
              <span className="font-display font-black text-2xl text-red-600 font-mono">
                {stats.totalBookings}
              </span>
              <span className="text-[11px] text-neutral-400 block mt-1">
                {stats.totalPassengers} passageiros transportados
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
              <span className="text-neutral-500 text-xs block mb-1">Bilhetes Emitidos</span>
              <span className="font-display font-black text-2xl text-neutral-900 font-mono">
                {stats.totalTicketsIssued}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
                {stats.totalPaymentsConfirmed} confirmados
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-950 text-white border border-neutral-800 shadow-xs">
              <span className="text-neutral-400 text-xs block mb-1">Receita Total Confirmada</span>
              <span className="font-display font-black text-xl text-amber-400 font-mono">
                {stats.totalConfirmedRevenue.toLocaleString('pt-AO')} Kz
              </span>
              <span className="text-[10px] text-neutral-400 block mt-1">
                Fundos creditados em contas bancárias
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
              <span className="text-neutral-500 text-xs block mb-1">Viagens Marcadas</span>
              <span className="font-display font-black text-2xl text-neutral-900 font-mono">
                {stats.totalTripsScheduled}
              </span>
              <span className="text-[11px] text-neutral-400 block mt-1">
                {stats.totalTripsCompleted} viagens concluídas
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
              <span className="text-neutral-500 text-xs block mb-1">Pagamentos Pendentes</span>
              <span className="font-display font-black text-2xl text-amber-600 font-mono">
                {stats.pendingPaymentsCount}
              </span>
              <span className="text-[11px] text-amber-700 block mt-1">
                {stats.receiptsInReviewCount} comprovativos para validação
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
              <span className="text-neutral-500 text-xs block mb-1">Viagens Canceladas</span>
              <span className="font-display font-black text-2xl text-neutral-900 font-mono">
                {stats.cancelledTripsCount}
              </span>
              <span className="text-[11px] text-neutral-400 block mt-1">
                Índice de cancelamento &lt; 2%
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-xs">
              <span className="text-emerald-800 text-xs block mb-1">Pontualidade Média</span>
              <span className="font-display font-black text-2xl text-emerald-700 font-mono">
                98.6%
              </span>
              <span className="text-[11px] text-emerald-800 block mt-1">
                Conforme compromisso EKUMBI
              </span>
            </div>
          </div>

          {/* Visual Charts & Breakdown (Section 15) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart 1: Reservas por Mês */}
            <div className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs">
              <h3 className="font-display font-bold text-base text-neutral-900 mb-4 flex items-center justify-between">
                <span>Evolução Mensal de Reservas</span>
                <span className="text-xs text-neutral-400 font-normal">Ano Corrente</span>
              </h3>

              <div className="h-64 flex items-end gap-2 sm:gap-4 pt-6 border-b border-neutral-200 px-2">
                {stats.bookingsByMonth.map(m => {
                  const maxB = 140;
                  const heightPercent = Math.min(100, (m.bookings / maxB) * 100);
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="relative w-full flex items-end justify-center h-48">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[28px] rounded-t-lg bg-red-600 group-hover:bg-red-700 transition-all relative"
                        >
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10">
                            {m.bookings} res.
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-neutral-500 uppercase">
                        {m.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Destinos Mais Populares */}
            <div className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs">
              <h3 className="font-display font-bold text-base text-neutral-900 mb-4 flex items-center justify-between">
                <span>Destinos Ferroviários Mais Procurados</span>
                <span className="text-xs text-neutral-400 font-normal">Volume de Passageiros</span>
              </h3>

              <div className="space-y-4 pt-2">
                {stats.popularDestinations.map((d, idx) => {
                  const maxD = 600;
                  const percent = (d.count / maxD) * 100;
                  return (
                    <div key={d.destination} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-800">
                          {idx + 1}. {d.destination}
                        </span>
                        <span className="font-mono text-neutral-500">
                          {d.count} passageiros
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className="h-full rounded-full bg-gradient-to-r from-red-600 to-amber-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: OPERAÇÕES & DISPARO DE ALERTAS DE VIAGEM EM TEMPO REAL */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'operacoes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 text-red-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Centro de Notificações Operacionais ao Passageiro</span>
            </div>
            <h2 className="font-display font-black text-2xl text-neutral-900 mb-2">
              Disparar Alerta de Viagem em Tempo Real
            </h2>
            <p className="text-xs text-neutral-600 mb-6">
              Envie alertas automáticos para todos os clientes que possuem bilhetes emitidos para a viagem selecionada. O sistema transmitirá a atualização via e-mail, SMS e notificação no painel do cliente.
            </p>

            <form onSubmit={handleDispatchOperationalAlert} className="space-y-4">
              {/* Trip selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Selecione a Viagem Programada *
                </label>
                <select
                  required
                  value={selectedTripId}
                  onChange={e => setSelectedTripId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 bg-white"
                >
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.trainName} · {t.originStation} ➔ {t.destinationStation} ({t.departureDate} às {t.departureTime})
                    </option>
                  ))}
                </select>
              </div>

              {/* Alert Type */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAlertType('embarque');
                    setAlertTitle('Embarque Imediato Aberto');
                    setAlertMessage('Embarque iniciado para todas as carruagens. Tenha o bilhete digital e documento de identidade em mãos.');
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    alertType === 'embarque'
                      ? 'border-red-600 bg-red-50 text-red-700 ring-2 ring-red-600/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  📢 Embarque
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAlertType('atraso');
                    setAlertTitle('Aviso de Atraso Operacional');
                    setAlertMessage(`Prezados passageiros, devido a manutenção preventiva na linha, prevemos um atraso de ${delayMinutes} minutos na partida.`);
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    alertType === 'atraso'
                      ? 'border-amber-600 bg-amber-50 text-amber-700 ring-2 ring-amber-600/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  ⚠️ Atraso
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAlertType('plataforma');
                    setAlertTitle('Alteração de Plataforma');
                    setAlertMessage(`Atenção: A composição foi transferida para a ${platformNumber}. Por favor dirija-se ao respetivo cais.`);
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    alertType === 'plataforma'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  🚉 Plataforma
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAlertType('horario');
                    setAlertTitle('Alteração de Horário de Partida');
                    setAlertMessage(`Informamos que o novo horário de partida desta composição foi reprogramado para as ${newDepartureTime || '14:30'}.`);
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    alertType === 'horario'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-600/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  🕒 Horário
                </button>
              </div>

              {/* Conditional Inputs */}
              {alertType === 'atraso' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Minutos de Atraso Previstos
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={delayMinutes}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setDelayMinutes(val);
                      setAlertMessage(`Prezados passageiros, devido a manutenção preventiva na linha, prevemos um atraso estimado de ${val} minutos na partida.`);
                    }}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
              )}

              {alertType === 'plataforma' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Identificação da Plataforma / Cais
                  </label>
                  <input
                    type="text"
                    value={platformNumber}
                    onChange={e => {
                      setPlatformNumber(e.target.value);
                      setAlertMessage(`Atenção: A composição foi transferida para a ${e.target.value}. Por favor dirija-se ao respetivo cais.`);
                    }}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-300"
                  />
                </div>
              )}

              {alertType === 'horario' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Novo Horário de Partida (HH:mm)
                  </label>
                  <input
                    type="time"
                    value={newDepartureTime}
                    onChange={e => {
                      setNewDepartureTime(e.target.value);
                      setAlertMessage(`Informamos que o novo horário de partida desta composição foi reprogramado para as ${e.target.value}.`);
                    }}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Título do Alerta *
                </label>
                <input
                  type="text"
                  required
                  value={alertTitle}
                  onChange={e => setAlertTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Mensagem Detalhada transmitida aos Passageiros *
                </label>
                <textarea
                  required
                  rows={3}
                  value={alertMessage}
                  onChange={e => setAlertMessage(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                />
              </div>

              {/* Channels checkboxes */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
                <span className="text-xs font-bold text-neutral-700 block mb-2">
                  Canais de Disparo Imediato:
                </span>
                <div className="flex items-center gap-6 text-xs flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={e => setSendEmail(e.target.checked)}
                      className="rounded text-red-600"
                    />
                    <span>E-mail do Passageiro</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendSms}
                      onChange={e => setSendSms(e.target.checked)}
                      className="rounded text-red-600"
                    />
                    <span>SMS Telemóvel (+244)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendWhatsapp}
                      onChange={e => setSendWhatsapp(e.target.checked)}
                      className="rounded text-red-600"
                    />
                    <span>WhatsApp Corporativo</span>
                  </label>
                </div>
              </div>

              {alertSuccessMsg && (
                <div className="p-4 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{alertSuccessMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isDispatchingAlert}
                className="w-full py-3.5 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDispatchingAlert ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>A disparar notificações pelos canais...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>DISPARAR ALERTA OPERACIONAL AGORA</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Live Status Preview & Dispatch Logs */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-neutral-900 text-white shadow-xl space-y-4">
              <h3 className="font-display font-bold text-base text-white border-b border-neutral-800 pb-3 flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-500" />
                <span>Simulação da Notificação ao Cliente</span>
              </h3>

              <div className="p-4 rounded-2xl bg-neutral-800 border border-neutral-700 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-amber-400 uppercase">Notificação Push & SMS</span>
                  <span className="text-neutral-400 font-mono">Agora</span>
                </div>
                <h4 className="font-bold text-sm text-white">{alertTitle}</h4>
                <p className="text-xs text-neutral-300 leading-relaxed">{alertMessage}</p>
                <div className="pt-2 text-[10px] text-neutral-400 border-t border-neutral-700 flex justify-between">
                  <span>Remetente: EKUMBI EXPRESS</span>
                  <span>Canal: SMS Gateway / +244</span>
                </div>
              </div>

              <div className="text-xs text-neutral-400 space-y-1">
                <p>✓ Os passageiros da viagem selecionada recebem o alerta instantaneamente.</p>
                <p>✓ O painel do cliente ativa o banner de aviso no topo da página.</p>
                <p>✓ Todas as mensagens são guardadas no livro de registo de bordo.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: VALIDAÇÃO DE BILHETES (SECTION 16) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'validacao' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6" />
            </div>
            <h2 className="font-display font-black text-2xl text-neutral-900">
              VALIDAÇÃO DE BILHETES DE EMBARQUE
            </h2>
            <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
              Controle atómico de acesso à composição ferroviária. Digite o código de 10 dígitos do bilhete ou o identificador do QR Code lido pela câmara.
            </p>
          </div>

          <form onSubmit={handleValidateTicket} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Código Numérico de 10 Dígitos ou Token QR *
              </label>
              <input
                type="text"
                required
                value={validationCode}
                onChange={e => setValidationCode(e.target.value)}
                placeholder="Ex: 8492019384"
                className="w-full px-4 py-3 text-base rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono tracking-wider text-center"
              />
            </div>

            <button
              type="submit"
              disabled={isValidating || !validationCode.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isValidating ? (
                <span>A consultar base de dados em tempo real...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>VALIDAR EMBARQUE DO PASSAGEIRO</span>
                </>
              )}
            </button>
          </form>

          {/* Validation Result Box */}
          {validationResult && (
            <div className={`mt-8 p-6 rounded-2xl border text-center transition-all ${
              validationResult.valid
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : validationResult.status === 'utilizado'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}>
              <div className="flex justify-center mb-3">
                {validationResult.valid ? (
                  <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-600" />
                )}
              </div>

              <h3 className="font-display font-black text-xl mb-1">
                {validationResult.message}
              </h3>
              <p className="text-xs max-w-md mx-auto mb-4">{validationResult.details}</p>

              {validationResult.ticket && (
                <div className="p-4 rounded-xl bg-white/80 border border-neutral-200 text-left text-xs space-y-1.5 font-sans">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Passageiro:</span>
                    <strong className="text-neutral-900">{validationResult.ticket.passengerName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Bilhete Identidade:</span>
                    <strong className="font-mono text-neutral-900">{validationResult.ticket.passengerBi}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Lugar Marcado:</span>
                    <strong className="text-red-700 font-bold">Carruagem {validationResult.ticket.carriageNumber} · Assento {validationResult.ticket.seatNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Percurso:</span>
                    <span className="text-neutral-900">{validationResult.ticket.originStation} ➔ {validationResult.ticket.destinationStation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Composição:</span>
                    <span className="text-neutral-900">{validationResult.ticket.trainName}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: GESTÃO DE VIAGENS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'viagens' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-display font-bold text-xl text-neutral-900">
              Viagens Ferroviárias Programadas ({trips.length})
            </h2>
            <button
              onClick={() => setShowNewTripModal(true)}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Programar Nova Viagem</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trips.map(trip => (
              <div key={trip.id} className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                    {trip.trainName}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    trip.status === 'programada' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-700'
                  }`}>
                    {trip.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-display font-bold text-lg text-neutral-900">
                    {trip.originStation} ➔ {trip.destinationStation}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                    <span className="font-mono">{trip.departureDate}</span>
                    <span>·</span>
                    <span className="font-mono font-bold text-neutral-800">{trip.departureTime} às {trip.arrivalTime}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-100 text-[11px]">
                  <div className="p-2 rounded-lg bg-neutral-50 text-center">
                    <span className="text-neutral-400 block text-[10px]">Turística</span>
                    <strong className="text-neutral-900 font-mono">{trip.prices.turistica.toLocaleString('pt-AO')} Kz</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-50 text-center">
                    <span className="text-neutral-400 block text-[10px]">Executiva</span>
                    <strong className="text-neutral-900 font-mono">{trip.prices.executiva.toLocaleString('pt-AO')} Kz</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-50 text-center">
                    <span className="text-neutral-400 block text-[10px]">1ª Classe VIP</span>
                    <strong className="text-neutral-900 font-mono">{trip.prices.primeira.toLocaleString('pt-AO')} Kz</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-neutral-500">
                    Assentos: <strong className="text-neutral-900 font-mono">{trip.availableSeats} / {trip.totalSeats}</strong> livres
                  </span>
                  <button
                    onClick={() => {
                      setSelectedTripId(trip.id);
                      setActiveTab('operacoes');
                    }}
                    className="text-red-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Disparar Alerta</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: GESTÃO DE CLIENTES */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'clientes' && (
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="font-display font-bold text-xl text-neutral-900">
              Clientes Registados na Plataforma ({clients.length})
            </h2>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Pesquisar por nome ou BI..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nome do Cliente</th>
                  <th className="py-3 px-4">BI / Identidade</th>
                  <th className="py-3 px-4">Contacto</th>
                  <th className="py-3 px-4">Província</th>
                  <th className="py-3 px-4">Logins</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {clients
                  .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.biNumber && c.biNumber.toLowerCase().includes(searchQuery.toLowerCase())))
                  .map(c => (
                    <tr key={c.id} className="hover:bg-neutral-50/50">
                      <td className="py-3 px-4 font-bold text-neutral-900">{c.name}</td>
                      <td className="py-3 px-4 font-mono text-neutral-600">{c.biNumber || 'Pendente'}</td>
                      <td className="py-3 px-4 text-neutral-600">{c.phone}</td>
                      <td className="py-3 px-4 text-neutral-600">{c.province || 'Luanda'}</td>
                      <td className="py-3 px-4 font-mono text-neutral-600">{c.loginCount || 1}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.status === 'activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleClientStatus(c)}
                          className={`text-xs font-bold hover:underline cursor-pointer ${
                            c.status === 'activo' ? 'text-red-600' : 'text-emerald-600'
                          }`}
                        >
                          {c.status === 'activo' ? 'Suspender' : 'Reactivar'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 6: HISTÓRICO & AUDITORIA */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="font-display font-bold text-xl text-neutral-900 mb-2">
            Registo de Auditoria Operacional
          </h2>
          <p className="text-xs text-neutral-500 mb-6">
            Histórico completo de validações de bilhetes, aprovações financeiras e disparo de alertas para fins de prestação de contas.
          </p>

          <div className="space-y-3">
            {auditLogs.map(log => (
              <div key={log.id} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-600">{log.action}</span>
                    <span className="text-neutral-400">·</span>
                    <span className="font-semibold text-neutral-800">{log.adminName}</span>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {new Date(log.timestamp).toLocaleString('pt-AO')}
                  </span>
                </div>
                <p className="text-neutral-600 mt-1">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Criar Nova Viagem */}
      {showNewTripModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-bold text-xl text-neutral-900 mb-4">
              Programar Nova Viagem Ferroviária
            </h3>

            <form onSubmit={handleCreateTrip} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Composição / Comboio</label>
                <input
                  type="text"
                  required
                  value={newTripTrainName}
                  onChange={e => setNewTripTrainName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Estação de Origem</label>
                  <input
                    type="text"
                    required
                    value={newTripOrigin}
                    onChange={e => setNewTripOrigin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Estação de Destino</label>
                  <input
                    type="text"
                    required
                    value={newTripDest}
                    onChange={e => setNewTripDest(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={newTripDate}
                    onChange={e => setNewTripDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Partida</label>
                  <input
                    type="time"
                    required
                    value={newTripDepTime}
                    onChange={e => setNewTripDepTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Chegada Prevista</label>
                  <input
                    type="time"
                    required
                    value={newTripArrTime}
                    onChange={e => setNewTripArrTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Preço Turística (Kz)</label>
                  <input
                    type="number"
                    required
                    value={newTripPriceTur}
                    onChange={e => setNewTripPriceTur(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Preço Executiva (Kz)</label>
                  <input
                    type="number"
                    required
                    value={newTripPriceExec}
                    onChange={e => setNewTripPriceExec(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Preço 1ª Classe (Kz)</label>
                  <input
                    type="number"
                    required
                    value={newTripPrice1st}
                    onChange={e => setNewTripPrice1st(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewTripModal(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Criar Viagem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
