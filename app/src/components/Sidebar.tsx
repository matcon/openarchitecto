import React, { useState } from 'react';
import { 
  Search, Plus, Layers, Database, Flame, 
  Cloud, Sparkles, Monitor, Server, ChevronLeft, ChevronRight,
  Boxes, Shield, Radio, Box, Lock, Globe
} from 'lucide-react';
import { TECH_CATALOG, CATEGORY_COLORS } from '../data/techCatalog';
import { TechItem, ZoneType } from '../types';

interface SidebarProps {
  onAddTech: (tech: TechItem) => void;
  onAddGroup: (type: ZoneType) => void;
}

const CATEGORY_TABS: { id: string; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'all', label: 'Todo', icon: Layers },
  { id: 'aws', label: 'AWS', icon: Cloud },
  { id: 'gcp', label: 'GCP', icon: Cloud },
  { id: 'azure', label: 'Azure', icon: Cloud },
  { id: 'k8s', label: 'K8s', icon: Boxes },
  { id: 'frontend', label: 'Frontend', icon: Monitor },
  { id: 'backend', label: 'Backend', icon: Server },
  { id: 'database', label: 'BD / Caché', icon: Database },
  { id: 'ai', label: 'IA / LLM', icon: Sparkles },
  { id: 'devops', label: 'DevOps', icon: Radio },
];

const ZONE_PRESETS: { type: ZoneType; label: string; icon: React.FC<{ className?: string }>; color: string }[] = [
  { type: 'vpc', label: 'VPC Cloud', icon: Cloud, color: '#ff9900' },
  { type: 'public-subnet', label: 'Subnet Pública', icon: Globe, color: '#0284c7' },
  { type: 'private-subnet', label: 'Subnet Privada', icon: Server, color: '#0d9488' },
  { type: 'isolated-subnet', label: 'Subnet Aislada', icon: Lock, color: '#7c3aed' },
  { type: 'cluster', label: 'Clúster K8s', icon: Box, color: '#326ce5' },
  { type: 'security', label: 'Frontera STRIDE', icon: Shield, color: '#f59e0b' },
];

export const Sidebar: React.FC<SidebarProps> = ({ onAddTech, onAddGroup }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  const filtered = TECH_CATALOG.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.description.toLowerCase().includes(search.toLowerCase()) ||
                          (item.platform && item.platform.toLowerCase().includes(search.toLowerCase()));
    
    let matchesCat = false;
    if (selectedCat === 'all') matchesCat = true;
    else if (selectedCat === 'aws') matchesCat = item.platform === 'aws' || item.category === 'aws';
    else if (selectedCat === 'gcp') matchesCat = item.platform === 'gcp' || item.category === 'gcp';
    else if (selectedCat === 'azure') matchesCat = item.platform === 'azure' || item.category === 'azure';
    else if (selectedCat === 'k8s') matchesCat = item.platform === 'k8s' || item.category === 'k8s';
    else if (selectedCat === 'database') matchesCat = item.category === 'database' || item.category === 'cache';
    else matchesCat = item.category === selectedCat;

    return matchesSearch && matchesCat;
  });

  return (
    <>
      {/* Toggle button when closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          title="Abrir catálogo de tecnologías"
          className="absolute top-20 left-4 z-40 p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-teal-400 hover:border-teal-500 shadow-xl backdrop-blur-md transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Drawer */}
      <aside 
        className={`absolute top-16 left-0 bottom-0 z-30 w-80 bg-slate-900/95 border-r border-slate-800/80 backdrop-blur-xl flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-teal-400" />
              Catálogo Multi-Cloud & Tech
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Haz clic para añadir al lienzo</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            title="Ocultar barra"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Add Zones (UI/UX Pro Max Edition) */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Zonas de Red & Seguridad (Pro Max)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {ZONE_PRESETS.map((z) => {
              const Icon = z.icon;
              return (
                <button
                  key={z.type}
                  onClick={() => onAddGroup(z.type)}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 transition text-left group"
                >
                  <div 
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: `${z.color}15`,
                      borderColor: `${z.color}40`,
                      color: z.color,
                    }}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-300 group-hover:text-white truncate">
                    {z.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar (AWS, S3, FastAPI, Redis...)"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-1 overflow-x-auto mt-2.5 pb-1 no-scrollbar">
            {CATEGORY_TABS.map((tab) => {
              const active = selectedCat === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCat(tab.id)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition flex items-center gap-1 ${
                    active 
                      ? 'bg-teal-600/30 text-teal-300 border border-teal-500/50 font-bold' 
                      : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* List of items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No se encontraron tecnologías
            </div>
          ) : (
            filtered.map((item) => {
              const catStyle = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.custom;
              return (
                <button
                  key={item.id}
                  onClick={() => onAddTech(item)}
                  className="w-full group text-left p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/80 hover:border-teal-500/40 transition-all flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                      style={{ 
                        backgroundColor: `${item.color}15`, 
                        borderColor: `${item.color}35`,
                        color: item.color 
                      }}
                    >
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-teal-300 truncate">
                        {item.name}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {item.platform && (
                          <span className="text-[8px] font-bold px-1 rounded bg-slate-800 text-slate-300 uppercase">
                            {item.platform}
                          </span>
                        )}
                        <span className={`text-[8px] font-medium px-1 rounded border uppercase ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-1 rounded-md bg-slate-800 text-slate-400 group-hover:bg-teal-600 group-hover:text-white transition">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};
