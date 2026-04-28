/**
 * PartyService
 *
 * Servicio para gestionar salas de lectura en grupo (Party Reading).
 * Almacena parties en memoria con límite de miembros y auto-cierre por inactividad.
 */

import {
  PartyState,
  PartyMember,
  PartyMessage,
  JoinPartyUser,
} from '@/types/socket';

// ==================== Configuration ====================

const MAX_MEMBERS_PER_PARTY = 10;
const PARTY_INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hora
const MEMBER_INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutos
const CLEANUP_INTERVAL = 60 * 1000; // 1 minuto

// ==================== Party Service Class ====================

class PartyService {
  private parties: Map<string, PartyState> = new Map();
  private messages: Map<string, PartyMessage[]> = new Map();
  private userPartyMap: Map<string, string> = new Map(); // userId -> partyId
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  // ==================== Party Management ====================

  /**
   * Crear una nueva sala de lectura
   */
  createParty(data: {
    mangaId: string;
    chapterId: string;
    user: JoinPartyUser;
  }): PartyState {
    const partyId = this.generatePartyId();
    const now = new Date();

    const party: PartyState = {
      partyId,
      mangaId: data.mangaId,
      chapterId: data.chapterId,
      hostId: data.user.userId,
      members: [],
      currentPage: 1,
      isReading: true,
      startedAt: now,
      lastActivity: now,
      maxMembers: MAX_MEMBERS_PER_PARTY,
    };

    this.parties.set(partyId, party);
    this.messages.set(partyId, []);

    console.log(`[PartyService] Party ${partyId} created for manga ${data.mangaId}`);

    return party;
  }

  /**
   * Obtener una sala por ID
   */
  getParty(partyId: string): PartyState | null {
    return this.parties.get(partyId) || null;
  }

  /**
   * Verificar si una sala existe
   */
  partyExists(partyId: string): boolean {
    return this.parties.has(partyId);
  }

  /**
   * Obtener todas las salas activas
   */
  getAllParties(): PartyState[] {
    return Array.from(this.parties.values());
  }

  /**
   * Cerrar y eliminar una sala
   */
  closeParty(partyId: string): boolean {
    const party = this.parties.get(partyId);
    if (!party) return false;

    // Notificar a miembros
    party.members.forEach((member) => {
      this.userPartyMap.delete(member.userId);
    });

    this.parties.delete(partyId);
    this.messages.delete(partyId);

    console.log(`[PartyService] Party ${partyId} closed`);
    return true;
  }

  // ==================== Member Management ====================

  /**
   * Unirse a una sala
   */
  joinParty(
    partyId: string,
    user: JoinPartyUser,
    socketId: string
  ): { success: boolean; member?: PartyMember; error?: string } {
    const party = this.parties.get(partyId);

    if (!party) {
      return { success: false, error: 'Party not found' };
    }

    // Verificar si ya esta en la sala
    const existingMember = party.members.find((m) => m.userId === user.userId);
    if (existingMember) {
      // Reconectar
      existingMember.isOnline = true;
      existingMember.socketId = socketId;
      existingMember.lastSeen = new Date();
      this.userPartyMap.set(user.userId, partyId);
      return { success: true, member: existingMember };
    }

    // Verificar limite de miembros
    if (party.members.length >= party.maxMembers) {
      return { success: false, error: 'Party is full' };
    }

    // Verificar si el usuario esta en otra sala
    const currentPartyId = this.userPartyMap.get(user.userId);
    if (currentPartyId && currentPartyId !== partyId) {
      this.leaveParty(currentPartyId, user.userId);
    }

    const isHost = party.members.length === 0;
    const now = new Date();

    const member: PartyMember = {
      userId: user.userId,
      username: user.username,
      avatarUrl: user.avatarUrl,
      currentPage: party.currentPage,
      isHost,
      isOnline: true,
      socketId,
      joinedAt: now,
      lastSeen: now,
    };

    party.members.push(member);
    party.lastActivity = now;
    this.userPartyMap.set(user.userId, partyId);

    // Si es el primer miembro, hacerlo host
    if (isHost) {
      party.hostId = user.userId;
    }

    console.log(`[PartyService] User ${user.userId} joined party ${partyId}`);

    return { success: true, member };
  }

  /**
   * Salir de una sala
   */
  leaveParty(partyId: string, userId: string): { success: boolean; wasHost: boolean } {
    const party = this.parties.get(partyId);
    if (!party) return { success: false, wasHost: false };

    const memberIndex = party.members.findIndex((m) => m.userId === userId);
    if (memberIndex === -1) return { success: false, wasHost: false };

    const wasHost = party.members[memberIndex].isHost;

    // Eliminar miembro
    party.members.splice(memberIndex, 1);
    this.userPartyMap.delete(userId);

    // Si era host, asignar nuevo host
    if (wasHost && party.members.length > 0) {
      const newHost = party.members.find((m) => m.isOnline) || party.members[0];
      newHost.isHost = true;
      party.hostId = newHost.userId;
    }

    // Si no quedan miembros, cerrar la sala
    if (party.members.length === 0) {
      this.closeParty(partyId);
    }

    console.log(`[PartyService] User ${userId} left party ${partyId}`);

    return { success: true, wasHost };
  }

  /**
   * Desconectar un usuario (mantener en sala pero marcar offline)
   */
  disconnectUser(partyId: string, userId: string): boolean {
    const party = this.parties.get(partyId);
    if (!party) return false;

    const member = party.members.find((m) => m.userId === userId);
    if (!member) return false;

    member.isOnline = false;
    member.socketId = undefined;

    return true;
  }

