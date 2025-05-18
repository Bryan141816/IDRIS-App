import React from 'react';
import { Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

type PieChartProps = {
  labels: string[];
  data: number[];
  backgroundColor: string[];
  width?: number | string;
  height?: number | string;
  className?: string;
};

const PieChart: React.FC<PieChartProps> = ({
  labels,
  data,
  backgroundColor,
  width = 400,
  height = 400,
  className = '',
}) => {

  // Data 
  const chartData: ChartData<'doughnut'> = {
    labels,
    datasets: [
      {
        data,
        backgroundColor,
        hoverOffset: 10,
      },
    ],
  };

  // Chart options
  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.label}: ${context.parsed}`;
          },
        },
      },
    },
  };

  return (
    <div className={className} style={{ width, height }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default PieChart;
