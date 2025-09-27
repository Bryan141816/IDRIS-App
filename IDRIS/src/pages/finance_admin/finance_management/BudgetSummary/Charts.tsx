import React from "react";
import { formatCurrency } from "../../../helpers";
import {
  Chart as ChartJS,
  registerables,
  type Chart as ChartInstance,
  type ChartData,
  type ChartOptions,
} from "chart.js";

ChartJS.register(...registerables);

const styles: Record<string, React.CSSProperties> = {
  chartContainer: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "0.5rem",
    padding: "1rem",
  },
  chartTitle: { fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" },
  canvas: { display: "block", width: "100%", height: "100%" },
};

export type BarChartData = { name: string; inflow: number; outflow: number };
export type PieChartData = { name: string; value: number };

/* ------------ helpers ------------- */
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/* ---------------- BAR CHART ---------------- */
export const BarChartComponent: React.FC<{
  data?: BarChartData[];
  title?: string;
  exportAsImage?: boolean; // 👈 NEW
}> = ({ data = [], title = "Bar Chart", exportAsImage = false }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const chartRef = React.useRef<ChartInstance<"bar", number[], string> | null>(null);
  const [imgUrl, setImgUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // destroy old
    chartRef.current?.destroy();

    const chartData: ChartData<"bar", number[], string> = {
      labels: data.map((d) => d.name),
      datasets: [
        {
          label: "Inflow",
          data: data.map((d) => d.inflow),
          backgroundColor: "#22c55e",
          borderColor: "#16a34a",
          borderWidth: 1,
        },
        {
          label: "Outflow",
          data: data.map((d) => d.outflow),
          backgroundColor: "#ef4444",
          borderColor: "#dc2626",
          borderWidth: 1,
        },
      ],
    };

    const options: ChartOptions<"bar"> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            label: (context) => {
              const val = context.parsed.y ?? 0;
              return `${context.dataset.label}: ${formatCurrency(val)}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `${formatCurrency((Number(value || 0) / 1000).toFixed(0))}K`,
          },
        },
      },
    };

    chartRef.current = new ChartJS(ctx, { type: "bar", data: chartData, options });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [data]);

  // When export is requested, snapshot chart -> dataURL and show <img>
  React.useEffect(() => {
    let mounted = true;
    const snapshot = async () => {
      if (!exportAsImage) {
        setImgUrl(null);
        return;
      }
      // wait a frame to ensure chart finished drawing
      await nextFrame();
      const url = chartRef.current?.toBase64Image();
      if (mounted) setImgUrl(url || null);
    };
    snapshot();
    return () => { mounted = false; };
  }, [exportAsImage, data]);

  return (
    <div style={styles.chartContainer}>
      <h3 style={styles.chartTitle}>{title}</h3>
      <div style={{ position: "relative", height: "300px" }}>
        {exportAsImage && imgUrl ? (
          <img src={imgUrl} alt={`${title} snapshot`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <canvas ref={canvasRef} style={styles.canvas} />
        )}
      </div>
    </div>
  );
};

/* ---------------- PIE CHART ---------------- */
export const PieChartComponent: React.FC<{
  data?: PieChartData[];
  title?: string;
  exportAsImage?: boolean; // 👈 NEW
}> = ({ data = [], title = "Pie Chart", exportAsImage = false }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const chartRef = React.useRef<ChartInstance<"pie", number[], string> | null>(null);
  const [imgUrl, setImgUrl] = React.useState<string | null>(null);

  const COLORS = ["#ef4444", "#22c55e", "#3b82f6", "#eab308", "#8b5cf6", "#06b6d4"];

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    chartRef.current?.destroy();

    const labels = data.map((d) => d.name);
    const values = data.map((d) => d.value);
    const palette = labels.map((_, i) => COLORS[i % COLORS.length]);

    const chartData: ChartData<"pie", number[], string> = {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: palette,
          borderColor: palette,
          borderWidth: 2,
        },
      ],
    };

    const options: ChartOptions<"pie"> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false, // 👈 important for snapshot
      plugins: {
        legend: {
          position: "bottom",
          labels: { padding: 20, usePointStyle: true },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const ds = context.dataset?.data as number[] | undefined;
              const val = Number(context.parsed) || 0;
              const total = ds?.reduce((s, v) => s + Number(v || 0), 0) ?? 0;
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0.0";
              return `${context.label}: ${formatCurrency(val)} (${pct}%)`;
            },
          },
        },
      },
    };

    chartRef.current = new ChartJS(ctx, { type: "pie", data: chartData, options });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [data]);

  React.useEffect(() => {
    let mounted = true;
    const snapshot = async () => {
      if (!exportAsImage) {
        setImgUrl(null);
        return;
      }
      await nextFrame();
      const url = chartRef.current?.toBase64Image();
      if (mounted) setImgUrl(url || null);
    };
    snapshot();
    return () => { mounted = false; };
  }, [exportAsImage, data]);

  return (
    <div style={styles.chartContainer}>
      <h3 style={styles.chartTitle}>{title}</h3>
      <div style={{ position: "relative", height: "300px" }}>
        {exportAsImage && imgUrl ? (
          <img src={imgUrl} alt={`${title} snapshot`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <canvas ref={canvasRef} style={styles.canvas} />
        )}
      </div>
    </div>
  );
};
