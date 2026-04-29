import { useCallback, useEffect, useRef, useState } from 'react';
import type { DailyCall, DailyEventObjectAppMessage } from '@daily-co/daily-js';

// Live captions for video calls.
// - Local: Web Speech API listens to local mic and broadcasts text via Daily sendAppMessage.
// - Remote: subscribes to Daily 'app-message' events to render captions from other participants.
// Browser support: Chrome/Edge (good), Safari (partial), Firefox (no).

export interface CaptionEntry {
  userName: string;
  text: string;
  isFinal: boolean;
  ts: number;
}

interface CaptionMessage {
  type: 'caption';
  text: string;
  isFinal: boolean;
  userName: string;
  ts: number;
}

const CAPTION_TTL_MS = 6000; // hide caption after 6s of silence
const PRUNE_INTERVAL_MS = 1000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSpeechRecognitionClass(): any | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isLiveCaptionsSupported(): boolean {
  return getSpeechRecognitionClass() !== null;
}

interface UseLiveCaptionsOptions {
  callRef: React.MutableRefObject<DailyCall | null>;
  userName: string;
  /** Auto-start broadcasting local captions once joined. Default: true (when supported). */
  autoStart?: boolean;
  /** Recognition language. Default 'en-US'. */
  lang?: string;
  /** Called once per finalized local utterance. Use to persist to DB. */
  onLocalFinal?: (text: string, ts: number) => void;
  /**
   * Signal that the Daily call object is fully joined and ready to send/receive app messages.
   * Required to (re-)attach the app-message listener AFTER the iframe initializes,
   * since callRef.current is null at hook mount time.
   */
  callReady?: boolean;
}

