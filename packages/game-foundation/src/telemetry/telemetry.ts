export type TelemetryEvent = {
  name: string;
  props?: Record<string, string | number | boolean | null>;
};

export type Telemetry = {
  track(event: TelemetryEvent): void;
};

export function createNoopTelemetry(): Telemetry {
  return {
    track() {
      // no-op
    },
  };
}



