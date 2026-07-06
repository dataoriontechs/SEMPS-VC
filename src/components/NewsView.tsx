import React, { useState } from 'react';
import { News } from '../types';
import { Search, Calendar, User, Bookmark, Megaphone } from 'lucide-react';

interface NewsViewProps {
  news: News[];
}

const defaultCategoryImages: Record<string, string> = {
  campanha: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?q=80&w=600&auto=format&fit=crop',
  comunicado: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=600&auto=format&fit=crop',
  evento: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=600&auto=format&fit=crop',
  aviso: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=600&auto=format&fit=crop',
};
const defaultFallbackImage = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=600&auto=format&fit=crop';

export default function NewsView({ news }: NewsViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'campanha', label: 'Campanhas' },
    { id: 'comunicado', label: 'Comunicados' },
    { id: 'evento', label: 'Eventos' },
    { id: 'aviso', label: 'Avisos Importantes' },
  ];

  // Filtering logic
  const filteredNews = news.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-green-dark">Notícias & Comunicados Oficiais</h1>
          <p className="text-xs text-slate-500 font-light">Mantenha-se informado sobre ações sociais, campanhas e avisos da Promoção Social de Vera Cruz/BA.</p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar comunicados..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-green text-xs bg-white"
          />
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-brand-green text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      {filteredNews.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-xs">Nenhum comunicado encontrado com esses critérios de busca.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((item) => (
            <article 
              key={item.id} 
              className={`bg-white rounded-2xl border ${item.isImportant ? 'border-brand-green bg-gradient-to-br from-brand-green-light/5 to-white shadow-md' : 'border-slate-100 shadow-sm'} p-6 flex flex-col justify-between hover:shadow-md transition duration-300 relative overflow-hidden`}
            >
              {item.isImportant && (
                <div className="absolute top-0 right-0 bg-brand-green text-white text-[8px] font-bold tracking-widest uppercase px-3 py-1 rounded-bl-lg">
                  Importante 📌
                </div>
              )}
              
              <div className="space-y-3">
                <div className="w-full h-40 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 mb-2">
                  <img 
                    src={item.image || defaultCategoryImages[item.category] || defaultFallbackImage} 
                    alt={item.title} 
                    className="w-full h-full object-cover select-none" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = defaultCategoryImages[item.category] || defaultFallbackImage;
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full ${
                    item.category === 'campanha' ? 'bg-red-50 text-red-700 border border-red-100' :
                    item.category === 'comunicado' ? 'bg-brand-green-light text-brand-green-dark' :
                    item.category === 'evento' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {item.date.split('-').reverse().join('/')}
                  </span>
                </div>

                <h3 className="font-display font-bold text-sm text-slate-900 leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed font-light whitespace-pre-wrap">
                  {item.content}
                </p>
              </div>

              <div className="flex justify-between items-center pt-4 mt-6 border-t border-slate-100 text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {item.author}</span>
                <span className="font-light italic">SEMPS Vera Cruz</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
