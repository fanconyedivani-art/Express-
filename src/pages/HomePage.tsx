import React, { useState } from 'react';
import { Trip, TravelClass, TouristDestination } from '../types/index.ts';
import {
  Train,
  Calendar,
  Users,
  MapPin,
  Clock,
  ShieldCheck,
  Wifi,
  Coffee,
  Sparkles,
  ArrowRight,
  Phone,
  Mail,
  CheckCircle2,
  ChevronRight,
  Eye,
  Compass,
  MessageCircle
} from 'lucide-react';

interface HomePageProps {
  trips: Trip[];
  destinations: TouristDestination[];
  onSearchTrips: (origin: string, destination: string, date: string, passCount: number, travelClass: TravelClass) => void;
  onSelectTrip: (trip: Trip) => void;
  onOpenTouristDiscovery: (trip?: Trip) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  trips,
  destinations,
  onSearchTrips,
  onSelectTrip,
  onOpenTouristDiscovery
}) => {
  const [origin, setOrigin] = useState('Estação Central do Bungo');
  const [destination, setDestination] = useState('Estação Central de Malanje');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [passengers, setPassengers] = useState(1);
  const [travelClass, setTravelClass] = useState<TravelClass>('executiva');
  const [selectedPhotoZoom, setSelectedPhotoZoom] = useState<string | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchTrips(origin, destination, date, passengers, travelClass);
  };

  const stations = [
    'Estação Central do Bungo (Luanda)',
    'Estação de Viana (Luanda)',
    'Estação do Dondo (Cuanza Norte)',
    'Estação de Ndalatando (Cuanza Norte)',
    'Estação Central de Malanje',
    'Estação do Lobito (Benguela)',
    'Estação de Benguela',
    'Estação Central do Huambo',
    'Estação de Moçâmedes (Namibe)',
    'Estação do Lubango (Huíla)'
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* ------------------------------------------------------------- */}
      {/* BANNER PRINCIPAL / HERO SECTION WITH SEARCH ENGINE */}
      {/* ------------------------------------------------------------- */}
      <section className="relative min-h-[620px] flex items-center justify-center overflow-hidden">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/hero_ekumbi_train_1794439205262.jpg"
            alt="Comboio moderno EKUMBI EXPRESS a atravessar as paisagens de Angola ao entardecer"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover brightness-[0.78]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-red-950/60 via-transparent to-black/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-300 uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transporte Ferroviário Inteligente em Angola</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl tracking-tight text-white max-w-4xl mx-auto leading-none drop-shadow-md">
            EKUMBI EXPRESS
          </h1>

          <p className="mt-4 text-xl sm:text-2xl text-amber-300 font-medium tracking-wide drop-shadow-sm italic">
            "Um novo horizonte em cada viagem."
          </p>

          <p className="mt-3 text-sm sm:text-base text-neutral-200 max-w-2xl mx-auto font-normal drop-shadow-sm">
            Conectamos as principais províncias angolanas com tecnologia moderna, pontualidade britânica, conforto VIP e paisagens turísticas inesquecíveis.
          </p>

          {/* Form de Pesquisa de Viagens (Section 3 & 5) */}
          <div className="mt-10 max-w-5xl mx-auto p-4 sm:p-6 rounded-3xl bg-white text-neutral-900 shadow-2xl border border-neutral-100">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-left">
                {/* Origem */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-600" /> Origem
                  </label>
                  <select
                    value={origin}
                    onChange={e => setOrigin(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 bg-neutral-50"
                  >
                    {stations.map(st => (
                      <option key={st} value={st.split(' (')[0]}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* Destino */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" /> Destino
                  </label>
                  <select
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 bg-neutral-50"
                  >
                    {stations.map(st => (
                      <option key={st} value={st.split(' (')[0]}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* Data de Partida */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-neutral-500" /> Data de Partida
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 bg-neutral-50"
                  />
                </div>

                {/* Passageiros */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-neutral-500" /> Passageiros
                  </label>
                  <select
                    value={passengers}
                    onChange={e => setPassengers(Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 bg-neutral-50"
                  >
                    <option value={1}>1 Passageiro</option>
                    <option value={2}>2 Passageiros</option>
                    <option value={3}>3 Passageiros</option>
                    <option value={4}>4 Passageiros</option>
                    <option value={5}>5 Passageiros</option>
                  </select>
                </div>

                {/* Classe */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Train className="w-3.5 h-3.5 text-neutral-500" /> Classe
                  </label>
                  <select
                    value={travelClass}
                    onChange={e => setTravelClass(e.target.value as TravelClass)}
                    className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 bg-neutral-50"
                  >
                    <option value="turistica">Turística Standard</option>
                    <option value="executiva">Executiva Conforto</option>
                    <option value="primeira">Primeira Classe VIP</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-neutral-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Emissão oficial com QR Code e código de 10 dígitos</span>
                </span>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Train className="w-4 h-4 text-amber-300" />
                  <span>PESQUISAR VIAGENS</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECÇÃO 1: DESTINOS POPULARES */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-red-600 block mb-1">
              Corredores Principais
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-neutral-900">
              Destinos Mais Procurados em Angola
            </h2>
          </div>
          <p className="text-xs text-neutral-500 max-w-sm">
            Linhas ferroviárias reabilitadas que unem capitais provinciais e centros económicos e turísticos vitais.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Malanje */}
          <div
            onClick={() => onOpenTouristDiscovery()}
            className="group relative rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer border border-neutral-200 h-80"
          >
            <img
              src="/src/assets/images/tourist_calandula_falls_1794439205229.jpg"
              alt="Malanje e Quedas de Kalandula"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Província de Malanje
              </span>
              <h3 className="font-display font-bold text-xl text-white">
                Malanje & Quedas de Kalandula
              </h3>
              <p className="text-xs text-neutral-300 line-clamp-2 mt-1">
                A terra dos monólitos negros de Pungo Andongo e da segunda maior catarata em extensão de África.
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-amber-300 font-semibold border-t border-white/20 pt-2">
                <span>Desde 8.500 Kz</span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Ver atrações <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>

          {/* Luanda */}
          <div
            onClick={() => onOpenTouristDiscovery()}
            className="group relative rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer border border-neutral-200 h-80"
          >
            <img
              src="/src/assets/images/tourist_miradouro_lua_1794439205816.jpg"
              alt="Luanda e Miradouro da Lua"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Capital de Angola
              </span>
              <h3 className="font-display font-bold text-xl text-white">
                Luanda & Miradouro da Lua
              </h3>
              <p className="text-xs text-neutral-300 line-clamp-2 mt-1">
                A energia vibrante da baía, a Fortaleza histórica de São Miguel e as falésias lunares da orla marítima.
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-amber-300 font-semibold border-t border-white/20 pt-2">
                <span>Desde 8.500 Kz</span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Ver atrações <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>

          {/* Cuanza Norte / Dondo */}
          <div
            onClick={() => onOpenTouristDiscovery()}
            className="group relative rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer border border-neutral-200 h-80"
          >
            <img
              src="/src/assets/images/train_luxury_interior_1794439205805.jpg"
              alt="Cuanza Norte e Conforto Panorâmico"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Cuanza Norte & Dondo
              </span>
              <h3 className="font-display font-bold text-xl text-white">
                Ndalatando & Vale do Kwanza
              </h3>
              <p className="text-xs text-neutral-300 line-clamp-2 mt-1">
                A cidade verdejante dos orquidários botânicos e as correntes lendárias do Rio Kwanza no Dondo.
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-amber-300 font-semibold border-t border-white/20 pt-2">
                <span>Desde 6.000 Kz</span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Ver atrações <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECÇÃO 2: PRÓXIMAS VIAGENS PROGRAMADAS */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-red-600 block mb-1">
              Horários & Frequências em Tempo Real
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-neutral-900">
              Próximas Partidas Garantidas
            </h2>
          </div>
          <span className="text-xs text-neutral-500">
            Horários sincronizados diretamente com a central operacional EKUMBI
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trips.slice(0, 4).map(trip => (
            <div
              key={trip.id}
              className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs hover:border-red-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-xs text-red-700 bg-red-50 px-2.5 py-0.5 rounded border border-red-200">
                      {trip.trainName}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-neutral-500 font-semibold">
                    {trip.departureDate}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="font-mono text-xl sm:text-2xl font-black text-neutral-900 block">
                      {trip.departureTime}
                    </span>
                    <span className="text-xs font-bold text-neutral-800">
                      {trip.originStation}
                    </span>
                  </div>

                  <div className="flex flex-col items-center px-4">
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {trip.estimatedDuration}
                    </span>
                    <div className="w-20 sm:w-28 flex items-center my-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                      <div className="flex-1 h-0.5 bg-neutral-200" />
                      <Train className="w-3.5 h-3.5 text-red-600 mx-1" />
                      <div className="flex-1 h-0.5 bg-neutral-200" />
                      <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      Direto / Semi-direto
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-xl sm:text-2xl font-black text-neutral-900 block">
                      {trip.arrivalTime}
                    </span>
                    <span className="text-xs font-bold text-neutral-800">
                      {trip.destinationStation}
                    </span>
                  </div>
                </div>

                {/* Stops mini badge */}
                {trip.stops && trip.stops.length > 0 && (
                  <div className="text-[11px] text-neutral-500 pt-2 border-t border-neutral-100 flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">
                      Paragens: {trip.stops.map(s => s.stationName.replace('Estação de ', '').replace('Estação do ', '')).join(' · ')}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 block uppercase">Tarifa desde</span>
                  <span className="font-mono font-black text-lg text-neutral-900">
                    {trip.prices.turistica.toLocaleString('pt-AO')} Kz
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenTouristDiscovery(trip)}
                    className="px-3 py-2 rounded-xl text-neutral-600 hover:text-neutral-900 text-xs font-bold hover:bg-neutral-100 transition-colors"
                  >
                    Ver Roteiro
                  </button>

                  <button
                    onClick={() => onSelectTrip(trip)}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>ESCOLHER ESTA VIAGEM</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECÇÃO 3: EXPERIÊNCIAS TURÍSTICAS ("DESCUBRA OS LUGARES") */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-neutral-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-1">
                Turismo Ferroviário Nacional
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
                DESCUBRA OS LUGARES POR ONDE VAI VIAJAR
              </h2>
            </div>
            <button
              onClick={() => onOpenTouristDiscovery()}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer w-fit"
            >
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Explorar Guia Cultural Completo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map(d => (
              <div
                key={d.id}
                onClick={() => onOpenTouristDiscovery()}
                className="group rounded-2xl overflow-hidden bg-neutral-800 border border-neutral-700 cursor-pointer hover:border-amber-400 transition-all"
              >
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={d.imageUrl}
                    alt={d.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/70 text-amber-300">
                    {d.province}
                  </span>
                </div>
                <div className="p-5 space-y-2">
                  <h4 className="font-display font-bold text-base text-white group-hover:text-amber-400 transition-colors">
                    {d.name}
                  </h4>
                  <p className="text-xs text-neutral-400 line-clamp-2">
                    {d.shortDescription}
                  </p>
                  <span className="text-[11px] text-amber-400 font-semibold block pt-2">
                    Próximo de: {d.nearStationName} ➔
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECÇÃO 4: VANTAGENS DE VIAJAR COM A EKUMBI EXPRESS */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-red-600 block mb-1">
            Excelência Operacional
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-neutral-900">
            Vantagens de Viajar com a EKUMBI EXPRESS
          </h2>
          <p className="text-xs text-neutral-500 mt-2">
            Desenhamos cada detalhe da sua experiência para proporcionar segurança, tranquilidade e produtividade a bordo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-neutral-900">
              Pontualidade Britânica
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Cumprimento rigoroso dos horários previstos de partida e chegada, com monitorização telemétrica em tempo real.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-neutral-900">
              Segurança Integral
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Vigilância de bordo, controlo atómico de bilhetes com QR Code de uso único e assistência médica de emergência.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-800 flex items-center justify-center">
              <Coffee className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-neutral-900">
              Conforto & Restauração
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Assentos anatómicos reclináveis, carruagem-restaurante com sabores angolanos e climatização tropicalizada.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Wifi className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-neutral-900">
              Conectividade a Bordo
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Tomadas elétricas e USB individuais em cada assento, com rede Wi-Fi estável durante todo o percurso.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECÇÃO 5: COMO COMPRAR O SEU BILHETE */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-neutral-50 border-y border-neutral-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-red-600 block mb-1">
              Passo a Passo Simples
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-neutral-900">
              Como Comprar o Seu Bilhete Online
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-neutral-200 space-y-3 relative">
              <span className="font-display font-black text-4xl text-neutral-200">01</span>
              <h4 className="font-display font-bold text-base text-neutral-900">
                Pesquise a Viagem
              </h4>
              <p className="text-xs text-neutral-500">
                Escolha a estação de origem, o seu destino em Angola, a data da viagem e o número de passageiros.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-neutral-200 space-y-3 relative">
              <span className="font-display font-black text-4xl text-neutral-200">02</span>
              <h4 className="font-display font-bold text-base text-neutral-900">
                Escolha Carruagem e Assento
              </h4>
              <p className="text-xs text-neutral-500">
                Selecione o seu assento favorito no mapa interativo em tempo real (verde disponível, azul selecionado).
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-neutral-200 space-y-3 relative">
              <span className="font-display font-black text-4xl text-neutral-200">03</span>
              <h4 className="font-display font-bold text-base text-neutral-900">
                Efetue o Pagamento
              </h4>
              <p className="text-xs text-neutral-500">
                Pague com Cartão ou faça Transferência Bancária via Multicaixa Express e anexe o comprovativo.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-neutral-200 space-y-3 relative">
              <span className="font-display font-black text-4xl text-red-600">04</span>
              <h4 className="font-display font-bold text-base text-neutral-900">
                Descarregue o Bilhete
              </h4>
              <p className="text-xs text-neutral-500">
                Receba o seu bilhete digital com código de 10 dígitos e QR Code para guardar em PDF ou imagem no telemóvel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECÇÃO 6: GALERIA DE DESTINOS */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-red-600 block mb-1">
              Paisagens & Património
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-neutral-900">
              Galeria de Destinos de Angola
            </h2>
          </div>
          <span className="text-xs text-neutral-500">
            Clique nas fotografias para ampliar em ecrã inteiro
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            onClick={() => setSelectedPhotoZoom('/src/assets/images/hero_ekumbi_train_1794439205262.jpg')}
            className="group relative rounded-2xl overflow-hidden h-48 cursor-pointer border border-neutral-200"
          >
            <img
              src="/src/assets/images/hero_ekumbi_train_1794439205262.jpg"
              alt="Comboio no pôr do sol"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center text-white opacity-0 group-hover:opacity-100">
              <Eye className="w-6 h-6" />
            </div>
          </div>

          <div
            onClick={() => setSelectedPhotoZoom('/src/assets/images/tourist_calandula_falls_1794439205229.jpg')}
            className="group relative rounded-2xl overflow-hidden h-48 cursor-pointer border border-neutral-200"
          >
            <img
              src="/src/assets/images/tourist_calandula_falls_1794439205229.jpg"
              alt="Quedas de Kalandula"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center text-white opacity-0 group-hover:opacity-100">
              <Eye className="w-6 h-6" />
            </div>
          </div>

          <div
            onClick={() => setSelectedPhotoZoom('/src/assets/images/tourist_miradouro_lua_1794439205816.jpg')}
            className="group relative rounded-2xl overflow-hidden h-48 cursor-pointer border border-neutral-200"
          >
            <img
              src="/src/assets/images/tourist_miradouro_lua_1794439205816.jpg"
              alt="Miradouro da Lua"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center text-white opacity-0 group-hover:opacity-100">
              <Eye className="w-6 h-6" />
            </div>
          </div>

          <div
            onClick={() => setSelectedPhotoZoom('/src/assets/images/train_luxury_interior_1794439205805.jpg')}
            className="group relative rounded-2xl overflow-hidden h-48 cursor-pointer border border-neutral-200"
          >
            <img
              src="/src/assets/images/train_luxury_interior_1794439205805.jpg"
              alt="Interior de 1ª classe"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center text-white opacity-0 group-hover:opacity-100">
              <Eye className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Lightbox Zoom */}
        {selectedPhotoZoom && (
          <div
            onClick={() => setSelectedPhotoZoom(null)}
            className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <img
              src={selectedPhotoZoom}
              alt="Fotografia ampliada de Angola"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECÇÃO 7: CONTACTOS E APOIO AO CLIENTE (+244 922 050 257) */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-neutral-900 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Linha Direta de Atendimento
            </span>
            <h3 className="font-display font-black text-2xl sm:text-3xl text-white">
              Precisa de Apoio com a sua Reserva?
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              A nossa equipa de apoio ao passageiro está disponível 7 dias por semana para esclarecer horários, auxiliar no pagamento e validar o seu bilhete de embarque.
            </p>
            <div className="flex items-center gap-6 text-xs text-neutral-300 pt-2 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-red-500" /> +244 922 050 257
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-amber-400" /> reservas@ekumbiexpress.ao
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" /> 05h00 às 22h30
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0">
            <a
              href="https://wa.me/244922050257?text=Ol%C3%A1%20EKUMBI%20EXPRESS!%20Gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20as%20viagens."
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp: +244 922 050 257</span>
            </a>

            <button
              onClick={() => onSearchTrips('todos', 'todos', date, 1, 'executiva')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Train className="w-4 h-4" />
              <span>Ver Todas as Viagens</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
