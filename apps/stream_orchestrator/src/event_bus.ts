import EventEmitter from "node:events";
import type { BusEvent } from "./types/bus_event.js";

class Bus extends EventEmitter<BusEvent> {}
export const event_bus = new Bus();
