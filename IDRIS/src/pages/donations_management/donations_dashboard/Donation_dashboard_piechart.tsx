import { useState, useEffect } from "react";
import PieChart from "../../../components/Page_Furniture/PieChart";
import { getFundingProposalTotalDonations } from '../../../API_Handler/donations_funding_proposals_handler';

interface FundingChartInterface {
  title: string;
  total_donated: number;
}

const DashboardPieChart = () => {
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [chartData, setChartData] = useState<number[]>([]);

  const chartColors = ["#4B91C7", "#7BC8A4", "#F9D57F", "#F27289", "#6B5B95", "#FFB347"];

  const today = new Date();
  const date_to = today.toISOString().split("T")[0]; // 'YYYY-MM-DD'

  const lastYear = new Date();
  lastYear.setFullYear(today.getFullYear() - 1);
  const date_from = lastYear.toISOString().split("T")[0]; // 'YYYY-MM-DD'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getFundingProposalTotalDonations(date_from, date_to);
        setChartLabels(response.map((item: FundingChartInterface) => item.title));
        setChartData(response.map((item: FundingChartInterface) => item.total_donated));
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setChartLabels([]);
        setChartData([]);
      }
    };
    fetchData();
  }, []);

  return (
    <div id="donations-pie-chart">
      <PieChart
        labels={chartLabels}
        backgroundColor={chartColors}
        data={chartData}
        width={300}
        height={300}
        className="pie-chart"
      />
    </div>
  );
};

export default DashboardPieChart;
