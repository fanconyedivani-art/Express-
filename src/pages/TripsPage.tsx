import React, { useState } from 'react';
import { Trip, TravelClass } from '../types/index.ts';
import {
  Train,
  MapPin,
  Calendar,
  Clock,
  Compass,
  ChevronRight,
  Filter,
  CheckCircle,
  Users
} from 'lucide-react';

interface TripsPageProps {
  trips: Trip[];
  onSelectTrip: (trip: Trip) => void;
  onOpenTouristDiscovery: (trip?: Trip) => void;
  initialFilters?: {
    origin: string;
    destination: string;
    date: string;
    passengers: number;
    travelClass: TravelClass;
  };
}

export const TripsPage: React.FC<TripsPageProps> = ({
  trips,
  onSelectTrip,
  onOpenTouristDiscovery,
  initialFilters
}) => {
  const [originFilter, setOriginFilter] = useState(initialFilters?.origin || 'todos');
  const [destFilter, setDestFilter] = useState(initialFilters?.destination || 'todos');
  const [selectedClass, setSelectedClass] = useState<TravelClass>(initialFilters?.travelClass || 'executiva');

  const filteredTrips = trips.filter(t => {
    if (originFilter !== 'todos' && !t.originStation.toLowerCase().includes(originFilter.toLowerCase())) {
      return false;
    }
    if (destFilter !== 'todos' && !t.destinationStation.toLowerCase().includes(destFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-red-600 block mb-1">
            Corredores Ferroviários em Operação
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-neutral-900">
            Pesquisa de Viagens & Horários Oficiais
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Escolha o comboio, verifique os assentos disponíveis e conheça as localidades por onde vai viajar.
          </p>
        </div>

        <button
          onClick={() => onOpenTouristDiscovery()}
          className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm w-fit"
        >
          <Compass className="w-4 h-4 text-amber-400" />
          <span>Ver Mapa Turístico do Percurso</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
            Filtrar por Estação de Origem
          </label>
          <select
            value={originFilter}
            onChange={e => setOriginFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-neutral-300 bg-neutral-50"
          >
            <option value="todos">Todas as Estações de Origem</option>
            <option value="Bungo">Estação Central do Bungo (Luanda)</option>
            <option value="Malanje">Estação Central de Malanje</option>
            <option value="Lobito">Estação do Lobito</option>
            <option value="Moçâmedes">Estação de Moçâmedes (Namibe)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
            Filtrar por Estação de Destino
          </label>
          <select
            value={destFilter}
            onChange={e => setDestFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-neutral-300 bg-neutral-50"
          >
            <option value="todos">Todos os Destinos</option>
            <option value="Malanje">Malanje</option>
            <option value="Bungo">Luanda (Bungo)</option>
            <option value="Huambo">Huambo</option>
            <option value="Lubango">Lubango</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
            Filtrar por Classe de Viagem
          </label>
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl">
            <button
              onClick={() => setSelectedClass('turistica')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedClass === 'turistica' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Turística
            </button>
            <button
              onClick={() => setSelectedClass('executiva')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedClass === 'executiva' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Executiva
            </button>
            <button
              onClick={() => setSelectedClass('primeira')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedClass === 'primeira' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              1ª VIP
            </button>
          </div>
        </div>
      </div>

      {/* Trips List */}
      <div className="space-y-4">
        {filteredTrips.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200">
            <Train className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="font-display font-bold text-lg text-neutral-800">
              Nenhuma viagem localizada para os filtros selecionados
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
              Tente selecionar "Todas as Estações de Origem" e "Todos os Destinos" para visualizar a grelha completa de horários.
            </p>
            <button
              onClick={() => {
                setOriginFilter('todos');
                setDestFilter('todos');
              }}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          filteredTrips.map(trip => (
            <div
              key={trip.id}
              className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs hover:border-red-400 hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-xs text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                    {trip.trainName}
                  </span>
                  <span className="text-xs font-mono text-neutral-500 font-semibold">
                    {trip.departureDate}
                  </span>
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                    {trip.availableSeats} assentos disponíveis
                  </span>
                </div>

                <div className="flex items-center gap-6 py-1">
                  <div>
                    <span className="font-mono text-2xl font-black text-neutral-900 block">
                      {trip.departureTime}
                    </span>
                    <span className="text-xs font-bold text-neutral-800">
                      {trip.originStation}
                    </span>
                    <span className="text-[10px] text-neutral-400 block">({trip.originProvince})</span>
                  </div>

                  <div className="flex flex-col items-center px-4">
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {trip.estimatedDuration}
                    </span>
                    <div className="w-24 sm:w-36 flex items-center my-1">
                      <div className="w-2 h-2 rounded-full bg-red-600" />
                      <div className="flex-1 h-0.5 bg-neutral-200" />
                      <Train className="w-4 h-4 text-red-600 mx-1" />
                      <div className="flex-1 h-0.5 bg-neutral-200" />
                      <div className="w-2 h-2 rounded-full bg-neutral-900" />
                    </div>
                    <span className="text-[10px] text-neutral-500">
                      {trip.stops.length} paragens intermédias
                    </span>
                  </div>

                  <div>
                    <span className="font-mono text-2xl font-black text-neutral-900 block">
                      {trip.arrivalTime}
                    </span>
                    <span className="text-xs font-bold text-neutral-800">
                      {trip.destinationStation}
                    </span>
                    <span className="text-[10px] text-neutral-400 block">({trip.destinationProvince})</span>
                  </div>
                </div>

                {/* Stops row */}
                <div className="text-xs text-neutral-500 pt-2 border-t border-neutral-100 flex items-center gap-2 flex-wrap">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="font-semibold text-neutral-700">Paragens:</span>
                  {trip.stops.map((s, i) => (
                    <span key={i} className="text-[11px] text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                      {s.stationName.replace('Estação de ', '').replace('Estação do ', '')} ({s.arrivalTime})
                    </span>
                  ))}
                </div>
              </div>

              {/* Price & CTA */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-between gap-4 shrink-0 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-neutral-100">
                <div className="text-left sm:text-right lg:text-right">
                  <span className="text-[10px] text-neutral-400 uppercase block">
                    Classe {selectedClass}
                  </span>
                  <span className="font-mono font-black text-2xl text-neutral-900">
                    {(trip.prices[selectedClass] || 8500).toLocaleString('pt-AO')} Kz
                  </span>
                  <span className="text-[10px] text-neutral-400 block">Por passageiro</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => onOpenTouristDiscovery(trip)}
                    className="px-3 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-100 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Descobrir Rota
                  </button>

                  <button
                    onClick={() => onSelectTrip(trip)}
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs font-bold transition-all shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <span>ESCOLHER ESTA VIAGEM</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
