import React, { useState, useEffect } from 'react';
import {
  Trip,
  TravelClass,
  Seat,
  Passenger,
  User
} from '../types/index.ts';
import {
  Train,
  Clock,
  Calendar,
  MapPin,
  Check,
  AlertCircle,
  Users,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  Info
} from 'lucide-react';

interface SeatSelectionPageProps {
  trip: Trip;
  travelClass: TravelClass;
  passengerCount: number;
  currentUser: User | null;
  onProceedToPayment: (bookingData: {
    tripId: string;
    travelClass: TravelClass;
    passengers: Passenger[];
    totalAmount: number;
  }) => void;
  onBack: () => void;
}

export const SeatSelectionPage: React.FC<SeatSelectionPageProps> = ({
  trip,
  travelClass: initialClass,
  passengerCount,
  currentUser,
  onProceedToPayment,
  onBack
}) => {
  const [selectedClass, setSelectedClass] = useState<TravelClass>(initialClass || 'executiva');
  const [selectedCarriageNum, setSelectedCarriageNum] = useState<number>(2);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [passengers, setPassengers] = useState<{
    fullName: string;
    biNumber: string;
    phone: string;
    email: string;
    seatId: string;
  }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize passengers based on passengerCount
  useEffect(() => {
    const list = [];
    for (let i = 0; i < passengerCount; i++) {
      list.push({
        fullName: i === 0 && currentUser ? currentUser.name : '',
        biNumber: i === 0 && currentUser?.biNumber ? currentUser.biNumber : '',
        phone: i === 0 && currentUser?.phone ? currentUser.phone : '+244 9',
        email: i === 0 && currentUser?.email ? currentUser.email : '',
        seatId: ''
      });
    }
    setPassengers(list);
  }, [passengerCount, currentUser]);

  // Fetch real-time seats for this trip
  useEffect(() => {
    fetchSeats();
  }, [trip.id]);

  const fetchSeats = async () => {
    try {
      setLoadingSeats(true);
      const res = await fetch(`/api/trips/${trip.id}/seats`);
      if (res.ok) {
        const data = await res.json();
        setSeats(data);
      }
    } catch (e) {
      console.error('Failed to load seats', e);
    } finally {
      setLoadingSeats(false);
    }
  };

  // Carriages list
  const carriages = [
    { num: 1, name: 'Carruagem 01', class: 'primeira' as TravelClass, label: 'Primeira Classe VIP' },
    { num: 2, name: 'Carruagem 02', class: 'executiva' as TravelClass, label: 'Classe Executiva Conforto' },
    { num: 3, name: 'Carruagem 03', class: 'turistica' as TravelClass, label: 'Classe Turística Standard' },
    { num: 4, name: 'Carruagem 04', class: 'turistica' as TravelClass, label: 'Classe Turística Panorâmica' }
  ];

  // Seats in current carriage
  const currentCarriageSeats = seats.filter(s => s.carriageNumber === selectedCarriageNum);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'ocupado' || seat.status === 'bloqueado') {
      return;
    }

    if (selectedSeats.includes(seat.id)) {
      // Deselect
      const newSelected = selectedSeats.filter(id => id !== seat.id);
      setSelectedSeats(newSelected);

      // Remove from passengers
      setPassengers(prev =>
        prev.map(p => (p.seatId === seat.id ? { ...p, seatId: '' } : p))
      );
      setErrorMsg(null);
    } else {
      // Check if limit reached
      if (selectedSeats.length >= passengerCount) {
        setErrorMsg(`Já selecionou os ${passengerCount} assentos necessários para esta reserva.`);
        return;
      }

      const newSelected = [...selectedSeats, seat.id];
      setSelectedSeats(newSelected);
      setErrorMsg(null);

      // Assign to first empty passenger slot
      setPassengers(prev => {
        let assigned = false;
        return prev.map(p => {
          if (!p.seatId && !assigned) {
            assigned = true;
            return { ...p, seatId: seat.id };
          }
          return p;
        });
      });
    }
  };

  const handlePassengerChange = (index: number, field: string, value: string) => {
    setPassengers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const classPrice = trip.prices[selectedClass] || 8500;
  const totalAmount = classPrice * passengerCount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSeats.length < passengerCount) {
      setErrorMsg(`Por favor, selecione exatamente ${passengerCount} assento(s) na carruagem.`);
      return;
    }

    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.fullName.trim() || !p.biNumber.trim()) {
        setErrorMsg(`Preencha o nome completo e o número do Bilhete de Identidade (BI) para o Passageiro ${i + 1}.`);
        return;
      }
    }

    const formattedPassengers: Passenger[] = passengers.map((p, idx) => {
      const seatObj = seats.find(s => s.id === p.seatId);
      return {
        id: `pass-${Date.now()}-${idx}`,
        fullName: p.fullName,
        biNumber: p.biNumber,
        phone: p.phone || currentUser?.phone || '',
        email: p.email || currentUser?.email || '',
        seatNumber: seatObj ? seatObj.seatNumber : '01',
        carriageNumber: seatObj ? seatObj.carriageNumber : selectedCarriageNum,
        travelClass: selectedClass,
        price: classPrice
      };
    });

    onProceedToPayment({
      tripId: trip.id,
      travelClass: selectedClass,
      passengers: formattedPassengers,
      totalAmount
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Banner / Trip Summary Bar */}
      <div className="mb-8 p-6 rounded-3xl bg-neutral-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 mb-2 flex items-center gap-1 cursor-pointer"
          >
            ← Voltar para a pesquisa de viagens
          </button>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
              Escolha de Carruagem e Assento
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white">
              {trip.trainName}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-neutral-300 mt-2 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              {trip.originStation} ➔ {trip.destinationStation}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              {trip.departureDate}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Partida: {trip.departureTime} | Chegada: {trip.arrivalTime}
            </span>
          </div>
        </div>

        {/* Temporary reservation lock notification */}
        <div className="p-3.5 rounded-2xl bg-white/10 border border-white/20 text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-bold mb-1">
            <Clock className="w-4 h-4 animate-spin" />
            <span>Bloqueio Temporário Ativo</span>
          </div>
          <p className="text-neutral-300 text-[11px] max-w-xs">
            Os assentos selecionados ficam reservados temporariamente por 15 minutos para conclusão do pagamento.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Airplane-style Train Seat Map (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Carriage Selector Tabs */}
          <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
              Selecione a Carruagem do Comboio
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {carriages.map(carr => (
                <button
                  key={carr.num}
                  type="button"
                  onClick={() => {
                    setSelectedCarriageNum(carr.num);
                    setSelectedClass(carr.class);
                  }}
                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                    selectedCarriageNum === carr.num
                      ? 'border-red-600 bg-red-50/70 text-red-900 ring-2 ring-red-600/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <div className="font-bold text-sm flex items-center justify-between">
                    <span>{carr.name}</span>
                    {selectedCarriageNum === carr.num && (
                      <span className="w-2 h-2 rounded-full bg-red-600" />
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-1 truncate">
                    {carr.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Seat Map Visualization Container */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between pb-6 border-b border-neutral-200 mb-6">
              <div>
                <h3 className="font-display font-bold text-lg text-neutral-900">
                  Planta de Lugares: Carruagem {selectedCarriageNum < 10 ? `0${selectedCarriageNum}` : selectedCarriageNum}
                </h3>
                <p className="text-xs text-neutral-500">
                  Disposição 2 + 2 com corredor central e janelas panorâmicas.
                </p>
              </div>

              {/* Legend matching prompt requirement */}
              <div className="flex items-center gap-3 text-xs flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md bg-emerald-500 border border-emerald-600" />
                  <span className="text-neutral-600 font-medium">Verde: Disponível</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md bg-red-500 border border-red-600" />
                  <span className="text-neutral-600 font-medium">Vermelho: Ocupado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md bg-amber-400 border border-amber-500" />
                  <span className="text-neutral-600 font-medium">Amarelo: Em Reserva</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md bg-blue-600 border border-blue-700 ring-2 ring-blue-300" />
                  <span className="text-blue-900 font-bold">Azul: Selecionado</span>
                </div>
              </div>
            </div>

            {/* Train Fuselage / Body Graphic */}
            <div className="relative max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-neutral-100 border-2 border-neutral-300 shadow-inner">
              {/* Train Head Indicator */}
              <div className="text-center pb-6 border-b border-dashed border-neutral-300 mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-neutral-200 text-neutral-600 text-xs font-bold">
                  <Train className="w-4 h-4 text-red-600" />
                  <span>Frente da Composicão / Sentido de Marcha</span>
                </div>
              </div>

              {/* Seats Grid */}
              {loadingSeats ? (
                <div className="py-12 text-center text-sm text-neutral-500">
                  A carregar mapa de assentos em tempo real...
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-3 sm:gap-4 items-center">
                  {/* We organize by groups of 4 seats: Seat 1, Seat 2, [AISLE], Seat 3, Seat 4 */}
                  {Array.from({ length: Math.ceil(currentCarriageSeats.length / 4) }).map((_, rowIndex) => {
                    const s1 = currentCarriageSeats[rowIndex * 4];
                    const s2 = currentCarriageSeats[rowIndex * 4 + 1];
                    const s3 = currentCarriageSeats[rowIndex * 4 + 2];
                    const s4 = currentCarriageSeats[rowIndex * 4 + 3];

                    const renderSeatButton = (seat?: Seat) => {
                      if (!seat) return <div className="w-12 h-12" />;

                      const isSelected = selectedSeats.includes(seat.id);
                      const isOccupied = seat.status === 'ocupado';
                      const isLocked = seat.status === 'bloqueado';

                      let btnStyle = 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-600 shadow-xs';
                      if (isOccupied) {
                        btnStyle = 'bg-red-500 text-white border-red-600 cursor-not-allowed opacity-80';
                      } else if (isLocked) {
                        btnStyle = 'bg-amber-400 text-slate-900 border-amber-500 cursor-not-allowed opacity-90';
                      } else if (isSelected) {
                        btnStyle = 'bg-blue-600 text-white border-blue-700 ring-4 ring-blue-300 shadow-md font-black scale-105';
                      }

                      return (
                        <button
                          key={seat.id}
                          type="button"
                          disabled={isOccupied || isLocked}
                          onClick={() => handleSeatClick(seat)}
                          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center font-bold text-xs transition-all border ${btnStyle} cursor-pointer`}
                          title={`Assento ${seat.seatNumber} (${isOccupied ? 'Ocupado' : isLocked ? 'Temporariamente Reservado' : isSelected ? 'Selecionado' : 'Disponível'})`}
                        >
                          <span className="text-[10px] font-normal opacity-80">A</span>
                          <span>{seat.seatNumber}</span>
                        </button>
                      );
                    };

                    return (
                      <React.Fragment key={rowIndex}>
                        {renderSeatButton(s1)}
                        {renderSeatButton(s2)}
                        {/* Corridor / Aisle */}
                        <div className="flex items-center justify-center text-[10px] font-mono text-neutral-400 select-none">
                          Fila {rowIndex + 1}
                        </div>
                        {renderSeatButton(s3)}
                        {renderSeatButton(s4)}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}

              {/* Train Back Indicator */}
              <div className="text-center pt-6 border-t border-dashed border-neutral-300 mt-6">
                <span className="text-xs text-neutral-400 font-medium">
                  Traseira da Carruagem · WC & Porta de Comunicação Inter-Carruagens
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Passenger Data Entry & Booking Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Passenger Forms */}
            <div className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-base text-neutral-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-red-600" />
                <span>Dados dos Passageiros ({passengerCount})</span>
              </h3>

              {passengers.map((passenger, index) => (
                <div key={index} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800">
                      Passageiro {index + 1} {index === 0 && '(Titular)'}
                    </span>
                    {passenger.seatId ? (
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Assento: {passenger.seatId}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Clique num assento verde
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={passenger.fullName}
                      onChange={e => handlePassengerChange(index, 'fullName', e.target.value)}
                      placeholder="Conforme Bilhete de Identidade"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Nº do Bilhete de Identidade (BI) *
                    </label>
                    <input
                      type="text"
                      required
                      value={passenger.biNumber}
                      onChange={e => handlePassengerChange(index, 'biNumber', e.target.value)}
                      placeholder="Ex: 008472918LA042"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 bg-white uppercase font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                        Telefone
                      </label>
                      <input
                        type="text"
                        value={passenger.phone}
                        onChange={e => handlePassengerChange(index, 'phone', e.target.value)}
                        placeholder="+244 9..."
                        className="w-full px-2.5 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={passenger.email}
                        onChange={e => handlePassengerChange(index, 'email', e.target.value)}
                        placeholder="email@exemplo.ao"
                        className="w-full px-2.5 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Section 9: Booking Summary (Resumo da Reserva) */}
            <div className="p-6 rounded-3xl bg-neutral-900 text-white shadow-xl space-y-4">
              <h3 className="font-display font-bold text-lg text-white border-b border-neutral-800 pb-3">
                Resumo da Reserva
              </h3>

              <div className="space-y-2 text-xs text-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Origem:</span>
                  <span className="font-semibold text-white">{trip.originStation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Destino:</span>
                  <span className="font-semibold text-white">{trip.destinationStation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Data da Viagem:</span>
                  <span className="font-semibold text-white">{trip.departureDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Partida / Chegada:</span>
                  <span className="font-semibold text-white">{trip.departureTime} ➔ {trip.arrivalTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Carruagem:</span>
                  <span className="font-semibold text-amber-300">Carruagem {selectedCarriageNum < 10 ? `0${selectedCarriageNum}` : selectedCarriageNum}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Assentos:</span>
                  <span className="font-mono font-bold text-blue-400">
                    {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Nenhum selecionado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Classe Escolhida:</span>
                  <span className="font-semibold text-white uppercase">{selectedClass}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Preço Individual:</span>
                  <span className="font-mono text-white">{classPrice.toLocaleString('pt-AO')} Kz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Qtd. Passageiros:</span>
                  <span className="font-semibold text-white">{passengerCount}</span>
                </div>

                <div className="pt-3 border-t border-neutral-800 flex justify-between items-center text-sm">
                  <span className="font-bold text-white">Valor Total:</span>
                  <span className="font-mono font-black text-xl text-amber-400">
                    {totalAmount.toLocaleString('pt-AO')} Kz
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>CONFIRMAR E CONTINUAR PARA PAGAMENTO</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-400 text-center pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reserva segura com garantia de assento individual</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
