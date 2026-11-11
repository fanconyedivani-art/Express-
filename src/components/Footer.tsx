import React from 'react';
import { EkumbiLogo } from './EkumbiLogo.tsx';
import { Phone, Mail, MapPin, Clock, ShieldCheck, Award, MessageCircle } from 'lucide-react';

interface FooterProps {
  onSelectTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-950 text-neutral-300 border-t border-neutral-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-neutral-800">
          {/* Column 1: Brand & Slogan */}
          <div className="space-y-4">
            <EkumbiLogo size="lg" light={true} />
            <p className="text-sm text-neutral-400 leading-relaxed">
              O futuro da mobilidade ferroviária em Angola. Viagens de alto padrão,
              pontualidade britânica, conforto panorâmico e segurança para ligar famílias,
              empresas e destinos turísticos memoráveis.
            </p>
            <div className="pt-2">
              <a
                href="https://wa.me/244922050257?text=Ol%C3%A1%20EKUMBI%20EXPRESS!%20Gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20as%20viagens."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-700/20 text-emerald-400 border border-emerald-600/30 text-xs font-bold hover:bg-emerald-700/30 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Oficial: +244 922 050 257
              </a>
            </div>
          </div>

          {/* Column 2: Navegação & Reservas */}
          <div>
            <h4 className="font-display font-bold text-white text-base mb-4 tracking-wide">
              Navegação Rápida
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>
                <button
                  onClick={() => onSelectTab('inicio')}
                  className="hover:text-red-400 transition-colors cursor-pointer"
                >
                  Página Inicial
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('destinos')}
                  className="hover:text-red-400 transition-colors cursor-pointer"
                >
                  Destinos & Cidades
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('viagens')}
                  className="hover:text-red-400 transition-colors cursor-pointer"
                >
                  Pesquisa de Viagens & Horários
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('turismo')}
                  className="hover:text-red-400 transition-colors cursor-pointer"
                >
                  Experiências & Roteiros Turísticos
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('bilhetes')}
                  className="hover:text-red-400 transition-colors cursor-pointer"
                >
                  Meus Bilhetes & Validação
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('sobre')}
                  className="hover:text-red-400 transition-colors cursor-pointer"
                >
                  Sobre a Empresa
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Corredores Ferroviários em Angola */}
          <div>
            <h4 className="font-display font-bold text-white text-base mb-4 tracking-wide">
              Linhas Ferroviárias
            </h4>
            <ul className="space-y-3 text-xs text-neutral-400">
              <li className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="font-bold text-amber-400 block mb-0.5">CFL (Luanda ➔ Malanje)</span>
                Estação Central do Bungo, Viana, Dondo, Ndalatando, Cacuso e Malanje.
              </li>
              <li className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="font-bold text-amber-400 block mb-0.5">CFB (Lobito ➔ Huambo)</span>
                Lobito, Benguela, Cubal, Caimbambo e Planalto Central do Huambo.
              </li>
              <li className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="font-bold text-amber-400 block mb-0.5">CFM (Moçâmedes ➔ Lubango)</span>
                Deserto do Namibe, Serra da Leba e Estação do Lubango.
              </li>
            </ul>
          </div>

          {/* Column 4: Contactos & Suporte */}
          <div>
            <h4 className="font-display font-bold text-white text-base mb-4 tracking-wide">
              Central de Atendimento
            </h4>
            <div className="space-y-3 text-sm text-neutral-400">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold">+244 922 050 257</p>
                  <p className="text-xs text-neutral-500">Linha dedicada de reservas e WhatsApp</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold">reservas@ekumbiexpress.ao</p>
                  <p className="text-xs text-neutral-500">Confirmação de pagamentos e bilhetes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold">Estação Central do Bungo</p>
                  <p className="text-xs text-neutral-500">Largo dos Caminhos de Ferro, Luanda, Angola</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold">Horário Operacional</p>
                  <p className="text-xs text-neutral-500">Segunda a Domingo: 05:00 – 22:30</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Policies */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>
            © {currentYear} EKUMBI EXPRESS S.A. Todos os direitos reservados. "Um novo horizonte em cada viagem."
          </p>
          <div className="flex items-center gap-6">
            <span className="hover:text-neutral-400 cursor-pointer">Termos e Condições de Transporte</span>
            <span className="hover:text-neutral-400 cursor-pointer">Política de Privacidade</span>
            <span className="hover:text-neutral-400 cursor-pointer">Direitos do Passageiro Ferroviário</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
