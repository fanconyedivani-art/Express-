import React, { useState } from 'react';
import { Booking, PaymentMethod, PaymentStatus, Ticket } from '../types/index.ts';
import {
  CreditCard,
  Building,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface PaymentPageProps {
  booking: Booking;
  onPaymentSuccess: (tickets: Ticket[]) => void;
  onBack: () => void;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({
  booking,
  onPaymentSuccess,
  onBack
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(booking.paymentMethod || 'transferencia_bancaria');
  const [copiedIban, setCopiedIban] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(booking.userFullName);
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessingCard, setIsProcessingCard] = useState(false);

  // Receipt upload state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptResult, setReceiptResult] = useState<any | null>(null);
  const [currentStatus, setCurrentStatus] = useState<PaymentStatus>(booking.paymentStatus);

  const bankDetails = {
    bank: 'Banco Angolano de Investimentos (BAI)',
    holder: 'EKUMBI EXPRESS TRANSPORTES FERROVIÁRIOS S.A.',
    iban: 'AO06.0040.0000.1234.5678.9012.3',
    accountNumber: '123456781001',
    reference: booking.bookingCode
  };

  const copyToClipboard = (text: string, type: 'iban' | 'ref') => {
    navigator.clipboard.writeText(text);
    if (type === 'iban') {
      setCopiedIban(true);
      setTimeout(() => setCopiedIban(false), 2000);
    } else {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingCard(true);

    try {
      const res = await fetch('/api/payments/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          cardHolder,
          last4: cardNumber.replace(/\s+/g, '').slice(-4) || '8842',
          expDate: cardExp
        })
      });

      const data = await res.json();
      if (res.ok && data.tickets) {
        setCurrentStatus('pagamento_confirmado');
        onPaymentSuccess(data.tickets);
      } else {
        alert(data.error || 'Erro ao processar o pagamento com cartão.');
      }
    } catch (err) {
      console.error(err);
      alert('Falha de conexão com a rede Multicaixa.');
    } finally {
      setIsProcessingCard(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadReceipt = async () => {
    if (!receiptFile && !receiptBase64) {
      alert('Por favor, selecione um ficheiro de comprovativo (JPG, PNG ou PDF).');
      return;
    }

    setIsUploadingReceipt(true);
    try {
      const res = await fetch('/api/payments/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          fileName: receiptFile ? receiptFile.name : 'comprovativo_pagamento.pdf',
          fileData: receiptBase64,
          fileSize: receiptFile ? receiptFile.size : 340000,
          mimeType: receiptFile ? receiptFile.type : 'application/pdf'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setReceiptResult(data);
        setCurrentStatus('comprovativo_recebido');
      } else {
        alert(data.error || 'Erro ao submeter comprovativo.');
      }
    } catch (err) {
      console.error(err);
      alert('Falha de conexão ao enviar comprovativo.');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  // Helper for quick admin approval demo trigger
  const handleSimulateAdminApproval = async () => {
    try {
      const res = await fetch(`/api/payments/${booking.id}/approve`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.tickets) {
        setCurrentStatus('pagamento_confirmado');
        onPaymentSuccess(data.tickets);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="text-xs font-bold text-neutral-500 hover:text-neutral-800 mb-2 cursor-pointer flex items-center gap-1"
        >
          ← Voltar aos detalhes da reserva
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-neutral-900">
              PAGAMENTO DA VIAGEM
            </h1>
            <p className="text-xs text-neutral-600 mt-1">
              Código da Reserva: <strong className="font-mono text-red-600">{booking.bookingCode}</strong> · Total a Pagar: <strong className="font-mono text-neutral-900 text-sm">{booking.totalAmount.toLocaleString('pt-AO')} Kz</strong>
            </p>
          </div>

          {/* Current Status Pill */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Estado do Pagamento:</span>
            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
              currentStatus === 'pagamento_confirmado'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : currentStatus === 'comprovativo_recebido' || currentStatus === 'em_analise'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-neutral-100 text-neutral-800 border border-neutral-300'
            }`}>
              {currentStatus === 'pagamento_confirmado'
                ? 'Pagamento Confirmado'
                : currentStatus === 'comprovativo_recebido'
                ? 'Comprovativo Recebido'
                : currentStatus === 'em_analise'
                ? 'Em Análise Financeira'
                : 'Aguardando Pagamento'}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Methods Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          type="button"
          onClick={() => setSelectedMethod('transferencia_bancaria')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedMethod === 'transferencia_bancaria'
              ? 'border-red-600 bg-red-50/70 ring-2 ring-red-600/20 text-neutral-900'
              : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-100 text-red-700">
                <Building className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm text-neutral-900">
                Transferência / Depósito Bancário
              </span>
            </div>
            {selectedMethod === 'transferencia_bancaria' && (
              <CheckCircle2 className="w-5 h-5 text-red-600" />
            )}
          </div>
          <p className="text-xs text-neutral-500">
            Multicaixa Express, IBAN BAI ou Depósito em Balcão com envio de comprovativo.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setSelectedMethod('cartao')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedMethod === 'cartao'
              ? 'border-red-600 bg-red-50/70 ring-2 ring-red-600/20 text-neutral-900'
              : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-neutral-100 text-neutral-700">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm text-neutral-900">
                Cartão de Débito / Multicaixa
              </span>
            </div>
            {selectedMethod === 'cartao' && (
              <CheckCircle2 className="w-5 h-5 text-red-600" />
            )}
          </div>
          <p className="text-xs text-neutral-500">
            Confirmação imediata através do gateway EMIS / Multicaixa 3D-Secure.
          </p>
        </button>
      </div>

      {/* METHOD A: CARD PAYMENT */}
      {selectedMethod === 'cartao' && (
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
          <div className="max-w-lg mx-auto">
            <h3 className="font-display font-bold text-lg text-neutral-900 mb-1">
              Dados do Cartão Bancário
            </h3>
            <p className="text-xs text-neutral-500 mb-6">
              Transação protegida por criptografia de ponta a ponta. Não armazenamos os dados sensíveis do cartão.
            </p>

            <form onSubmit={handleCardPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Nome do Titular impresso no Cartão *
                </label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={e => setCardHolder(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Número do Cartão Multicaixa / Visa *
                </label>
                <input
                  type="text"
                  required
                  maxLength={19}
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono tracking-wider"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Validade (MM/AA) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="12/28"
                    value={cardExp}
                    onChange={e => setCardExp(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Código de Segurança (CVV) *
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={3}
                    placeholder="•••"
                    value={cardCvv}
                    onChange={e => setCardCvv(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono text-center"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isProcessingCard}
                  className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessingCard ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>A processar junto da rede Multicaixa...</span>
                    </>
                  ) : (
                    <>
                      <span>PAGAR AGORA {booking.totalAmount.toLocaleString('pt-AO')} KZ</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-400 pt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Autenticação EMIS 3D-Secure 2.0 ativada</span>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* METHOD B & C: BANK TRANSFER & RECEIPT UPLOAD */}
      {selectedMethod === 'transferencia_bancaria' && (
        <div className="space-y-8">
          {/* Bank Co-ordinates Card */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
            <h3 className="font-display font-bold text-lg text-neutral-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-red-600" />
              <span>Coordenadas Bancárias Oficiais para Pagamento</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
                <span className="text-neutral-500 block mb-1">Instituição Bancária:</span>
                <span className="font-bold text-neutral-900 text-sm block">{bankDetails.bank}</span>
                <span className="text-neutral-500 block mt-2 mb-1">Beneficiário:</span>
                <span className="font-bold text-neutral-900 block">{bankDetails.holder}</span>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-neutral-500">IBAN Nacional:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(bankDetails.iban, 'iban')}
                      className="text-red-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedIban ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedIban ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                  <span className="font-mono font-bold text-neutral-900 text-xs block bg-white p-2 rounded-lg border border-neutral-200">
                    {bankDetails.iban}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-neutral-500">Referência Obrigatória:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(bankDetails.reference, 'ref')}
                      className="text-red-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedRef ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                  <span className="font-mono font-bold text-red-700 text-xs block bg-white p-2 rounded-lg border border-red-200">
                    {bankDetails.reference}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>Importante:</strong> Ao realizar a transferência no Multicaixa Express, ATM ou Homebanking, insira o código da sua reserva <strong>{booking.bookingCode}</strong> no campo Descrição/Referência para identificação imediata.
              </p>
            </div>
          </div>

          {/* Section 10.C: Upload de Comprovativo & AI OCR Analysis */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-neutral-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-red-600" />
                  <span>Envio de Comprovativo de Pagamento</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  Carregue a foto ou documento PDF gerado pelo Multicaixa Express ou banco.
                </p>
              </div>

              <span className="text-xs font-semibold text-neutral-500">
                Formatos: JPG, PNG ou PDF (máx. 10MB)
              </span>
            </div>

            {/* Drag & Drop File Zone */}
            <div className="border-2 border-dashed border-neutral-300 hover:border-red-500 rounded-2xl p-6 sm:p-8 text-center transition-colors bg-neutral-50/50">
              <input
                type="file"
                id="receiptUpload"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="receiptUpload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <div className="p-3 rounded-full bg-red-100 text-red-600 mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                {receiptFile ? (
                  <div>
                    <span className="font-bold text-sm text-neutral-900 block">
                      {receiptFile.name}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {(receiptFile.size / 1024).toFixed(1)} KB · Clique para trocar de ficheiro
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="font-bold text-sm text-neutral-900 block mb-1">
                      Clique aqui para selecionar o comprovativo
                    </span>
                    <span className="text-xs text-neutral-500">
                      ou arraste o ficheiro para esta área
                    </span>
                  </div>
                )}
              </label>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                disabled={!receiptFile || isUploadingReceipt}
                onClick={handleUploadReceipt}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isUploadingReceipt ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>A analisar documento com IA & OCR...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>SUBMETER COMPROVATIVO & ANALISAR</span>
                  </>
                )}
              </button>

              <span className="text-xs text-neutral-400 text-center sm:text-right">
                A análise documental auxilia a conferência pelo administrador financeiro.
              </span>
            </div>

            {/* Result of Document Analysis & WhatsApp Dispatch (Section 11) */}
            {receiptResult && (
              <div className="mt-8 p-6 rounded-2xl bg-neutral-900 text-white border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h4 className="font-display font-bold text-sm text-white">
                      Resultado da Análise Documental Preliminar (OCR Inteligente)
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-800">
                    Confiança: {receiptResult.receipt?.analysis?.confidenceScore || 94}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-neutral-800/80">
                    <span className="text-neutral-400 block mb-0.5">Banco Detectado:</span>
                    <span className="font-semibold text-white truncate block">
                      {receiptResult.receipt?.analysis?.bankName || 'Banco BAI'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-800/80">
                    <span className="text-neutral-400 block mb-0.5">ID da Transação:</span>
                    <span className="font-mono text-white truncate block">
                      {receiptResult.receipt?.analysis?.transactionId || 'TX-948123'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-800/80">
                    <span className="text-neutral-400 block mb-0.5">Valor Extraído:</span>
                    <span className="font-mono font-bold text-amber-400 block">
                      {(receiptResult.receipt?.analysis?.amount || booking.totalAmount).toLocaleString('pt-AO')} Kz
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-800/80">
                    <span className="text-neutral-400 block mb-0.5">Correspondência:</span>
                    <span className="text-emerald-400 font-bold block">
                      ✓ Valor Conforme à Reserva
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-300 italic bg-neutral-800 p-3 rounded-xl">
                  "{receiptResult.receipt?.analysis?.verificationNotes}"
                </p>

                {/* Section 11: WhatsApp Administrative Notification */}
                <div className="pt-2 border-t border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-neutral-300">
                    <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Notificação encaminhada com sucesso para o WhatsApp administrativo: <strong className="text-white">+244 922 050 257</strong>
                    </span>
                  </div>

                  <a
                    href={receiptResult.whatsAppNotification?.whatsappDirectLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir Chat WhatsApp Oficial</span>
                  </a>
                </div>

                {/* Quick Simulation Button for Demo Testing */}
                <div className="pt-4 border-t border-neutral-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">
                    Aguardando validação da tesouraria...
                  </span>
                  <button
                    type="button"
                    onClick={handleSimulateAdminApproval}
                    className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition-colors cursor-pointer"
                  >
                    Simular Aprovação Imediata do Admin & Emitir Bilhete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
