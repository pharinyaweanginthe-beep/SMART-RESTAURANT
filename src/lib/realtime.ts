import { EventEmitter } from "events";

class RealtimeHub extends EventEmitter {}

const globalRealtime = global as unknown as { realtimeHub: RealtimeHub };

export const realtimeHub = globalRealtime.realtimeHub || new RealtimeHub();
if (process.env.NODE_ENV !== "production") globalRealtime.realtimeHub = realtimeHub;

export const EVENT_ORDER_CREATED = "ORDER_CREATED";
export const EVENT_ORDER_UPDATED = "ORDER_UPDATED";
export const EVENT_KITCHEN_STATUS = "KITCHEN_STATUS";
export const EVENT_INVENTORY_LOW = "INVENTORY_LOW";
export const EVENT_TABLE_UPDATED = "TABLE_UPDATED";
export const EVENT_STAFF_REQUEST = "STAFF_REQUEST";
export const EVENT_BILL_REQUEST = "BILL_REQUEST";
