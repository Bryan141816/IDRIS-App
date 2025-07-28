import { useState, useEffect } from "react";
import PieChart from "../../../components/Page_Furniture/PieChart";
import { getFundingProposalTotalDonations } from '../../../API_Handler/donations_funding_proposals_handler';

const PieChartSample = {
  labels: ["Site A", "Site B", "Site C"],
  datasets: [25, 25, 50],
  colors: ["#4B91C7", "#7BC8A4", "#F9D57F", "#F27289", "#6B5B95", "#FFB347"]
};

interface FundingChartInterface {
  title: string;
  total_donations: number;
}

const DashboardPieChart = () => {
  const [fundingProposals, setFundingProposals] = useState<FundingChartInterface[]>([]);
  const today = new Date();
  const date_to = today.toISOString().split("T")[0]; // 'YYYY-MM-DD'
  
  const lastYear = new Date();
  lastYear.setFullYear(today.getFullYear() - 1);
  const date_from = lastYear.toISOString().split("T")[0]; // 'YYYY-MM-DD'
    
  useEffect(() => {
    const fetchData = async () => {
      try{
        const response = await getFundingProposalTotalDonations(date_from, date_to);
        PieChartSample.labels = response.map((item: { title: string; }) => item.title);
        PieChartSample.datasets = response.map((item: { total_donated: number; }) => item.total_donated);
      } catch(error){
        console.error("Failed to fetch data:", error);
        setFundingProposals([]);
      }
    }
    fetchData();
  }, [])
  return (
    <div id="donations-pie-chart">
      {/* <p>hello world</p> */}
      <PieChart
        labels={PieChartSample.labels}
        backgroundColor={PieChartSample.colors}
        data={PieChartSample.datasets}
        width={300}
        height={300}
        className="pie-chart"
      />
    </div>
  );
};

export default DashboardPieChart;
