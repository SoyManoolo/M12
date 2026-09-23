import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '~/hooks/useAuth';
import { useAccessibleDialog } from '~/hooks/useAccessibleDialog';
import SocketService from '~/services/socket.service';
import { VideoCallEvent, type IncomingCallInvitation, type MatchFoundData } from '~/types/videocall.types';

export default function CallInvitationListener() {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [invitation, setInvitation] = useState<IncomingCallInvitation | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const [notice, setNotice] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const acceptRef = useRef<HTMLButtonElement>(null);
  const invitationRef = useRef(invitation);
  invitationRef.current = invitation;

  const rejectCurrentInvitation = useCallback(() => {
    const current = invitationRef.current;
    if (!current) return;
    SocketService.getInstance().emit(VideoCallEvent.CALL_INVITE_RESPONSE, {
      inviteId: current.inviteId,
      accept: false
    });
    setIsResponding(true);
  }, []);

  useAccessibleDialog(Boolean(invitation), dialogRef, rejectCurrentInvitation, acceptRef);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      SocketService.getInstance().disconnect();
      setInvitation(null);
      return;
    }

    const socket = SocketService.getInstance();
    let active = true;
    const handleIncoming = (incoming: IncomingCallInvitation) => {
      if (!incoming?.inviteId || !incoming.caller?.id || incoming.expiresAt <= Date.now()) return;
      setInvitation(incoming);
      setIsResponding(false);
    };
    const handleCancelled = (data: { inviteId?: string; reason?: string }) => {
      if (data?.inviteId !== invitationRef.current?.inviteId) return;
      setInvitation(null);
      setIsResponding(false);
      if (data.reason === 'expired') setNotice('La invitación de llamada caducó.');
    };
    const handleResponseResult = (result: { success?: boolean; message?: string }) => {
      if (result?.success) {
        setInvitation(null);
        setIsResponding(false);
      } else {
        setInvitation(null);
        setIsResponding(false);
        setNotice(result?.message || 'No se pudo responder a la invitación.');
      }
    };
    const handleOutgoingResult = (result: { success?: boolean; message?: string }) => {
      setNotice(result?.success ? 'Invitación enviada. Esperando respuesta…' : result?.message || 'No se pudo enviar la invitación.');
    };
    const handleOutgoingStatus = (result: { status?: string; message?: string }) => {
      if (result?.status === 'accepted') return;
      const messages: Record<string, string> = {
        rejected: 'La invitación fue rechazada.',
        expired: 'La invitación caducó.',
        offline: 'La otra persona no está conectada.',
        cancelled: result?.message || 'La invitación ya no está disponible.'
      };
      setNotice(messages[result?.status || ''] || result?.message || 'La invitación terminó.');
    };
    const handleAccepted = (data: MatchFoundData & { isInitiator: boolean }) => {
      if (!data?.call_id || !data.match?.socketId || !data.self?.socketId) return;
      setInvitation(null);
      setIsResponding(false);
      if (location.pathname === '/videollamada') return;
      try {
        sessionStorage.setItem('friendsgo:accepted-call', JSON.stringify(data));
      } catch {
        setNotice('No se pudo abrir la llamada. Recarga e inténtalo de nuevo.');
        return;
      }
      navigate(`/videollamada?directCall=${encodeURIComponent(data.call_id)}`);
    };

    const registerPresence = () => {
      if (active) socket.emit(VideoCallEvent.REGISTER_CALL_PRESENCE, {});
    };

    const attachListeners = async () => {
      await socket.connect(token);
      if (!active) return;
      socket.on(VideoCallEvent.INCOMING_CALL_INVITE, handleIncoming);
      socket.on(VideoCallEvent.CALL_INVITE_CANCELLED, handleCancelled);
      socket.on(VideoCallEvent.CALL_INVITE_RESPONSE_RESULT, handleResponseResult);
      socket.on(VideoCallEvent.CALL_INVITE_RESULT, handleOutgoingResult);
      socket.on(VideoCallEvent.CALL_INVITE_STATUS, handleOutgoingStatus);
      socket.on(VideoCallEvent.CALL_INVITE_ACCEPTED, handleAccepted);
      socket.onConnect(registerPresence);
    };
    void attachListeners();

    return () => {
      active = false;
      socket.off(VideoCallEvent.INCOMING_CALL_INVITE, handleIncoming);
      socket.off(VideoCallEvent.CALL_INVITE_CANCELLED, handleCancelled);
      socket.off(VideoCallEvent.CALL_INVITE_RESPONSE_RESULT, handleResponseResult);
      socket.off(VideoCallEvent.CALL_INVITE_RESULT, handleOutgoingResult);
      socket.off(VideoCallEvent.CALL_INVITE_STATUS, handleOutgoingStatus);
      socket.off(VideoCallEvent.CALL_INVITE_ACCEPTED, handleAccepted);
    };
  }, [isAuthenticated, location.pathname, navigate, token]);

  useEffect(() => {
    if (!invitation) return;
    const remaining = Math.max(0, invitation.expiresAt - Date.now());
    const timeout = window.setTimeout(() => {
      setInvitation(current => current?.inviteId === invitation.inviteId ? null : current);
      setIsResponding(false);
    }, remaining);
    return () => window.clearTimeout(timeout);
  }, [invitation]);

  const respond = (accept: boolean) => {
    if (!invitation || isResponding) return;
    setIsResponding(true);
    SocketService.getInstance().emit(VideoCallEvent.CALL_INVITE_RESPONSE, {
      inviteId: invitation.inviteId,
      accept
    });
  };

  return (
    <>
      {notice && (
        <div role="status" aria-live="polite" className="fixed bottom-5 right-5 z-[70] max-w-sm rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <span>{notice}</span>
            <button type="button" aria-label="Cerrar aviso" onClick={() => setNotice('')} className="rounded px-2 py-1 text-gray-300 hover:bg-gray-700">×</button>
          </div>
        </div>
      )}
      {invitation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="incoming-call-title" className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/15 text-2xl text-blue-300" aria-hidden="true">☎</div>
            <h2 id="incoming-call-title" className="text-xl font-bold text-white">Videollamada entrante</h2>
            <p className="mt-2 text-gray-300"><span className="font-semibold text-white">@{invitation.caller.username}</span> quiere llamarte.</p>
            <p className="mt-2 text-sm text-gray-400">La invitación caduca en 30 segundos.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button type="button" onClick={() => respond(false)} disabled={isResponding} className="rounded-lg bg-gray-700 px-4 py-2 font-semibold text-white hover:bg-gray-600 disabled:opacity-60">Rechazar</button>
              <button ref={acceptRef} type="button" onClick={() => respond(true)} disabled={isResponding} className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-500 disabled:opacity-60">{isResponding ? 'Enviando…' : 'Aceptar llamada'}</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
