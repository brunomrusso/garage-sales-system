import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

interface EmpresaSelectorProps {
  onSelect: (slug: string) => void;
  selectedSlug: string | null;
}

export function EmpresaSelector({ onSelect, selectedSlug }: EmpresaSelectorProps) {
  const [customSlug, setCustomSlug] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  // Empresas pré-configuradas (mock - depois virá da API)
  const empresasPreConfiguradas = [
    { slug: 'principal', nome: 'Empresa Principal', cor: '#3B82F6' },
  ];

  const handleSelect = (slug: string) => {
    onSelect(slug);
    localStorage.setItem('empresa_slug', slug);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSlug.trim()) {
      handleSelect(customSlug.trim().toLowerCase());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-300 mb-3">
        <Building2 size={20} />
        <span className="text-sm font-medium">Selecione a Empresa</span>
      </div>

      {/* Empresas pré-configuradas */}
      <div className="grid gap-2">
        {empresasPreConfiguradas.map((empresa) => (
          <button
            key={empresa.slug}
            onClick={() => handleSelect(empresa.slug)}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
              selectedSlug === empresa.slug
                ? 'border-red-500 bg-red-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: empresa.cor }}
            >
              {empresa.nome.charAt(0)}
            </div>
            <div className="text-left">
              <div className="text-white font-medium">{empresa.nome}</div>
              <div className="text-gray-400 text-sm">{empresa.slug}.seusite.com</div>
            </div>
          </button>
        ))}
      </div>

      {/* Entrada manual */}
      {!showCustom ? (
        <button
          onClick={() => setShowCustom(true)}
          className="w-full p-3 rounded-lg border border-dashed border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-all"
        >
          + Outra empresa
        </button>
      ) : (
        <form onSubmit={handleCustomSubmit} className="space-y-2">
          <input
            type="text"
            placeholder="Digite o slug da empresa"
            value={customSlug}
            onChange={(e) => setCustomSlug(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => setShowCustom(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