  /**
   * Obtener la sala de un usuario
   */
  getUserParty(userId: string): PartyState | null {
    const partyId = this.userPartyMap.get(userId);
    if (!partyId) return null;
    return this.parties.get(partyId) || null;
  }

  // ==================== Host Management ====================

  /**
   * Transferir host a otro miembro
   */
  transferHost(partyId: string, currentHostId: string, newHostId: string): boolean {
    const party = this.parties.get(partyId);
    if (!party || party.hostId !== currentHostId) return false;

    const newHost = party.members.find((m) => m.userId === newHostId);
    if (!newHost) return false;

    // Quitar host actual
    const currentHost = party.members.find((m) => m.userId === currentHostId);
    if (currentHost) currentHost.isHost = false;

    // Asignar nuevo host
    newHost.isHost = true;
    party.hostId = newHostId;

    return true;
  }

  /**
   * Expulsar miembro (solo host)
   */
  kickMember(partyId: string, hostId: string, userId: string): boolean {
    const party = this.parties.get(partyId);
    if (!party || party.hostId !== hostId) return false;
    if (userId === hostId) return false; // No puede expulsarse a si mismo

    return this.leaveParty(partyId, userId).success;
  }

  // ==================== Page Management ====================

  /**
   * Actualizar pagina actual (solo host)
   */
  updatePage(partyId: string, userId: string, page: number): { success: boolean; error?: string } {
    const party = this.parties.get(partyId);
    if (!party) return { success: false, error: 'Party not found' };
    if (party.hostId !== userId) return { success: false, error: 'Only host can change page' };

    party.currentPage = page;
    party.lastActivity = new Date();

    // Actualizar pagina de todos los miembros
    party.members.forEach((member) => {
      member.currentPage = page;
    });

    return { success: true };
  }

  /**
   * Sincronizar pagina de un miembro
   */
  syncMemberPage(partyId: string, userId: string, page: number): boolean {
    const party = this.parties.get(partyId);
    if (!party) return false;

    const member = party.members.find((m) => m.userId === userId);
    if (!member) return false;

    member.currentPage = page;
    member.lastSeen = new Date();

    return true;
  }

  // ==================== Message Management ====================

  /**
   * Agregar mensaje a la sala
   */
  addMessage(
    partyId: string,
    userId: string,
    username: string,
    content: string,
    type: 'chat' | 'system' = 'chat',
    avatarUrl?: string
  ): PartyMessage | null {
    const party = this.parties.get(partyId);
    if (!party) return null;

    const message: PartyMessage = {
      id: this.generateMessageId(),
      partyId,
      userId,
      username,
      avatarUrl,
      content,
      type,
      createdAt: new Date(),
    };

    const partyMessages = this.messages.get(partyId);
    if (partyMessages) {
      partyMessages.push(message);

      // Limitar a ultimos 100 mensajes
      if (partyMessages.length > 100) {
        partyMessages.shift();
      }
    }

    party.lastActivity = new Date();

    return message;
  }

  /**
   * Obtener mensajes de una sala
   */
  getMessages(partyId: string, limit: number = 50, offset: number = 0): PartyMessage[] {
    const messages = this.messages.get(partyId) || [];
    return messages.slice(-(offset + limit), -offset || undefined);
  }

  // ==================== Activity & Cleanup ====================

  /**
   * Actualizar actividad de un miembro
   */
  updateMemberActivity(partyId: string, userId: string): boolean {
    const party = this.parties.get(partyId);
    if (!party) return false;

    const member = party.members.find((m) => m.userId === userId);
    if (!member) return false;

    member.lastSeen = new Date();
    party.lastActivity = new Date();

    return true;
  }

  /**
   * Iniciar intervalo de limpieza
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveParties();
      this.cleanupInactiveMembers();
    }, CLEANUP_INTERVAL);
  }

  /**
   * Limpiar parties inactivas
   */
  private cleanupInactiveParties(): void {
    const now = Date.now();
    const partiesToClose: string[] = [];

    this.parties.forEach((party, partyId) => {
      const inactiveTime = now - party.lastActivity.getTime();
      if (inactiveTime > PARTY_INACTIVITY_TIMEOUT) {
        partiesToClose.push(partyId);
      }
    });

    partiesToClose.forEach((partyId) => {
      console.log(`[PartyService] Closing inactive party ${partyId}`);
      this.closeParty(partyId);
    });
  }

  /**
   * Limpiar miembros inactivos
   */
  private cleanupInactiveMembers(): void {
    const now = Date.now();

    this.parties.forEach((party) => {
      const membersToRemove: string[] = [];

      party.members.forEach((member) => {
        if (!member.isOnline) {
          const inactiveTime = now - member.lastSeen.getTime();
          if (inactiveTime > MEMBER_INACTIVITY_TIMEOUT) {
            membersToRemove.push(member.userId);
          }
        }
      });

      membersToRemove.forEach((userId) => {
        console.log(`[PartyService] Removing inactive member ${userId} from party ${party.partyId}`);
        this.leaveParty(party.partyId, userId);
      });
    });
  }

  /**
   * Detener servicio y limpiar
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.parties.clear();
    this.messages.clear();
    this.userPartyMap.clear();
  }

  // ==================== Helpers ====================

  private generatePartyId(): string {
    return `party_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const partyService = new PartyService();
export default partyService;
