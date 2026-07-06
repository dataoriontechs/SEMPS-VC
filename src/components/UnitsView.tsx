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
      <div className="border-b border-brand-green-light pb-4">
        <h1 className="font-display text-2xl font-bold italic text-brand-green-dark">Unidades da SEMPS Vera Cruz</h1>
        <p className="text-xs text-[#5a5a40] font-light mt-1">
          Localização, contatos e serviços prestados pelas unidades de assistência social (CRAS) e sede administrativa em Vera Cruz/BA.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Unit Selection / List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-display text-xs font-bold text-brand-green-dark uppercase tracking-wider mb-2">Selecione uma Unidade</h2>
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
                      : 'border-brand-green-light bg-white hover:bg-brand-cream/30 shadow-2xs'
                  }`}
                >
                  <span className="text-[9px] font-bold text-brand-green uppercase tracking-wide">Vera Cruz / BA</span>
                  <h3 className="font-display font-bold text-xs text-brand-green-dark mt-0.5">{unit.name}</h3>
                  <p className="text-[10px] text-[#5a5a40]/90 mt-1 truncate">{unit.address}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Unit Details & Custom Map */}
        <div className="lg:col-span-3 space-y-6">
          {selectedUnit && (
            <div className="bg-white rounded-[32px] border border-brand-green-light shadow-sm p-6 space-y-6">
              {/* Unit Title Header */}
              <div className="border-b border-brand-green-light/40 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-base text-brand-green-dark">{selectedUnit.name}</h2>
                  <p className="text-[10px] text-[#5a5a40] font-light mt-0.5">Vera Cruz, Ilha de Itaparica/BA</p>
                </div>
                <div className="p-3 bg-brand-green-light/25 rounded-xl text-brand-green">
                  <Landmark className="w-5 h-5" />
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-light text-brand-green-dark leading-normal">
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

                {/* Real Google Maps Embed showing location */}
                <div className="bg-white border border-brand-green-light rounded-2xl overflow-hidden min-h-[180px] shadow-sm relative">
                  <iframe
                    title={`Mapa de Localização - ${selectedUnit.name}`}
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: '180px' }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedUnit.name + ', ' + selectedUnit.address + ', Vera Cruz, Bahia, Brasil')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  />
                </div>
              </div>

              {/* Services offered list */}
              <div className="space-y-3 pt-4 border-t border-brand-green-light/40">
                <h3 className="font-display font-bold text-xs text-brand-green-dark flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4 text-brand-green" /> Serviços Disponibilizados na Unidade:
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-light text-brand-green-dark">
                  {selectedUnit.services.map((service, index) => (
                    <li key={index} className="flex items-start gap-2 bg-brand-cream/35 p-2.5 rounded-xl border border-brand-green-light/30">
                      <span className="text-brand-green font-bold shrink-0 mt-0.5">•</span>
                      <span>{service}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* External Routing map simulations */}
              <a 
                href={selectedUnit.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedUnit.name + ', ' + selectedUnit.address)}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-3.5 rounded-full shadow-md transition flex items-center justify-center gap-2"
              >
                Como Chegar pelo GPS <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
