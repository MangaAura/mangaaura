'use client';

import { ShieldAlert, ThumbsUp, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface SpoilerCommentProps {
  user: string;
  avatar: string;
  content: string;
  isSpoiler: boolean;
  likes: number;
  timeAgo: string;
}

export default function SpoilerComment({ user, avatar, content, isSpoiler, likes, timeAgo }: SpoilerCommentProps) {
  const [isRevealed, setIsRevealed] = useState(!isSpoiler);
  const [localLikes, setLocalLikes] = useState(likes);
  const [hasLiked, setHasLiked] = useState(false);

  const handleLike = () => {
    if (hasLiked) {
      setLocalLikes(prev => prev - 1);
      setHasLiked(false);
    } else {
      setLocalLikes(prev => prev + 1);
      setHasLiked(true);
    }
  };

  return (
    <div className="flex gap-4 p-4 border-b border-custom bg-secondary hover:bg-tertiary transition-colors">
      <Image src={avatar} alt={user} width={40} height={40} className="w-10 h-10 rounded-full shadow-sm" />
      
      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">{user}</span>
            <span className="text-xs text-muted">{timeAgo}</span>
          </div>
        </div>

        <div className="relative">
          {isSpoiler && !isRevealed ? (
            <div 
              onClick={() => setIsRevealed(true)}
              className="cursor-pointer bg-tertiary border border-dashed border-accent-red/50 rounded-lg p-3 text-center transition-all hover:bg-accent-red/5"
            >
              <div className="flex items-center justify-center gap-2 text-accent-red font-bold text-sm mb-1">
                <ShieldAlert size={16} /> 
                Escudo AI Anti-Spoiler Activo
              </div>
              <p className="text-xs text-muted">Haz clic para revelar bajo tu propio riesgo.</p>
              
              {/* Blur effect simulation over actual text */}
              <p className="blur-sm opacity-50 mt-2 select-none text-left">
                {content}
              </p>
            </div>
          ) : (
            <div className="text-sm text-fg-primary leading-relaxed">
              {isSpoiler && (
                <span className="inline-block bg-accent-red/10 text-accent-red text-[10px] font-bold px-2 py-0.5 rounded mr-2 uppercase">
                  Spoiler
                </span>
              )}
              {content}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mt-2">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-1 text-xs font-semibold transition-colors ${hasLiked ? 'text-accent-blue' : 'text-muted hover:text-fg-primary'}`}
          >
            <ThumbsUp size={14} /> {localLikes}
          </button>
          <button className="flex items-center gap-1 text-xs font-semibold text-muted hover:text-fg-primary transition-colors">
            <MessageSquare size={14} /> Responder
          </button>
        </div>
      </div>
    </div>
  );
}
