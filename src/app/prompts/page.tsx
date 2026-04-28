'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Layout/Navbar';
import { Copy, Terminal, Sparkles, Image as ImageIcon, Search, CheckCircle, Heart } from 'lucide-react';

export default function PromptHunterPage() {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const prompts = [
    {
      id: 1,
      author: 'DUBU_AI',
      manga: 'Solo Leveling',
      image: 'https://via.placeholder.com/600x400/10121a/5a6072?text=Shadow+Army+Arises',
      prompt: 'A colossal army of shadow knights rising from the ground, emitting dark blue smoke, intense cinematic lighting, low angle shot, highly detailed fantasy armor, webtoon style, 8k resolution --ar 16:9 --niji 6',
      negative: 'text, watermark, ugly, deformed, blurry',
      model: 'Midjourney Niji 6',
      likes: 1240
    },
    {
      id: 2,
      author: 'Gege_Clone',
      manga: 'Jujutsu Kaisen',
      image: 'https://via.placeholder.com/600x800/10121a/5a6072?text=Domain+Expansion',
      prompt: 'Male character with white hair and black blindfold crossing fingers, infinite void background, galaxy aesthetic, high contrast, dramatic shadows, dynamic action pose, manga cover style, vibrant colors --ar 3:4',
      negative: 'bad hands, missing fingers, lowres',
      model: 'Stable Diffusion XL',
      likes: 892
    },
    {
      id: 3,
      author: 'Cyber_Mangaka',
      manga: 'Neon City',
      image: 'https://via.placeholder.com/400x400/10121a/5a6072?text=Cyberpunk+Girl',
      prompt: 'Portrait of a cyberpunk anime girl with glowing neon pink eyes, rain droplets on futuristic helmet, tokyo street background at night, cinematic rim lighting, masterpiece, anime style --v 6.0',
      negative: 'realistic, 3d, ugly',
      model: 'Midjourney v6',
      likes: 560
    }
  ];

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-primary font-sans text-fg-primary pb-12">
      <Navbar />

      <div className="bg-secondary border-b border-custom">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <div className="inline-flex justify-center items-center bg-accent-purple/10 text-accent-purple p-3 rounded-full mb-4">
            <Terminal size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Prompt <span className="text-accent-purple">Hunter</span></h1>
          <p className="text-muted text-lg max-w-2xl mx-auto mb-8">
            El código fuente detrás del arte. Descubre, copia y aprende de los prompts exactos que los mejores creadores de la plataforma utilizan para generar sus mangas.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por estilo, autor o palabra clave... (ej. 'cyberpunk', 'niji 6')" 
              className="w-full pl-12 pr-4 py-4 bg-tertiary border border-custom focus:border-accent-purple focus:ring-1 focus:ring-accent-purple rounded-2xl outline-none transition-all shadow-lg"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12">
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {prompts.map((item) => (
            <div key={item.id} className="break-inside-avoid bg-secondary border border-custom rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-accent-purple transition-all group">
              {/* Image */}
              <div className="relative">
                <img src={item.image} alt="Generative Art" className="w-full h-auto object-cover" />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-white border border-white/10 flex items-center gap-1.5">
                  <ImageIcon size={12} /> {item.manga}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-bold text-fg-primary hover:text-accent-blue cursor-pointer transition-colors">@{item.author}</p>
                    <p className="text-xs text-muted flex items-center gap-1 mt-0.5"><Sparkles size={10} className="text-accent-purple"/> {item.model}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-muted bg-tertiary px-2 py-1 rounded-md">
                    <Heart size={12} className="text-accent-red" /> {item.likes}
                  </div>
                </div>

                {/* Prompt Block */}
                <div className="mb-4">
                  <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Prompt Positivo</p>
                  <div className="relative bg-primary border border-custom rounded-xl p-3 group/code">
                    <p className="text-sm font-mono text-gray-300 leading-relaxed pr-8">{item.prompt}</p>
                    <button 
                      onClick={() => handleCopy(item.prompt, item.id)}
                      className="absolute top-2 right-2 bg-secondary hover:bg-tertiary border border-custom p-1.5 rounded-md text-muted hover:text-fg-primary transition-colors opacity-0 group-hover/code:opacity-100 focus:opacity-100"
                      title="Copiar Prompt"
                    >
                      {copiedId === item.id ? <CheckCircle size={16} className="text-accent-green" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                {/* Negative Prompt Block */}
                <div>
                  <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Prompt Negativo</p>
                  <div className="bg-primary/50 border border-custom rounded-xl p-3 border-l-2 border-l-accent-red">
                    <p className="text-xs font-mono text-gray-400">{item.negative}</p>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
