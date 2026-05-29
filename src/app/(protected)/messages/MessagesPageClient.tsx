'use client';

import { ChevronLeft, Edit, MessageSquare } from 'lucide-react';
import { useState, useCallback } from 'react';

import { ChatInterface } from '@/components/Messages/ChatInterface';
import { ClanChatInterface } from '@/components/Messages/ClanChatInterface';
import { ConversationList } from '@/components/Messages/ConversationList';
import { UserSearchBar } from '@/components/Messages/UserSearchBar';

interface Participant {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface ClanChatData {
  id: string;
  name: string;
  emblemUrl: string | null;
  description: string | null;
  memberCount: number;
  userRole: string;
}

export function MessagesPageClient({ userId }: { userId: string }) {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [selectedClan, setSelectedClan] = useState<ClanChatData | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const handleNewConversation = () => {
    setSearchFocused(true);
    setTimeout(() => setSearchFocused(false), 100);
  };

  const handleSelectConversation = (convId: string, participant: Participant) => {
    setSelectedConvId(convId);
    setSelectedParticipant(participant);
    setSelectedClan(null);
  };

  const handleSelectClanChat = useCallback(async (clanId: string) => {
    try {
      const clanRes = await fetch(`/api/clans/${clanId}`);

      if (!clanRes.ok) return;

      const clanData = await clanRes.json();
      const clan = clanData.clan;

      // Fetch user role
      const memberRes = await fetch('/api/user/clan');
      let userRole = 'MEMBER';
      if (memberRes.ok) {
        const memberData = await memberRes.json();
        userRole = memberData.role || 'MEMBER';
      }

      setSelectedClan({
        id: clan.id,
        name: clan.name,
        emblemUrl: clan.emblemUrl,
        description: clan.description,
        memberCount: clan.memberCount,
        userRole,
      });
      setSelectedConvId(null);
      setSelectedParticipant(null);
    } catch {
      // silent
    }
  }, []);

  const handleBack = () => {
    setSelectedConvId(null);
    setSelectedParticipant(null);
    setSelectedClan(null);
  };

  return (
    <div className="container mx-auto px-4 pt-20 pb-10">
      <div className="max-w-6xl mx-auto">
        {/* Mobile: selected conversation view */}
        <div className="lg:hidden">
          {(selectedConvId && selectedParticipant) || selectedClan ? (
            <div className="h-[calc(100dvh-140px)] min-h-[500px] flex flex-col">
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mb-2 transition-colors self-start"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver
              </button>
              <div className="flex-1 min-h-0">
                {selectedClan ? (
                  <ClanChatInterface
                    clanId={selectedClan.id}
                    currentUserId={userId}
                    clan={{
                      id: selectedClan.id,
                      name: selectedClan.name,
                      emblemUrl: selectedClan.emblemUrl,
                      description: selectedClan.description,
                      memberCount: selectedClan.memberCount,
                    }}
                    currentUserRole={selectedClan.userRole}
                  />
                ) : (
                  <ChatInterface
                    conversationId={selectedConvId!}
                    currentUserId={userId}
                    participant={selectedParticipant!}
                  />
                )}
              </div>
            </div>
          ) : (
            <MessagesSidebar
              searchFocused={searchFocused}
              onNewConversation={handleNewConversation}
              onSelectConversation={handleSelectConversation}
              onSelectClanChat={handleSelectClanChat}
              activeConvId={selectedConvId}
            />
          )}
        </div>

        {/* Desktop: two-panel layout */}
        <div className="hidden lg:flex gap-6 h-[calc(100dvh-140px)] min-h-[500px]">
          <div className="w-80 flex-shrink-0 flex flex-col">
            <DesktopSidebarHeader onNewConversation={handleNewConversation} />
            <div className="mb-3">
              <UserSearchBar autoFocus={searchFocused} />
            </div>
            <div className="flex-1 bg-[var(--surface)] rounded-lg border border-[var(--border)] overflow-hidden">
              <ConversationList
                onSelectConversation={handleSelectConversation}
                onSelectClanChat={handleSelectClanChat}
                activeConversationId={selectedConvId}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {selectedClan ? (
              <div className="h-full">
                <ClanChatInterface
                  clanId={selectedClan.id}
                  currentUserId={userId}
                  clan={{
                    id: selectedClan.id,
                    name: selectedClan.name,
                    emblemUrl: selectedClan.emblemUrl,
                    description: selectedClan.description,
                    memberCount: selectedClan.memberCount,
                  }}
                  currentUserRole={selectedClan.userRole}
                />
              </div>
            ) : selectedConvId && selectedParticipant ? (
              <div className="h-full">
                <ChatInterface
                  conversationId={selectedConvId}
                  currentUserId={userId}
                  participant={selectedParticipant}
                />
              </div>
            ) : (
              <div className="h-full bg-[var(--surface)] rounded-lg border border-[var(--border)] flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-3" />
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Selecciona una conversación</h2>
                  <p className="text-sm text-[var(--text-tertiary)] mt-1">Elige un chat de la lista o busca un usuario</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopSidebarHeader({ onNewConversation }: { onNewConversation: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
        <MessageSquare className="text-[var(--primary)]" size={24} /> Mensajes
      </h1>
      <button
        onClick={onNewConversation}
        className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
      >
        <Edit className="w-3.5 h-3.5" />
        Nueva
      </button>
    </div>
  );
}

function MessagesSidebar({
  searchFocused,
  onNewConversation,
  onSelectConversation,
  onSelectClanChat,
  activeConvId,
}: {
  searchFocused: boolean;
  onNewConversation: () => void;
  onSelectConversation: (id: string, participant: Participant) => void;
  onSelectClanChat: (clanId: string) => void;
  activeConvId: string | null;
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <MessageSquare className="text-[var(--primary)]" size={30} /> Mensajes
        </h1>
        <button
          onClick={onNewConversation}
          className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <Edit className="w-4 h-4" />
          <span className="hidden sm:inline">Nueva conversación</span>
        </button>
      </div>
      <div className="mb-4">
        <UserSearchBar autoFocus={searchFocused} />
      </div>
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] min-h-[400px]">
        <ConversationList
          onSelectConversation={onSelectConversation}
          onSelectClanChat={onSelectClanChat}
          activeConversationId={activeConvId}
        />
      </div>
    </>
  );
}
