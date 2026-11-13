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

interface AdminBookingWithReceipt extends Booking {
  receipt?: PaymentReceipt | null;
}

interface OutgoingCommunicationLog {
  id: string;
  channel: 'whatsapp' | 'sms' | 'email';
  recipient: string;
  subject?: string;
  message: string;
  status: 'enviado' | 'pendente' | 'falha';
  sentAt: string;
  metadata?: any;
}

type AdminTab = 'dashboard' | 'operacoes' | 'pagamentos' | 'viagens' | 'bilhetes' | 'validacao' | 'clientes' | 'logs';

interface AdminDashboardPageProps {
  currentUser: User;
  onOpenTicket: (ticket: Ticket) => void;
  initialTab?: AdminTab;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  currentUser,
  onOpenTicket,
  initialTab = 'dashboard'
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<AdminBookingWithReceipt[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [commLogs, setCommLogs] = useState<OutgoingCommunicationLog[]>([]);
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
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [resStats, resTrips, resClients, resLogs, resBookings, resTickets, resComms] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/trips'),
        fetch('/api/admin/clients'),
        fetch('/api/admin/audit-logs'),
        fetch('/api/admin/bookings'),
        fetch('/api/admin/tickets'),
        fetch('/api/admin/communication-logs')
      ]);

      if (resStats.ok) setStats(await resStats.json());
      if (resTrips.ok) {
        const trps = await resTrips.json();
        setTrips(trps);
        if (trps.length > 0 && !selectedTripId) setSelectedTripId(trps[0].id);
      }
      if (resClients.ok) setClients(await resClients.json());
      if (resLogs.ok) setAuditLogs(await resLogs.json());
      if (resBookings.ok) setBookings(await resBookings.json());
      if (resTickets.ok) setTickets(await resTickets.json());
      if (resComms.ok) setCommLogs(await resComms.json());
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
  const handleValidateTicket = async (e?: React.FormEvent, overrideCode?: string) => {
    if (e) e.preventDefault();
    const codeToValidate = (overrideCode ?? validationCode).trim();
    if (!codeToValidate) return;

    setIsValidating(true);
    setValidationResult(null);

    try {
      const res = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeOrQr: codeToValidate })
      });

      const data = await res.json();
      setValidationResult(data);
      if (overrideCode) setValidationCode(overrideCode);
      fetchAllData();
    } catch (err) {
      console.error(err);
      alert('Erro de comunicação com o servidor de validação.');
    } finally {
      setIsValidating(false);
    }
  };

  // ----------------------------------------------------------------
  // PAYMENT APPROVAL / REJECTION & REFUNDS
  // ----------------------------------------------------------------
  const handleApprovePayment = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/payments/${bookingId}/approve`, {
        method: 'POST'
      });
      if (res.ok) {
        alert('Pagamento validado com sucesso! Os bilhetes digitais foram emitidos e o passageiro foi notificado.');
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
        alert('Pagamento rejeitado, motivo registado e cliente notificado.');
        setRejectingBookingId(null);
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefundDecision = async (bookingId: string, decision: 'aprovado' | 'rejeitado', totalAmount: number) => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/refund-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          refundAmount: Math.round(totalAmount * 0.9),
          notes: decision === 'aprovado' ? 'Taxa administrativa de 10% aplicada. Assentos libertados.' : 'Prazo comercial expirado.'
        })
      });
      if (res.ok) {
        alert(`Reembolso ${decision} com sucesso!`);
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelTrip = async (tripId: string) => {
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Viagem cancelada e alertas enviados aos passageiros confirmados.');
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelTicket = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelado pelo painel administrativo' })
      });
      if (res.ok) {
        alert('Bilhete cancelado com sucesso.');
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
            Gestão operacional de comboios, fiscalização de embarque e validação de bilhetes, controle financeiro e disparo de alertas em tempo real.
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
            Admin & Fiscal: {currentUser.name.split(' ')[0]}
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
          onClick={() => setActiveTab('pagamentos')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'pagamentos'
              ? 'bg-neutral-900 text-amber-400 shadow-md'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Pagamentos & Reembolsos ({bookings.length})</span>
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
          <span>Fiscalização & Validação</span>
        </button>

        <button
          onClick={() => setActiveTab('bilhetes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'bilhetes'
              ? 'bg-neutral-900 text-amber-400 shadow-md'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <TicketIcon className="w-4 h-4" />
          <span>Bilhetes ({tickets.length})</span>
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

          {/* Integrated Fiscal Boarding Validation Widget on the Same Admin Screen */}
          <div className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-neutral-900">
                    Fiscalização & Validação de Embarque
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Valide bilhetes pelo código de 10 dígitos ou token QR diretamente nesta tela, sem mudar de conta.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold font-mono">
                  {tickets.filter(t => t.status === 'valido').length} válidos
                </span>
                <span className="px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-bold font-mono">
                  {tickets.filter(t => t.status === 'utilizado').length} embarcados
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('validacao')}
                  className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Abrir painel completo
                </button>
              </div>
            </div>

            <form onSubmit={e => handleValidateTicket(e)} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                value={validationCode}
                onChange={e => setValidationCode(e.target.value)}
                placeholder="Digite o código de 10 dígitos ou Token QR (Ex: 8492019384)"
                className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono"
              />
              <button
                type="submit"
                disabled={isValidating || !validationCode.trim()}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isValidating ? 'A validar...' : 'Validar Embarque'}</span>
              </button>
            </form>

            {validationResult && (
              <div className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                validationResult.valid
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : validationResult.status === 'utilizado'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-red-50 border-red-300 text-red-900'
              }`}>
                <div className="flex items-start gap-2.5">
                  {validationResult.valid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="font-display font-bold text-sm block">{validationResult.message}</strong>
                    <span>{validationResult.details}</span>
                  </div>
                </div>
                {validationResult.ticket && (
                  <div className="text-[11px] font-mono bg-white/80 px-3 py-2 rounded-xl border border-neutral-200 shrink-0">
                    <div>{validationResult.ticket.passengerName}</div>
                    <div className="text-red-700 font-bold">
                      Carruagem {validationResult.ticket.carriageNumber} · Assento {validationResult.ticket.seatNumber}
                    </div>
                  </div>
                )}
              </div>
            )}
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

            {/* Live Outgoing SMS/Email/WhatsApp Dispatch Logs */}
            <div className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h4 className="font-display font-bold text-sm text-neutral-900">
                  Registo de Alertas Disparados (SMS / E-mail / WhatsApp)
                </h4>
                <span className="font-mono text-xs text-neutral-500">{commLogs.length} envios</span>
              </div>

              {commLogs.length === 0 ? (
                <p className="text-xs text-neutral-500 py-4 text-center">
                  Nenhum envio automático registado nesta sessão. Dispare um alerta para ver os logs de entrega.
                </p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {commLogs.slice(0, 10).map(log => (
                    <div key={log.id} className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-neutral-900 text-amber-300">
                          {log.channel}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 font-bold">
                          ✓ {log.status} · {new Date(log.sentAt).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="font-semibold text-neutral-800 truncate">{log.recipient}</p>
                      <p className="text-[11px] text-neutral-600 line-clamp-2 mt-0.5">{log.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB: PAGAMENTOS, COMPROVATIVOS & REEMBOLSOS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'pagamentos' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="font-display font-bold text-xl text-neutral-900">
                Gestão de Pagamentos, Comprovativos & Reembolsos
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Analise comprovativos submetidos com suporte OCR, confirme créditos bancários ou aprove solicitações de cancelamento.
              </p>
            </div>

            {bookings.length === 0 ? (
              <p className="text-xs text-neutral-500 py-8 text-center">Nenhuma reserva encontrada.</p>
            ) : (
              <div className="space-y-4">
                {bookings.map(b => (
                  <div key={b.id} className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-red-700 bg-red-50 px-2.5 py-0.5 rounded border border-red-200">
                            {b.bookingCode}
                          </span>
                          <span className="text-xs font-bold text-neutral-900">{b.userFullName}</span>
                          <span className="text-xs text-neutral-500">({b.userPhone})</span>
                        </div>
                        <p className="text-xs text-neutral-600 mt-1">
                          {b.originStation} ➔ {b.destinationStation} · {b.travelDate} ({b.departureTime}) · Classe {b.travelClass}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="text-right">
                          <span className="text-[10px] text-neutral-400 uppercase block">Montante</span>
                          <span className="font-mono font-black text-base text-neutral-900">
                            {b.totalAmount.toLocaleString('pt-AO')} Kz
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          b.paymentStatus === 'pagamento_confirmado'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : b.paymentStatus === 'pagamento_rejeitado'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : b.paymentStatus === 'reembolso'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {b.paymentStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* OCR Receipt Analysis Panel if uploaded */}
                    {b.receipt && (
                      <div className="p-4 rounded-xl bg-white border border-neutral-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            Comprovativo Anexado: {b.receipt.fileName}
                          </span>
                          {b.receipt.analysis && (
                            <span className="font-mono text-[11px] text-emerald-700 font-bold">
                              OCR Confiança: {b.receipt.analysis.confidenceScore}%
                            </span>
                          )}
                        </div>
                        {b.receipt.analysis && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-neutral-600 pt-1">
                            <div>Banco: <strong className="text-neutral-900">{b.receipt.analysis.bankName}</strong></div>
                            <div>ID Transação: <strong className="font-mono text-neutral-900">{b.receipt.analysis.transactionId}</strong></div>
                            <div>Valor OCR: <strong className="font-mono text-neutral-900">{(b.receipt.analysis.amount || 0).toLocaleString('pt-AO')} Kz</strong></div>
                            <div>Correspondência: <strong className={b.receipt.analysis.isAmountMatching ? 'text-emerald-700' : 'text-red-600'}>{b.receipt.analysis.isAmountMatching ? 'Conforme' : 'Divergente'}</strong></div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Controls */}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-200/70 gap-3 flex-wrap">
                      <div className="text-xs text-neutral-500">
                        Método: <strong className="text-neutral-800 uppercase">{b.paymentMethod.replace(/_/g, ' ')}</strong>
                        {b.refundStatus && (
                          <span className="ml-3 text-amber-800 font-semibold">
                            · Pedido Cancelamento: {b.refundStatus} ({b.cancellationReason})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {(b.paymentStatus === 'aguardando_pagamento' || b.paymentStatus === 'comprovativo_recebido' || b.paymentStatus === 'em_analise') && (
                          <>
                            <button
                              onClick={() => handleApprovePayment(b.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                            >
                              Confirmar Pagamento
                            </button>
                            <button
                              onClick={() => setRejectingBookingId(b.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                            >
                              Rejeitar
                            </button>
                          </>
                        )}

                        {b.refundStatus === 'em_analise' && (
                          <>
                            <button
                              onClick={() => handleRefundDecision(b.id, 'aprovado', b.totalAmount)}
                              className="px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-amber-300 text-xs font-bold cursor-pointer"
                            >
                              Aprovar Reembolso (90%) & Libertar Assentos
                            </button>
                            <button
                              onClick={() => handleRefundDecision(b.id, 'rejeitado', b.totalAmount)}
                              className="px-3.5 py-1.5 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-100 text-xs font-bold cursor-pointer"
                            >
                              Rejeitar Pedido
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: VALIDAÇÃO DE BILHETES (SECTION 16) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'validacao' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                <QrCode className="w-6 h-6" />
              </div>
              <h2 className="font-display font-black text-2xl text-neutral-900">
                FISCALIZAÇÃO & VALIDAÇÃO DE BILHETES DE EMBARQUE
              </h2>
              <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
                Controle atómico de acesso à composição ferroviária pelo administrador. Digite o código de 10 dígitos do bilhete ou o identificador do QR Code.
              </p>
            </div>

            <form onSubmit={e => handleValidateTicket(e)} className="space-y-4">
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

          {/* Pending & Validated Boarding Passes List for Quick Fiscal Inspection */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-neutral-900">
                Controlo Rápido de Passageiros por Bilhete
              </h3>
              <span className="text-xs text-neutral-500 font-mono">
                {tickets.filter(t => t.status === 'valido').length} por embarcar · {tickets.filter(t => t.status === 'utilizado').length} validados
              </span>
            </div>

            {tickets.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 text-center">Nenhum bilhete emitido até ao momento.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {tickets.map(t => (
                  <div key={t.id} className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-red-600">{t.numericCode}</span>
                        <span className="font-bold text-neutral-900">{t.passengerName}</span>
                        <span className="text-neutral-500 font-mono">BI: {t.passengerBi}</span>
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        {t.originStation} ➔ {t.destinationStation} · Carruagem {t.carriageNumber}, Assento {t.seatNumber}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.status === 'valido'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'utilizado'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {t.status}
                      </span>
                      {t.status === 'valido' && (
                        <button
                          type="button"
                          onClick={() => handleValidateTicket(undefined, t.numericCode)}
                          className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] cursor-pointer"
                        >
                          Validar Embarque
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                  <div className="flex items-center gap-3">
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
                    {trip.status !== 'cancelada' && (
                      <button
                        onClick={() => handleCancelTrip(trip.id)}
                        className="text-neutral-500 hover:text-red-600 font-semibold hover:underline cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB: GESTÃO DE BILHETES */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'bilhetes' && (
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display font-bold text-xl text-neutral-900">
                Bilhetes Emitidos ({tickets.length})
              </h2>
              <p className="text-xs text-neutral-500">
                Pesquise pelo código numérico de 10 dígitos, nome do passageiro ou BI.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Código de 10 dígitos ou nome..."
                value={ticketSearchQuery}
                onChange={e => setTicketSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Código 10 Dígitos</th>
                  <th className="py-3 px-4">Passageiro</th>
                  <th className="py-3 px-4">Percurso</th>
                  <th className="py-3 px-4">Lugar</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {tickets
                  .filter(t => !ticketSearchQuery || t.numericCode.includes(ticketSearchQuery) || t.passengerName.toLowerCase().includes(ticketSearchQuery.toLowerCase()) || t.passengerBi.toLowerCase().includes(ticketSearchQuery.toLowerCase()))
                  .map(t => (
                    <tr key={t.id} className="hover:bg-neutral-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-red-600">{t.numericCode}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-neutral-900">{t.passengerName}</div>
                        <div className="text-[11px] font-mono text-neutral-500">BI: {t.passengerBi}</div>
                      </td>
                      <td className="py-3 px-4 text-neutral-600">
                        {t.originStation} ➔ {t.destinationStation} ({t.travelDate})
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-800">
                        Carruagem {t.carriageNumber} · {t.seatNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.status === 'valido'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'utilizado'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-3">
                        <button
                          onClick={() => onOpenTicket(t)}
                          className="text-xs font-bold text-neutral-900 hover:text-red-600 cursor-pointer"
                        >
                          Ver QR / PDF
                        </button>
                        {t.status === 'valido' && (
                          <>
                            <button
                              onClick={() => handleValidateTicket(undefined, t.numericCode)}
                              className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                            >
                              Validar Embarque
                            </button>
                            <button
                              onClick={() => handleCancelTicket(t.id)}
                              className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
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

      {/* Modal: Rejeitar Pagamento */}
      {rejectingBookingId && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200">
            <h3 className="font-display font-bold text-lg text-neutral-900 mb-2">
              Rejeitar Comprovativo de Pagamento
            </h3>
            <p className="text-xs text-neutral-600 mb-4">
              Informe o motivo da rejeição. O passageiro será notificado por e-mail, SMS e na sua área pessoal.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="w-full p-3 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectingBookingId(null)}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleRejectPayment}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
