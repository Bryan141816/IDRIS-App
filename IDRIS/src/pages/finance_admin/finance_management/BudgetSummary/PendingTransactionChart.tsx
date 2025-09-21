import React from "react";
import {
  Chart as ChartJS,
  registerables,
  type Chart as ChartInstance,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import styles from "./Charts.module.scss"; 
ChartJS.register(...registerables);

export type PendingDatum = {
  name: string;
  pending_inflow: number;
  pending_outflow: number;
  denied: number;
};

type Props = {
  data?: PendingDatum[];
  title?: string;
  className?: string; // optional extra class hook
};

const PendingTransactionsChart: React.FC<Props> = ({
  data = [],
  title = "Pending Transactions",
  className,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const chartRef = React.useRef<ChartInstance<"bar", number[], string> | null>(
    null
  );

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Destroy existing chart instance, if any
    chartRef.current?.destroy();

    const chartData: ChartData<"bar", number[], string> = {
      labels: data.map((d) => d.name),
      datasets: [
        {
          label: "Pending Inflow",
          data: data.map((d) => d.pending_inflow),
          backgroundColor: "#fbbf24",
          borderColor: "#111827",
          borderWidth: 1,
        },
        {
          label: "Pending Outflow",
          data: data.map((d) => d.pending_outflow),
          backgroundColor: "#f97316",
          borderColor: "#111827",
          borderWidth: 1,
        },
        {
          label: "Denied",
          data: data.map((d) => d.denied),
          backgroundColor: "#dc2626",
          borderColor: "#111827",
          borderWidth: 1,
        },
      ],
    };

    const options: ChartOptions<"bar"> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            label: (context) => {
              const val = context.parsed.y ?? 0;
              return `${context.dataset.label}: $${Number(val).toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `$${(Number(value || 0) / 1000).toFixed(0)}K`,
          },
        },
      },
    };

    chartRef.current = new ChartJS(ctx, {
      type: "bar",
      data: chartData,
      options,
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [data]);

  return (
    <div className={`${styles.chartContainer} ${className ?? ""}`}>
      <h3 className={styles.chartTitle}>{title}</h3>
      <div className={styles.chartBox}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
    </div>
  );
};

export default PendingTransactionsChart;


// const pendingData: PendingDatum[] = [
//     { name: "GENERAL",        pending_inflow: 12000, pending_outflow: 8000, denied: 1500 },
//     { name: "FOOD & WATER",   pending_inflow:  9000, pending_outflow: 4000, denied:  800 },
//   ];
  
//   <PendingTransactionsChart title="Pending by Allocation" data={pendingData} />;