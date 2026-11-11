import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Ticket } from '../types/index.ts';
import { EkumbiLogo } from './EkumbiLogo.tsx';
import {
  X,
  Download,
  FileText,
  Image as ImageIcon,
  Train,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle,
  Copy,
  Printer
} from 'lucide-react';

interface TicketViewModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TicketViewModal: React.FC<TicketViewModalProps> = ({
  ticket,
  isOpen,
  onClose
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ticket) {
      QRCode.toDataURL(ticket.qrToken || `EKUMBI:${ticket.numericCode}`, {
        width: 240,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('QR code error', err));
    }
  }, [ticket]);

  if (!isOpen || !ticket) return null;

  const downloadAsImage = async () => {
    if (!ticketRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const image = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = image;
      a.download = `Bilhete_EKUMBI_${ticket.numericCode}.png`;
      a.click();
    } catch (err) {
      console.error('Error generating image', err);
      alert('Erro ao gerar imagem do bilhete.');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadAsPdf = async () => {
    if (!ticketRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 190;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, 'JPEG', 10, 15, imgWidth, imgHeight);
      pdf.save(`Bilhete_EKUMBI_${ticket.numericCode}.pdf`);
    } catch (err) {
      console.error('Error generating PDF', err);
      alert('Erro ao gerar ficheiro PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-3xl bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden border border-neutral-700 my-8 text-neutral-100">
        {/* Top Controls Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-display font-bold text-sm sm:text-base text-white">
              Bilhete Digital Oficial Emitido
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={downloadAsPdf}
              disabled={isExporting}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>DESCARREGAR EM PDF</span>
            </button>

            <button
              onClick={downloadAsImage}
              disabled={isExporting}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-all border border-neutral-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>DESCARREGAR COMO IMAGEM</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable/Exportable Ticket Area */}
        <div className="p-4 sm:p-8 bg-neutral-900/60 flex justify-center">
          <div
            ref={ticketRef}
            className="w-full max-w-2xl bg-white text-neutral-900 rounded-3xl shadow-2xl overflow-hidden border-2 border-neutral-200 select-text"
          >
            {/* Top Red Header Strip */}
            <div className="bg-gradient-to-r from-red-700 via-red-800 to-black text-white p-6 sm:p-8 relative">
              <div className="flex items-start justify-between gap-4">
                <EkumbiLogo size="md" light={true} />
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 block">
                    BILHETE DE EMBARQUE FERROVIÁRIO
                  </span>
                  <span className="font-mono text-xl sm:text-2xl font-black text-white tracking-widest block mt-0.5">
                    {ticket.numericCode}
                  </span>
                  <span className="text-[10px] text-neutral-300">
                    CÓDIGO NUMÉRICO DE 10 DÍGITOS
                  </span>
                </div>
              </div>
            </div>

            {/* Ticket Main Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Route banner */}
              <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
                <div>
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Origem da Viagem
                  </span>
                  <h3 className="font-display font-extrabold text-lg sm:text-xl text-neutral-900">
                    {ticket.originStation}
                  </h3>
                  <span className="text-xs text-neutral-500 font-mono mt-0.5 block">
                    Partida: <strong>{ticket.departureTime}</strong>
                  </span>
                </div>

                <div className="flex flex-col items-center px-4">
                  <div className="w-24 sm:w-32 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-600" />
                    <div className="flex-1 h-0.5 bg-dashed bg-neutral-300 border-t border-neutral-300" />
                    <Train className="w-4 h-4 text-red-600 mx-1" />
                    <div className="flex-1 h-0.5 bg-dashed bg-neutral-300 border-t border-neutral-300" />
                    <div className="w-2 h-2 rounded-full bg-black" />
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-1 uppercase font-semibold">
                    {ticket.travelDate}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Destino Final
                  </span>
                  <h3 className="font-display font-extrabold text-lg sm:text-xl text-neutral-900">
                    {ticket.destinationStation}
                  </h3>
                  <span className="text-xs text-neutral-500 font-mono mt-0.5 block">
                    Chegada: <strong>{ticket.arrivalTime}</strong>
                  </span>
                </div>
              </div>

              {/* Passenger & Seating Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs">
                <div>
                  <span className="text-neutral-500 block mb-0.5">Passageiro:</span>
                  <span className="font-bold text-neutral-900 block truncate text-sm">
                    {ticket.passengerName}
                  </span>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    BI: {ticket.passengerBi}
                  </span>
                </div>

                <div>
                  <span className="text-neutral-500 block mb-0.5">Carruagem:</span>
                  <span className="font-display font-extrabold text-lg text-red-600 block">
                    Nº {ticket.carriageNumber < 10 ? `0${ticket.carriageNumber}` : ticket.carriageNumber}
                  </span>
                  <span className="text-[11px] text-neutral-500 uppercase font-semibold">
                    Classe {ticket.travelClass}
                  </span>
                </div>

                <div>
                  <span className="text-neutral-500 block mb-0.5">Assento Reservado:</span>
                  <span className="font-display font-black text-2xl text-neutral-900 block font-mono">
                    {ticket.seatNumber}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                    Lugar Garantido
                  </span>
                </div>

                <div>
                  <span className="text-neutral-500 block mb-0.5">Composição / Comboio:</span>
                  <span className="font-bold text-neutral-900 block truncate">
                    {ticket.trainName}
                  </span>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    Tarifa: {ticket.amountPaid.toLocaleString('pt-AO')} Kz
                  </span>
                </div>
              </div>

              {/* Bottom Strip: QR Code & Validation instructions */}
              <div className="pt-4 border-t-2 border-dashed border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-xl bg-white border border-neutral-300 shadow-xs shrink-0">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="QR Code do Bilhete"
                        className="w-24 h-24 sm:w-28 sm:h-28"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-neutral-100 animate-pulse" />
                    )}
                  </div>

                  <div className="text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                      Validação Electrónica de Bordo
                    </span>
                    <p className="text-neutral-600 max-w-xs text-[11px] leading-relaxed">
                      Apresente este bilhete impresso ou no ecrã do seu telemóvel ao fiscal no momento do embarque. Válido apenas para uma utilização.
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                        Estado: {ticket.status}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        Emitido em: {new Date(ticket.issuedAt).toLocaleDateString('pt-AO')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-xs font-bold text-neutral-400 block">
                    REF: {ticket.numericCode}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    EKUMBI EXPRESS S.A. · Luanda, Angola
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-4 sm:p-6 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <span>
            Pode aceder e descarregar este bilhete a qualquer momento na secção <strong>Minha Conta</strong>.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
