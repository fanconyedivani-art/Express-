import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { TravelAlertsBanner } from './components/TravelAlertsBanner.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { TripsPage } from './pages/TripsPage.tsx';
import { SeatSelectionPage } from './pages/SeatSelectionPage.tsx';
import { PaymentPage } from './pages/PaymentPage.tsx';
import { CustomerAccountPage } from './pages/CustomerAccountPage.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';
import { TicketViewModal } from './components/TicketViewModal.tsx';
import { TouristDiscoveryModal } from './components/TouristDiscoveryModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import {
  Trip,
  TravelClass,
  TouristDestination,
  User,
  Booking,
  Ticket,
  Passenger,
  SystemNotification
} from './types/index.ts';
import {
  Train,
  MapPin,
  Clock,
  Shield,
  Phone,
  Mail,
  Award,
  Radio,
  Bell,
  X
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('inicio');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [destinations, setDestinations] = useState<TouristDestination[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // Booking Flow States
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedClass, setSelectedClass] = useState<TravelClass>('executiva');
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [activeTicketModal, setActiveTicketModal] = useState<Ticket | null>(null);

  // Modals
  const [touristModalOpen, setTouristModalOpen] = useState(false);
  const [selectedTouristTrip, setSelectedTouristTrip] = useState<Trip | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);

  // Search pre-filters for trips page
  const [tripsFilter, setTripsFilter] = useState<{
    origin: string;
    destination: string;
    date: string;
    passengers: number;
    travelClass: TravelClass;
  } | undefined>(undefined);

  // Load initial session, trips, destinations, and alerts
  useEffect(() => {
    fetchInitialData();

    // Poll for real-time notifications every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchInitialData = async () => {
    try {
      const [resUser, resTrips, resDest, resNotif] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/trips'),
        fetch('/api/tourism'),
        fetch('/api/notifications/my')
      ]);

      if (resUser.ok) {
        const u = await resUser.json();
        setCurrentUser(u.user);
      }
      if (resTrips.ok) setTrips(await resTrips.json());
      if (resDest.ok) setDestinations(await resDest.json());
      if (resNotif.ok) setNotifications(await resNotif.json());
    } catch (err) {
      console.error('Error fetching initial data', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications/my');
      if (res.ok) setNotifications(await res.json());
    } catch (e) {
      // quiet poll
    }
  };

  // Switch demo roles
  const handleSwitchRole = async (role: 'cliente' | 'admin' | 'validador') => {
    try {
      const res = await fetch('/api/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        if (role === 'admin') setCurrentTab('admin');
        else if (role === 'validador') setCurrentTab('admin');
        else setCurrentTab('inicio');
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Start booking flow from home or trips page
  const handleSelectTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setCurrentTab('assentos');
  };

  const handleSearchTrips = (
    origin: string,
    destination: string,
    date: string,
    passCount: number,
    travelClass: TravelClass
  ) => {
    setTripsFilter({
      origin,
      destination,
      date,
      passengers: passCount,
      travelClass
    });
    setPassengerCount(passCount);
    setSelectedClass(travelClass);
    setCurrentTab('viagens');
  };

  // Step 2: From Seats to Payment
  const handleProceedToPayment = async (bookingData: {
    tripId: string;
    travelClass: TravelClass;
    passengers: Passenger[];
    totalAmount: number;
  }) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      if (res.ok) {
        const newBooking = await res.json();
        setCurrentBooking(newBooking);
        setCurrentTab('pagamento');
        fetchNotifications();
      } else {
        alert('Erro ao registar reserva.');
      }
    } catch (err) {
      console.error(err);
      alert('Falha de conexão.');
    }
  };

  // Step 3: Payment completed -> Show ticket
  const handlePaymentSuccess = (tickets: Ticket[]) => {
    if (tickets && tickets.length > 0) {
      setActiveTicketModal(tickets[0]);
    }
    fetchNotifications();
    setCurrentTab('conta');
  };

  const handleOpenTouristDiscovery = (trip?: Trip) => {
    setSelectedTouristTrip(trip || null);
    setTouristModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-neutral-900">
      {/* 1. Real-Time Travel Status Notification Banner (Delays, Boarding Calls, Platforms) */}
      <TravelAlertsBanner
        notifications={notifications}
        onOpenNotifications={() => setNotificationsModalOpen(true)}
      />

      {/* 2. Top Bar Navigation Contract */}
      <Header
        currentTab={currentTab}
        onSelectTab={tab => {
          if (tab === 'reservar') {
            setCurrentTab('viagens');
          } else {
            setCurrentTab(tab);
          }
        }}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={() => handleSwitchRole('cliente')}
        onSwitchRole={handleSwitchRole}
        notifications={notifications}
        onOpenNotifications={() => setNotificationsModalOpen(true)}
      />

      {/* 3. Main Content Router */}
      <main className="flex-1">
        {/* HOMEPAGE */}
        {currentTab === 'inicio' && (
          <HomePage
            trips={trips}
            destinations={destinations}
            onSearchTrips={handleSearchTrips}
            onSelectTrip={handleSelectTrip}
            onOpenTouristDiscovery={handleOpenTouristDiscovery}
          />
        )}

        {/* TRIPS & SCHEDULES */}
        {currentTab === 'viagens' && (
          <TripsPage
            trips={trips}
            onSelectTrip={handleSelectTrip}
            onOpenTouristDiscovery={handleOpenTouristDiscovery}
            initialFilters={tripsFilter}
          />
        )}

        {/* DESTINOS */}
        {currentTab === 'destinos' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-red-600 block mb-1">
                Rede Ferroviária Nacional
              </span>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-neutral-900">
                Destinos Conectados em Angola
              </h1>
              <p className="text-xs text-neutral-500 mt-1">
                A EKUMBI EXPRESS opera nos principais eixos ferroviários ligando Luanda, Cuanza Norte, Malanje, Benguela, Huambo, Huíla e Namibe.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destinations.map(dest => (
                <div
                  key={dest.id}
                  onClick={() => handleOpenTouristDiscovery()}
                  className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs hover:border-red-400 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="h-52 rounded-2xl overflow-hidden mb-4 relative">
                    <img
                      src={dest.imageUrl}
                      alt={dest.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/70 text-amber-300">
                      {dest.province}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-neutral-900 group-hover:text-red-600 transition-colors">
                    {dest.name}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                    {dest.shortDescription}
                  </p>
                  <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Estação: {dest.nearStationName}</span>
                    <span className="text-red-600 font-bold group-hover:translate-x-1 transition-transform">
                      Ver Guia ➔
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EXPERIÊNCIAS TURÍSTICAS */}
        {currentTab === 'turismo' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600 block mb-1">
                  Turismo & Património Ferroviário
                </span>
                <h1 className="font-display font-black text-2xl sm:text-3xl text-neutral-900">
                  DESCUBRA OS LUGARES POR ONDE VAI VIAJAR
                </h1>
                <p className="text-xs text-neutral-500 mt-1">
                  Roteiros culturais, curiosidades históricas e as paisagens mais impressionantes de Angola ao longo das linhas do comboio.
                </p>
              </div>

              <button
                onClick={() => handleOpenTouristDiscovery()}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Abrir Mapa Completo do Percurso
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {destinations.map(d => (
                <div key={d.id} className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="h-64 rounded-2xl overflow-hidden mb-4 relative">
                      <img
                        src={d.imageUrl}
                        alt={d.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 left-3 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded bg-black/75 text-amber-300">
                        {d.province}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-xl text-neutral-900 mb-2">
                      {d.name}
                    </h3>
                    <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                      {d.fullDescription}
                    </p>
                    <div className="space-y-1.5 text-xs">
                      <strong className="text-neutral-900 block">Destaques e Atracções:</strong>
                      <div className="flex flex-wrap gap-1">
                        {d.mainAttractions.map((a, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 text-[11px]">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-xs text-neutral-400">
                      Acesso rápido via {d.nearStationName}
                    </span>
                    <button
                      onClick={() => handleOpenTouristDiscovery()}
                      className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-black transition-colors"
                    >
                      Ver Fotografias & Curiosidades
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SOBRE NÓS */}
        {currentTab === 'sobre' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-red-600">
                A Nossa Missão
              </span>
              <h1 className="font-display font-black text-3xl sm:text-4xl text-neutral-900">
                Sobre a EKUMBI EXPRESS
              </h1>
              <p className="text-base text-neutral-600 italic">
                "Um novo horizonte em cada viagem."
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm space-y-4 text-sm text-neutral-700 leading-relaxed">
              <p>
                A <strong>EKUMBI EXPRESS</strong> nasceu com a vocação de transformar o transporte ferroviário de passageiros em Angola numa experiência de classe mundial. Inspirados pelo sol dourado ("Ekumbi") que ilumina o nosso vasto país, operamos composições modernas, climatizadas e equipadas com tecnologia de ponta.
              </p>
              <p>
                A nossa rede de reservas inteligente garante total transparência: lugares marcados em carruagens ergonómicas, verificação biométrica e documental do Bilhete de Identidade, pagamentos auditados e emissão imediata de bilhetes com QR Code exclusivo.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-neutral-100 text-center">
                <div className="p-4 rounded-2xl bg-neutral-50">
                  <span className="font-display font-black text-2xl text-red-600 block">100%</span>
                  <span className="text-xs text-neutral-500">Angolana & Comprometida</span>
                </div>
                <div className="p-4 rounded-2xl bg-neutral-50">
                  <span className="font-display font-black text-2xl text-amber-600 block">424 km</span>
                  <span className="text-xs text-neutral-500">Corredor Luanda - Malanje</span>
                </div>
                <div className="p-4 rounded-2xl bg-neutral-50">
                  <span className="font-display font-black text-2xl text-neutral-900 block">0 min</span>
                  <span className="text-xs text-neutral-500">Tolerância para Atrasos</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTACTOS */}
        {currentTab === 'contactos' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-red-600">
                Atendimento Oficial
              </span>
              <h1 className="font-display font-black text-3xl text-neutral-900">
                Fale Connosco
              </h1>
              <p className="text-xs text-neutral-500">
                Estamos prontos para atender as suas dúvidas, apoiar na confirmação do pagamento e emitir o seu bilhete.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-sm space-y-4 text-xs">
                <h3 className="font-display font-bold text-base text-neutral-900">
                  Canais Oficiais
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-red-100 text-red-600">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="block text-sm text-neutral-900">+244 922 050 257</strong>
                      <span className="text-neutral-500">WhatsApp oficial e apoio telefónico</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="block text-sm text-neutral-900">reservas@ekumbiexpress.ao</strong>
                      <span className="text-neutral-500">Envio de comprovativos e suporte geral</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-neutral-100 text-neutral-800">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="block text-sm text-neutral-900">Estação Central do Bungo</strong>
                      <span className="text-neutral-500">Largo dos Caminhos de Ferro, Luanda</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-neutral-900 text-white shadow-xl space-y-4 text-xs">
                <h3 className="font-display font-bold text-base text-white">
                  Envie uma Mensagem Rápida
                </h3>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    alert('Mensagem enviada com sucesso! A nossa central de atendimento responderá em breve.');
                  }}
                  className="space-y-3"
                >
                  <input
                    type="text"
                    required
                    placeholder="O seu nome completo"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-800 border border-neutral-700 text-white"
                  />
                  <input
                    type="email"
                    required
                    placeholder="O seu e-mail"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-800 border border-neutral-700 text-white"
                  />
                  <textarea
                    required
                    rows={3}
                    placeholder="Como podemos ajudar?"
                    className="w-full p-3 text-xs rounded-xl bg-neutral-800 border border-neutral-700 text-white"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 font-bold text-white uppercase tracking-wider"
                  >
                    Enviar Mensagem
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 OF BOOKING: CARRIAGE & SEAT SELECTION */}
        {currentTab === 'assentos' && selectedTrip && (
          <SeatSelectionPage
            trip={selectedTrip}
            travelClass={selectedClass}
            passengerCount={passengerCount}
            currentUser={currentUser}
            onProceedToPayment={handleProceedToPayment}
            onBack={() => setCurrentTab('viagens')}
          />
        )}

        {/* STEP 3 OF BOOKING: PAYMENT PAGE */}
        {currentTab === 'pagamento' && currentBooking && (
          <PaymentPage
            booking={currentBooking}
            onPaymentSuccess={handlePaymentSuccess}
            onBack={() => setCurrentTab('assentos')}
          />
        )}

        {/* CLIENT ACCOUNT & TICKETS */}
        {(currentTab === 'conta' || currentTab === 'bilhetes') && (
          <CustomerAccountPage
            currentUser={currentUser || {
              id: 'guest',
              name: 'Passageiro EKUMBI',
              email: 'passageiro@ekumbi.ao',
              phone: '+244 923 000 000',
              role: 'cliente',
              status: 'activo',
              createdAt: new Date().toISOString(),
              loginCount: 1
            }}
            onUpdateUser={u => setCurrentUser(u)}
            onViewTicket={t => setActiveTicketModal(t)}
            onContinuePayment={b => {
              setCurrentBooking(b);
              setCurrentTab('pagamento');
            }}
            initialTab={currentTab === 'bilhetes' ? 'bilhetes' : 'viagens'}
          />
        )}

        {/* ADMIN & BOARDING VALIDATOR PANEL */}
        {currentTab === 'admin' && (
          <AdminDashboardPage
            currentUser={currentUser || {
              id: 'admin',
              name: 'Administrador EKUMBI',
              email: 'admin@ekumbiexpress.ao',
              phone: '+244 922 050 257',
              role: 'admin',
              status: 'activo',
              createdAt: new Date().toISOString(),
              loginCount: 1
            }}
            onOpenTicket={t => setActiveTicketModal(t)}
          />
        )}
      </main>

      {/* 4. Footer */}
      <Footer onSelectTab={tab => setCurrentTab(tab)} />

      {/* 5. Modals */}
      <TouristDiscoveryModal
        isOpen={touristModalOpen}
        onClose={() => setTouristModalOpen(false)}
        trip={selectedTouristTrip}
        destinations={destinations}
        onSelectTrip={handleSelectTrip}
      />

      <TicketViewModal
        ticket={activeTicketModal}
        isOpen={!!activeTicketModal}
        onClose={() => setActiveTicketModal(null)}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={u => {
          setCurrentUser(u);
          fetchNotifications();
        }}
      />

      {/* Real-time Notifications Popover Modal */}
      {notificationsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-neutral-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-red-600" />
                <h3 className="font-display font-bold text-lg text-neutral-900">
                  Notificações de Viagens e Alertas
                </h3>
              </div>
              <button
                onClick={() => setNotificationsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-xs text-neutral-500 py-6 text-center">
                  Sem novas notificações de viagens.
                </p>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border text-xs ${
                      n.type === 'urgente'
                        ? 'bg-red-50 border-red-200'
                        : n.type === 'aviso'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-neutral-900 font-bold">{n.title}</strong>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {new Date(n.createdAt).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-neutral-600 leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-neutral-100 mt-4 flex justify-end">
              <button
                onClick={() => setNotificationsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
