import React, { useState } from 'react';
import { X, MapPin, Compass, Image as ImageIcon, Sparkles, Navigation, ChevronRight, Landmark, Trees, Eye } from 'lucide-react';
import { TouristDestination, Trip } from '../types/index.ts';

interface TouristDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip?: Trip | null;
  destinations: TouristDestination[];
  onSelectTrip?: (trip: Trip) => void;
}

export const TouristDiscoveryModal: React.FC<TouristDiscoveryModalProps> = ({
  isOpen,
  onClose,
  trip,
  destinations,
  onSelectTrip
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'percurso' | 'atracoes' | 'galeria'>('percurso');

  if (!isOpen) return null;

  // Filter tourist spots relevant to this trip or show top curated Angolan highlights
  const relevantSpots = trip
    ? destinations.filter(d => 
        d.province.toLowerCase().includes(trip.originProvince.toLowerCase()) ||
        d.province.toLowerCase().includes(trip.destinationProvince.toLowerCase()) ||
        trip.stops.some(s => d.province.toLowerCase().includes(s.province.toLowerCase()))
      )
    : destinations;

  const displaySpots = relevantSpots.length > 0 ? relevantSpots : destinations;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 my-8">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-red-700 via-red-800 to-black p-6 sm:p-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">
            <Compass className="w-4 h-4" />
            <span>Guia Ferroviário Cultural & Geográfico</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-black text-white">
            DESCUBRA OS LUGARES POR ONDE VAI VIAJAR
          </h2>

          {trip ? (
            <p className="mt-2 text-sm text-neutral-200 font-medium flex items-center gap-2 flex-wrap">
              <span>{trip.originStation} ({trip.originProvince})</span>
              <span className="text-amber-400">➔</span>
              <span>{trip.destinationStation} ({trip.destinationProvince})</span>
              <span className="text-white/60">·</span>
              <span className="text-amber-300 font-bold">{trip.trainName}</span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-neutral-200">
              Conheça as belezas naturais, monumentos históricos e a cultura vibrante das terras por onde os comboios da EKUMBI EXPRESS passam.
            </p>
          )}

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 mt-6">
            <button
              onClick={() => setActiveTab('percurso')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'percurso'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Mapa do Percurso & Estações
            </button>
            <button
              onClick={() => setActiveTab('atracoes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'atracoes'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Pontos Turísticos & Cultura
            </button>
            <button
              onClick={() => setActiveTab('galeria')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'galeria'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Galeria Fotográfica
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto">
          {activeTab === 'percurso' && (
            <div className="space-y-8">
              {/* Interactive Route Map Track Graphic */}
              <div className="p-6 rounded-2xl bg-neutral-900 text-white border border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-red-500" />
                    <h3 className="font-display font-bold text-lg text-white">
                      Trajeto Ferroviário Selecionado
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
                    Caminhos de Ferro de Angola
                  </span>
                </div>

                {/* SVG Route Visualization */}
                <div className="py-6 overflow-x-auto">
                  <div className="min-w-[650px] relative flex items-center justify-between px-8">
                    {/* Track Line */}
                    <div className="absolute left-12 right-12 top-1/2 -translate-y-1/2 h-2.5 bg-neutral-800 rounded-full border border-neutral-700">
                      <div className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 rounded-full animate-pulse" />
                    </div>

                    {/* Origin Station */}
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full bg-red-600 border-4 border-neutral-900 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-red-600/50">
                        1
                      </div>
                      <span className="font-bold text-xs mt-2 text-white">
                        {trip ? trip.originStation.replace('Estação Central do ', '').replace('Estação de ', '') : 'Luanda (Bungo)'}
                      </span>
                      <span className="text-[11px] text-amber-400">Origem</span>
                    </div>

                    {/* Intermediate stops */}
                    {trip && trip.stops && trip.stops.length > 0 ? (
                      trip.stops.map((stop, idx) => (
                        <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                          <div className="w-8 h-8 rounded-full bg-neutral-800 border-3 border-amber-500 text-amber-300 flex items-center justify-center font-bold text-xs">
                            {idx + 2}
                          </div>
                          <span className="font-semibold text-xs mt-2 text-neutral-200">
                            {stop.stationName.replace('Estação Central de ', '').replace('Estação de ', '').replace('Estação do ', '')}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            {stop.arrivalTime || 'Paragem'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="relative z-10 flex flex-col items-center text-center">
                          <div className="w-8 h-8 rounded-full bg-neutral-800 border-2 border-neutral-600 text-neutral-300 flex items-center justify-center font-bold text-xs">
                            2
                          </div>
                          <span className="font-semibold text-xs mt-2 text-neutral-300">Dondo</span>
                          <span className="text-[10px] text-neutral-500">Rio Kwanza</span>
                        </div>
                        <div className="relative z-10 flex flex-col items-center text-center">
                          <div className="w-8 h-8 rounded-full bg-neutral-800 border-2 border-neutral-600 text-neutral-300 flex items-center justify-center font-bold text-xs">
                            3
                          </div>
                          <span className="font-semibold text-xs mt-2 text-neutral-300">Ndalatando</span>
                          <span className="text-[10px] text-neutral-500">Cuanza Norte</span>
                        </div>
                      </>
                    )}

                    {/* Destination Station */}
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full bg-amber-500 border-4 border-neutral-900 text-black flex items-center justify-center font-black text-xs shadow-lg shadow-amber-500/50">
                        🏁
                      </div>
                      <span className="font-bold text-xs mt-2 text-white">
                        {trip ? trip.destinationStation.replace('Estação Central de ', '').replace('Estação de ', '') : 'Malanje'}
                      </span>
                      <span className="text-[11px] text-amber-400">Destino Final</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-neutral-500 block">Tipo de Traçado:</span>
                    <span className="text-neutral-200 font-semibold">Linha de Bitola Africana (Cap) Totalmente Reabilitada</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Velocidade Máxima Comercial:</span>
                    <span className="text-neutral-200 font-semibold">120 km/h com Conforto Aerodinâmico</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Segurança Operacional:</span>
                    <span className="text-neutral-200 font-semibold">Sinalização Electrónica e Rastreio GPS</span>
                  </div>
                </div>
              </div>

              {/* Station Stops Detailed Timeline */}
              <div>
                <h4 className="font-display font-bold text-base text-neutral-900 mb-4">
                  Estações e Horários Intermédios do Percurso
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trip?.stops.map((stop, index) => (
                    <div key={index} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-red-100 text-red-700 shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-sm text-neutral-900">{stop.stationName}</h5>
                          <span className="text-[11px] font-semibold text-neutral-500">({stop.province})</span>
                        </div>
                        <p className="text-xs text-neutral-600 mt-1">
                          Chegada: <strong className="font-mono">{stop.arrivalTime}</strong> · Partida: <strong className="font-mono">{stop.departureTime}</strong>
                        </p>
                        {stop.touristSpot && (
                          <span className="inline-block mt-2 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            ✨ Destaque: {stop.touristSpot}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'atracoes' && (
            <div className="space-y-6">
              {displaySpots.map((spot) => (
                <div key={spot.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-2xl border border-neutral-200 bg-neutral-50">
                  <div className="md:col-span-5 h-56 md:h-full min-h-[220px] rounded-xl overflow-hidden relative group">
                    <img
                      src={spot.imageUrl}
                      alt={spot.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                      onClick={() => setSelectedImage(spot.imageUrl)}
                    />
                    <button
                      onClick={() => setSelectedImage(spot.imageUrl)}
                      className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/60 text-white backdrop-blur-xs hover:bg-black/80 transition-colors"
                      title="Ampliar fotografia"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <span className="absolute top-3 left-3 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-black/70 text-amber-300 backdrop-blur-xs">
                      {spot.province}
                    </span>
                  </div>

                  <div className="md:col-span-7 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                          {spot.category === 'natural' ? 'Património Natural' : 'Património Histórico'}
                        </span>
                        <span className="text-neutral-400">·</span>
                        <span className="text-xs text-neutral-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-neutral-400" />
                          Próximo da {spot.nearStationName}
                        </span>
                      </div>

                      <h4 className="font-display font-bold text-xl text-neutral-900 mb-2">
                        {spot.name}
                      </h4>

                      <p className="text-sm text-neutral-600 leading-relaxed mb-4">
                        {spot.fullDescription}
                      </p>

                      <div className="space-y-2 text-xs">
                        <div>
                          <strong className="text-neutral-900 block mb-1">Principais Pontos de Interesse:</strong>
                          <div className="flex flex-wrap gap-1.5">
                            {spot.mainAttractions.map((att, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-white border border-neutral-200 text-neutral-700">
                                {att}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2">
                          <strong className="text-neutral-900 block mb-0.5">Cultura & Tradição Local:</strong>
                          <p className="text-neutral-600 italic">{spot.localCulture}</p>
                        </div>

                        {spot.curiosities && spot.curiosities.length > 0 && (
                          <div className="pt-2">
                            <strong className="text-amber-800 block mb-0.5">Curiosidade:</strong>
                            <p className="text-neutral-600">{spot.curiosities[0]}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'galeria' && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {displaySpots.map((spot) => (
                  <div
                    key={spot.id}
                    onClick={() => setSelectedImage(spot.imageUrl)}
                    className="relative group rounded-2xl overflow-hidden cursor-pointer h-64 border border-neutral-200"
                  >
                    <img
                      src={spot.imageUrl}
                      alt={spot.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-white">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                        {spot.province}
                      </span>
                      <h5 className="font-display font-bold text-base">{spot.name}</h5>
                      <p className="text-xs text-neutral-300 line-clamp-1">{spot.shortDescription}</p>
                      <span className="text-[11px] text-amber-300 font-semibold mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-3.5 h-3.5" /> Clique para ampliar
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
          <p className="text-xs text-neutral-500">
            Todas as paisagens e referências geográficas correspondem a património e cidades reais de Angola.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              Fechar
            </button>
            {trip && onSelectTrip && (
              <button
                onClick={() => {
                  onSelectTrip(trip);
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                <span>Escolher Esta Viagem</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedImage}
            alt="Fotografia ampliada de Angola"
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