export function useLiveCaptions({
  callRef,
  userName,
  autoStart = true,
  lang = 'en-US',
  onLocalFinal,
  callReady = false,
}: UseLiveCaptionsOptions) {
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);
  const [broadcasting, setBroadcasting] = useState(false);
  const [supported] = useState<boolean>(isLiveCaptionsSupported());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const wantBroadcastRef = useRef<boolean>(false);
  const captionsMapRef = useRef<Map<string, CaptionEntry>>(new Map());
  // True when Daily reports a remote participant as the active speaker.
  // We use this to suppress local broadcasts caused by mic echo of remote audio,
  // which would otherwise be tagged with the local user's name.
  const remoteIsActiveRef = useRef<boolean>(false);
  // Timestamp of the most recent remote caption received via app-message.
  // Used as a secondary echo gate: when the local mic transcribes within ~1.5s
  // after a remote caption arrives, it's almost certainly echo of remote speech.
  // This gate is more reliable than active-speaker-change in Daily iframe mode.
  const lastRemoteCaptionAtRef = useRef<number>(0);

  // ---- Receive remote captions ----
  // Depends on callReady (not callRef) — ref identity never changes, so without
  // this flag the effect runs once at mount when callRef.current is still null,
  // and the listener would never be attached → remote captions silently dropped.
  useEffect(() => {
    if (!callReady) return;
    const call = callRef.current;
    if (!call) return;

    const onMessage = (evt: DailyEventObjectAppMessage | undefined) => {
      const data = evt?.data as CaptionMessage | undefined;
      if (!data || data.type !== 'caption' || typeof data.text !== 'string') return;
      // Mark time of remote caption — drives the echo gate in broadcast()
      lastRemoteCaptionAtRef.current = Date.now();
      const entry: CaptionEntry = {
        userName: data.userName || 'Speaker',
        text: data.text,
        isFinal: !!data.isFinal,
        ts: data.ts || Date.now(),
      };
      captionsMapRef.current.set(entry.userName, entry);
      setCaptions(Array.from(captionsMapRef.current.values()));
    };

    // Track whether the active speaker (per Daily) is local vs remote.
    // Local broadcasts are suppressed while a remote is the active speaker
    // to avoid mic-echo cross-tagging (expert's voice picked up by learner's mic).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onActiveSpeaker = (evt: any) => {
      const activeId = evt?.activeSpeaker?.peerId;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const localId = (call as any).participants?.()?.local?.session_id;
      remoteIsActiveRef.current = !!activeId && !!localId && activeId !== localId;
    };

    call.on('app-message', onMessage);
    call.on('active-speaker-change', onActiveSpeaker);
    return () => {
      call.off('app-message', onMessage);
      call.off('active-speaker-change', onActiveSpeaker);
    };
  }, [callRef, callReady]);

  // ---- Periodic prune of stale captions ----
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [key, entry] of captionsMapRef.current.entries()) {
        if (now - entry.ts > CAPTION_TTL_MS) {
          captionsMapRef.current.delete(key);
          changed = true;
        }
      }
      if (changed) setCaptions(Array.from(captionsMapRef.current.values()));
    }, PRUNE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const onLocalFinalRef = useRef(onLocalFinal);
  useEffect(() => {
    onLocalFinalRef.current = onLocalFinal;
  }, [onLocalFinal]);

  const broadcast = useCallback((text: string, isFinal: boolean) => {
    const call = callRef.current;
    const trimmed = text.trim();
    if (!call || !trimmed) return;
    // Echo suppression — two complementary gates:
    // 1. Daily's active-speaker-change tells us if remote is currently speaking.
    // 2. If we received a remote caption within the last ~1.5s, our local Speech API
    //    is almost certainly transcribing echo of that same remote speech.
    // Either signal is enough to skip — false positives (suppressing real local speech)
    // are rare in turn-taking conversations and far less harmful than mis-attribution.
    const recentRemoteCaption = Date.now() - lastRemoteCaptionAtRef.current < 1500;
    if (remoteIsActiveRef.current || recentRemoteCaption) return;
    const ts = Date.now();
    const msg: CaptionMessage = { type: 'caption', text: trimmed, isFinal, userName, ts };
    try {
      call.sendAppMessage(msg, '*');
    } catch {
      // call may not be in joined state yet
    }
    // Reflect locally so the speaker sees their own caption
    captionsMapRef.current.set(userName, { ...msg, userName });
    setCaptions(Array.from(captionsMapRef.current.values()));
    // Persist hook for parent (DB upload)
    if (isFinal) onLocalFinalRef.current?.(trimmed, ts);
  }, [callRef, userName]);

  const stopBroadcast = useCallback(() => {
    wantBroadcastRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* noop */ }
      recognitionRef.current = null;
    }
    setBroadcasting(false);
  }, []);

  const startBroadcast = useCallback(() => {
    if (!supported) return;
    if (recognitionRef.current) return; // already running

    const SR = getSpeechRecognitionClass();
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let finalText = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t;
        else interim += t;
      }
      if (finalText) broadcast(finalText, true);
      else if (interim) broadcast(interim, false);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (e: any) => {
      if (e?.error === 'no-speech' || e?.error === 'aborted') return;
      console.warn('[live-captions] recognition error:', e?.error);
    };

    recognition.onend = () => {
      // Auto-restart if user still wants broadcasting
      if (wantBroadcastRef.current) {
        try { recognition.start(); } catch { /* race condition; ignore */ }
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      wantBroadcastRef.current = true;
      setBroadcasting(true);
    } catch (err) {
      console.warn('[live-captions] failed to start:', err);
    }
  }, [supported, lang, broadcast]);

  const toggle = useCallback(() => {
    if (broadcasting) stopBroadcast();
    else startBroadcast();
  }, [broadcasting, startBroadcast, stopBroadcast]);

  // Auto-start when call is ready (deferred to avoid sync setState in effect)
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (!autoStart || !supported || autoStartedRef.current) return;
    if (!callRef.current) return;
    autoStartedRef.current = true;
    const id = setTimeout(() => startBroadcast(), 0);
    return () => clearTimeout(id);
  }, [autoStart, supported, callRef, startBroadcast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopBroadcast(); };
  }, [stopBroadcast]);

  return { captions, broadcasting, supported, toggle, startBroadcast, stopBroadcast };
}
