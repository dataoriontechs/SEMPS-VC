import React, { useState } from 'react';
import { SempsUnit } from '../types';
import { MapPin, Phone, Clock, ListChecks, Landmark, ExternalLink } from 'lucide-react';

interface UnitsViewProps {
  units: SempsUnit[];
}

export default function UnitsView({ units }: UnitsViewProps) {
  const [activeUnit, setActiveUnit] = useState<string>(units[0]?.id || '');

  const selectedUnit = units.find(u => u.id === activeUnit);

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="font-display text-2xl font-bold text-brand-green-dark">Unidades da SEMPS Vera Cruz</h1>
        <p className="text-xs text-slate-500 font-light">
          Localização, contatos e serviços prestados pelas unidades de assistência social (CRAS) e sede administrativa em Vera Cruz/BA.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Unit Selection / List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-display text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Selecione uma Unidade</h2>
          <div className="space-y-3">
            {units.map((unit) => {
              const isActive = unit.id === activeUnit;
              return (
                <button
                  key={unit.id}
                  onClick={() => setActiveUnit(unit.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition duration-200 block ${
                    isActive
                      ? 'border-brand-green bg-brand-green-light/20 shadow-xs'
                      : 'border-slate-100 bg-white hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  <span className="text-[9px] font-bold text-brand-green uppercase tracking-wide">Vera Cruz / BA</span>
                  <h3 className="font-display font-bold text-xs text-slate-900 mt-0.5">{unit.name}</h3>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">{unit.address}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Unit Details & Custom Map */}
        <div className="lg:col-span-3 space-y-6">
          {selectedUnit && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
              {/* Unit Title Header */}
              <div className="border-b border-slate-50 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-base text-brand-green-dark">{selectedUnit.name}</h2>
                  <p className="text-[10px] text-slate-400 font-light mt-0.5">Vera Cruz, Ilha de Itaparica/BA</p>
                </div>
                <div className="p-3 bg-brand-green-light/25 rounded-xl text-brand-green">
                  <Landmark className="w-5 h-5" />
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-light text-slate-600 leading-normal">
                <div className="space-y-3">
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                    <span><strong>Endereço:</strong> <br />{selectedUnit.address}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-brand-green shrink-0" />
                    <span><strong>Telefone:</strong> <br />{selectedUnit.phone}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-green shrink-0" />
                    <span><strong>Atendimento:</strong> <br />{selectedUnit.hours}</span>
                  </p>
                </div>

                {/* Simulated Interactive Vector Map of Vera Cruz/BA (Itaparica Island) */}
                <div className="bg-brand-cream border border-brand-cream-dark p-4 rounded-2xl flex flex-col items-center justify-center relative min-h-[160px] shadow-inner overflow-hidden">
                  <span className="text-[8px] font-bold text-brand-green-dark absolute top-2 left-3 tracking-widest uppercase opacity-70">Mapa de Vera Cruz/BA</span>
                  
                  {/* Vector Island Map Graphic */}
                  <svg viewBox="0 0 200 150" className="w-full h-full max-h-[120px] stroke-brand-green fill-brand-green-light/30 stroke-2">
                    {/* Outline of Itaparica Island / Vera Cruz */}
                    <path d="M 30,110 C 20,90 40,50 60,40 C 80,30 110,25 130,45 C 150,65 170,80 180,100 C 190,120 150,130 130,120 C 110,110 90,135 70,125 C 50,115 40,130 30,110 Z" />
                    
                    {/* Wave lines for sea decoration */}
                    <path d="M10,20 Q20,15 30,20 T50,20" className="stroke-slate-200 fill-none stroke-1" />
                    <path d="M150,130 Q160,125 170,130 T190,130" className="stroke-slate-200 fill-none stroke-1" />

                    {/* Node points: click to activate corresponding units */}
                    {/* Mar Grande Pin */}
                    <g 
                      className={`cursor-pointer group transition ${activeUnit === 'unit-1' ? 'scale-125' : ''}`}
                      onClick={() => setActiveUnit('unit-1')}
                    >
                      <circle cx="120" cy="45" r="5" className="fill-brand-green stroke-white stroke-1" />
                      <circle cx="120" cy="45" r="10" className="stroke-brand-green fill-none stroke-1 animate-ping" />
                      <text x="120" y="35" className="font-sans text-[7px] font-bold fill-brand-green-dark text-center" textAnchor="middle">Mar Grande</text>
                    </g>

                    {/* Barra do Gil Pin */}
                    <g 
                      className={`cursor-pointer group transition ${activeUnit === 'unit-2' ? 'scale-125' : ''}`}
                      onClick={() => setActiveUnit('unit-2')}
                    >
                      <circle cx="90" cy="65" r="5" className="fill-brand-green stroke-white stroke-1" />
                      <text x="90" y="58" className="font-sans text-[7px] font-bold fill-brand-green-dark text-center" textAnchor="middle">Barra do Gil</text>
                    </g>

                    {/* Sede Centro Pin */}
                    <g 
                      className={`cursor-pointer group transition ${activeUnit === 'unit-3' ? 'scale-125' : ''}`}
                      onClick={() => setActiveUnit('unit-3')}
                    >
                      <circle cx="140" cy="75" r="5" className="fill-brand-green stroke-white stroke-1" />
                      <text x="140" y="68" className="font-sans text-[7px] font-bold fill-brand-green-dark text-center" textAnchor="middle">Centro</text>
                    </g>
                  </svg>

                  <p className="text-[8px] text-slate-400 mt-2">Clique nos pinos no mapa para alternar de unidade.</p>
                </div>
              </div>

              {/* Services offered list */}
              <div className="space-y-3 pt-4 border-t border-slate-50">
                <h3 className="font-display font-bold text-xs text-brand-green-dark flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4 text-brand-green" /> Serviços Disponibilizados na Unidade:
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-light text-slate-600">
                  {selectedUnit.services.map((service, index) => (
                    <li key={index} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-brand-green font-bold shrink-0 mt-0.5">•</span>
                      <span>{service}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* External Routing map simulations */}
              <button 
                onClick={() => alert(`🧭 Rota de GPS iniciada para: ${selectedUnit.name}!\nEndereço: ${selectedUnit.address}\n(Direcionamento simulado no PWA)`)}
                className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                Como Chegar pelo GPS <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
