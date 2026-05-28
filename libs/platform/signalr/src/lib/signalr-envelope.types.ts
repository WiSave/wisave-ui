export interface ISignalREnvelope<TPayload = unknown> {
  eventId: string;
  domain: string;
  eventType: string;
  occurredAt: string;
  entityId: string | null;
  payload: TPayload;
}

export const SIGNALR_HUB_METHOD = 'realtimeEvent' as const;
