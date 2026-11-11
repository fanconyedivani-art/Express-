import React, { useState } from 'react';
import { Bell, AlertTriangle, Clock, MapPin, Radio, CheckCircle, X, ChevronRight } from 'lucide-react';
import { SystemNotification } from '../types/index.ts';

interface TravelAlertsBannerProps {
  notifications: SystemNotification[];
  onOpenNotifications: () => void;
  onDismiss?: (id: string) => void;
}

export const TravelAlertsBanner: React.FC<TravelAlertsBannerProps> = ({
  notifications,
  onOpenNotifications,
  onDismiss
}) => {
  const [closedIds, setClosedIds] = useState<Set<string>>(new Set());

  // Filter urgent travel alerts (embarque, atraso, alteração)
  const travelAlerts = notifications.filter(
    n => !closedIds.has(n.id) && (n.type === 'urgente' || n.type === 'aviso' || n.title.toLowerCase().includes('viagem') || n.title.toLowerCase().includes('embarque') || n.title.toLowerCase().includes('alerta'))
  );

  if (travelAlerts.length === 0) return null;

  const currentAlert = travelAlerts[0];

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setClosedIds(prev => new Set(prev).add(currentAlert.id));
    if (onDismiss) onDismiss(currentAlert.id);
  };

  const isUrgent = currentAlert.type === 'urgente' || currentAlert.title.toLowerCase().includes('embarque');

  return (
    <div
      onClick={onOpenNotifications}
      className={`cursor-pointer transition-all border-b px-4 py-2.5 text-sm ${
        isUrgent
          ? 'bg-red-600 text-white border-red-700 shadow-sm'
          : 'bg-amber-500 text-slate-950 border-amber-600'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`p-1.5 rounded-lg shrink-0 ${isUrgent ? 'bg-white/20' : 'bg-black/10'}`}>
            {isUrgent ? (
              <Radio className="w-4 h-4 animate-pulse" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
          </div>
          
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold uppercase tracking-wider text-xs px-2 py-0.5 rounded bg-black/20 shrink-0">
              {isUrgent ? 'COMUNICADO DE EMBARQUE' : 'ALERTA DE VIAGEM'}
            </span>
            <span className="font-semibold truncate">{currentAlert.title}:</span>
            <span className="truncate opacity-95">{currentAlert.message}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden md:inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2">
            Ver detalhes da viagem <ChevronRight className="w-3.5 h-3.5" />
          </span>
          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-black/10 transition-colors"
            title="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
