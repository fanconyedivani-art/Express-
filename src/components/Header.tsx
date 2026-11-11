import React, { useState } from 'react';
import { EkumbiLogo } from './EkumbiLogo.tsx';
import {
  Menu,
  X,
  User as UserIcon,
  Bell,
  Ticket,
  Shield,
  Compass,
  Train,
  LogOut,
  PhoneCall,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { User, SystemNotification } from '../types/index.ts';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSwitchRole: (role: 'cliente' | 'admin' | 'validador') => void;
  notifications: SystemNotification[];
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onOpenAuth,
  onLogout,
  onSwitchRole,
  notifications,
  onOpenNotifications
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNavClick = (tab: string) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand Zone: 1-line wordmark & logo */}
          <div
            onClick={() => handleNavClick('inicio')}
            className="cursor-pointer shrink-0"
          >
            <EkumbiLogo size="md" />
          </div>

          {/* Nav Links Zone: Clean single-line links */}
          <nav className="hidden xl:flex items-center gap-7 text-sm font-semibold text-neutral-700">
            <button
              onClick={() => handleNavClick('inicio')}
              className={`hover:text-red-600 transition-colors whitespace-nowrap cursor-pointer ${
                currentTab === 'inicio' ? 'text-red-600 border-b-2 border-red-600 pb-0.5' : ''
              }`}
            >
              Início
            </button>
            <button
              onClick={() => handleNavClick('destinos')}
              className={`hover:text-red-600 transition-colors whitespace-nowrap cursor-pointer ${
                currentTab === 'destinos' ? 'text-red-600 border-b-2 border-red-600 pb-0.5' : ''
              }`}
            >
              Destinos
            </button>
            <button
              onClick={() => handleNavClick('viagens')}
              className={`hover:text-red-600 transition-colors whitespace-nowrap cursor-pointer ${
                currentTab === 'viagens' ? 'text-red-600 border-b-2 border-red-600 pb-0.5' : ''
              }`}
            >
              Viagens
            </button>
            <button
              onClick={() => handleNavClick('bilhetes')}
              className={`hover:text-red-600 transition-colors whitespace-nowrap cursor-pointer ${
                currentTab === 'bilhetes' ? 'text-red-600 border-b-2 border-red-600 pb-0.5' : ''
              }`}
            >
              Bilhetes
            </button>
            <button
              onClick={() => handleNavClick('turismo')}
              className={`hover:text-red-600 transition-colors whitespace-nowrap cursor-pointer ${
                currentTab === 'turismo' ? 'text-red-600 border-b-2 border-red-600 pb-0.5' : ''
              }`}
            >
              Experiências Turísticas
            </button>
            <button
              onClick={() => handleNavClick('sobre')}
              className={`hover:text-red-600 transition-colors whitespace-nowrap cursor-pointer ${
                currentTab === 'sobre' ? 'text-red-600 border-b-2 border-red-600 pb-0.5' : ''
              }`}
            >
              Sobre Nós
            </button>
            <button
              onClick={() => handleNavClick('contactos')}
              className={`hover:text-red-600 transition-colors whitespace-nowrap cursor-pointer ${
                currentTab === 'contactos' ? 'text-red-600 border-b-2 border-red-600 pb-0.5' : ''
              }`}
            >
              Contactos
            </button>

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => handleNavClick('admin')}
                className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-black text-amber-400 hover:bg-neutral-800 transition-colors whitespace-nowrap cursor-pointer ${
                  currentTab === 'admin' ? 'ring-2 ring-red-600' : ''
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Painel Admin
              </button>
            )}

            {currentUser?.role === 'validador' && (
              <button
                onClick={() => handleNavClick('validacao')}
                className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-red-700 text-white hover:bg-red-800 transition-colors whitespace-nowrap cursor-pointer ${
                  currentTab === 'validacao' ? 'ring-2 ring-black' : ''
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Validador
              </button>
            )}
          </nav>

          {/* Action Zone: Notifications, Account & Book CTA */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Real-time Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2.5 rounded-xl text-neutral-600 hover:text-red-600 hover:bg-neutral-100 transition-colors"
              title="Notificações de viagem e do sistema"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Quick Demo Switcher / Role indicator */}
            <div className="hidden lg:flex items-center bg-neutral-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => onSwitchRole('cliente')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  currentUser?.role === 'cliente'
                    ? 'bg-white text-red-700 shadow-xs font-bold'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Passageiro
              </button>
              <button
                onClick={() => onSwitchRole('admin')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  currentUser?.role === 'admin'
                    ? 'bg-black text-amber-400 shadow-xs font-bold'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => onSwitchRole('validador')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  currentUser?.role === 'validador'
                    ? 'bg-red-700 text-white shadow-xs font-bold'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Fiscal
              </button>
            </div>

            {/* User Account / Login */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-xl border border-neutral-200 hover:border-neutral-300 bg-neutral-50 transition-all text-xs font-semibold text-neutral-800"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white font-bold flex items-center justify-center">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="hidden sm:inline-block max-w-[110px] truncate">
                    {currentUser.name.split(' ')[0]}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-neutral-200 py-2 z-50 text-sm">
                    <div className="px-4 py-2 border-b border-neutral-100">
                      <p className="font-bold text-neutral-900 truncate">{currentUser.name}</p>
                      <p className="text-xs text-neutral-500 truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">
                        {currentUser.role}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        handleNavClick('conta');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-neutral-50 flex items-center gap-2.5 font-medium text-neutral-700"
                    >
                      <UserIcon className="w-4 h-4 text-neutral-500" />
                      Minha Conta & Perfil
                    </button>

                    <button
                      onClick={() => {
                        handleNavClick('bilhetes');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-neutral-50 flex items-center gap-2.5 font-medium text-neutral-700"
                    >
                      <Ticket className="w-4 h-4 text-neutral-500" />
                      Meus Bilhetes Emitidos
                    </button>

                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => {
                          handleNavClick('admin');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-amber-50 text-amber-900 flex items-center gap-2.5 font-semibold"
                      >
                        <Shield className="w-4 h-4 text-amber-600" />
                        Painel Administrativo
                      </button>
                    )}

                    {currentUser.role === 'validador' && (
                      <button
                        onClick={() => {
                          handleNavClick('validacao');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-900 flex items-center gap-2.5 font-semibold"
                      >
                        <CheckCircle2 className="w-4 h-4 text-red-600" />
                        Validar Passagens
                      </button>
                    )}

                    <div className="border-t border-neutral-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          onLogout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2.5 font-medium"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        Terminar Sessão
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 text-xs font-bold text-neutral-800 hover:text-red-600 transition-colors whitespace-nowrap"
              >
                Entrar
              </button>
            )}

            {/* Primary Action Button: RESERVAR VIAGEM */}
            <button
              onClick={() => handleNavClick('reservar')}
              className="px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 active:scale-98 rounded-xl shadow-md shadow-red-600/25 transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer"
            >
              <Train className="w-4 h-4 text-amber-300" />
              <span>RESERVAR VIAGEM</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2.5 rounded-xl text-neutral-700 hover:bg-neutral-100"
              aria-label="Abrir menu de navegação"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-neutral-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-2xl">
          <button
            onClick={() => handleNavClick('inicio')}
            className="w-full text-left px-4 py-3 rounded-xl font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Início
          </button>
          <button
            onClick={() => handleNavClick('destinos')}
            className="w-full text-left px-4 py-3 rounded-xl font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Destinos
          </button>
          <button
            onClick={() => handleNavClick('viagens')}
            className="w-full text-left px-4 py-3 rounded-xl font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Viagens e Horários
          </button>
          <button
            onClick={() => handleNavClick('bilhetes')}
            className="w-full text-left px-4 py-3 rounded-xl font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Bilhetes
          </button>
          <button
            onClick={() => handleNavClick('turismo')}
            className="w-full text-left px-4 py-3 rounded-xl font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Experiências Turísticas
          </button>
          <button
            onClick={() => handleNavClick('sobre')}
            className="w-full text-left px-4 py-3 rounded-xl font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Sobre Nós
          </button>
          <button
            onClick={() => handleNavClick('contactos')}
            className="w-full text-left px-4 py-3 rounded-xl font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Contactos
          </button>

          <div className="pt-2 border-t border-neutral-100">
            <p className="text-xs font-bold text-neutral-400 px-4 mb-2 uppercase tracking-wider">
              Alternar Modo de Demonstração
            </p>
            <div className="grid grid-cols-3 gap-2 px-2">
              <button
                onClick={() => {
                  onSwitchRole('cliente');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 text-center text-xs font-bold rounded-lg ${currentUser?.role === 'cliente' ? 'bg-red-600 text-white' : 'bg-neutral-100 text-neutral-700'}`}
              >
                Passageiro
              </button>
              <button
                onClick={() => {
                  onSwitchRole('admin');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 text-center text-xs font-bold rounded-lg ${currentUser?.role === 'admin' ? 'bg-black text-amber-400' : 'bg-neutral-100 text-neutral-700'}`}
              >
                Admin
              </button>
              <button
                onClick={() => {
                  onSwitchRole('validador');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 text-center text-xs font-bold rounded-lg ${currentUser?.role === 'validador' ? 'bg-red-700 text-white' : 'bg-neutral-100 text-neutral-700'}`}
              >
                Fiscal
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
