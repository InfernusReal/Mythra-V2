export interface MetricPoint {
  name: string;
  value: number;
  unit: "count" | "milliseconds";
  attributes: Readonly<Record<string, string>>;
}

export interface MetricsSink {
  record(point: MetricPoint): void;
}

export class InMemoryMetricsSink implements MetricsSink {
  readonly points: MetricPoint[] = [];
  record(point: MetricPoint): void {
    this.points.push(structuredClone(point));
  }
}

export const noOpMetrics: MetricsSink = { record: () => undefined };
