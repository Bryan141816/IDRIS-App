import "./dashboard.scss";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MenuDots } from "../../../components/Page_Furniture/Icons";
import DownloadableFile from "../../../components/Page_Furniture/Downloadable_File";
import pdf_logo from "../files/pdf-logo.png";
import PieChart from "../../../components/Page_Furniture/PieChart";
import { DonationRecord } from "./DonationRecord";
import { FundingCard } from "./FundingCard";
import {
  getCountofDonors,
  getFundingProposals,
} from "../../../API_Handler/donations_dashboard_handler";
import {
  getTransparencyReportsMini,
} from "../../../API_Handler/donations_transparency_report";
import {
  getTotalDonations,
  getRetentionRate
} from "../../../API_Handler/donations_donation_handler";

interface TransparencyReportInterface {
  file_name: string;
  file: string;
}

interface FundingProposalInterface {
  iproposalId: number;
  title: string;
  description: string;
  progress: number;
  budgetRequired: number;
  status: string;
  image: string;
}

const PieChartSample = {
  labels: ["Site A", "Site B", "Site C"],
  datasets: [25, 25, 50],
  colors: ["#4B91C7", "#7BC8A4", "#F9D57F"],
};

const DonationRecordSample = [
  {
    donor: "Clement",
    amount: 250000000,
    site: "Site A",
    date: "04/18/2025",
  },
  {
    donor: "Kent",
    amount: 250000,
    site: "Site B",
    date: "04/18/2020",
  },
  {
    donor: "Bryan",
    amount: 500000,
    site: "Site C",
    date: "01/01/2000",
  },
  {
    donor: "Anonymous",
    amount: 500000,
    site: "Site C",
    date: "12/01/2000",
  },
];

const DonationsDashboard = () => {
  const [loading, setLoading] = useState(true);

  // TOTAL DONATIONS VARIABLES
  const currentDate = new Date();
  const [total_donations, setTotalDonations] = useState<number>(0);
  const [donations_year, setDonationsYear] = useState<number>(currentDate.getFullYear());
  const [donations_month, setDonationsMonth] = useState<number | null>(currentDate.getMonth() + 1);

  let statistics = {
    overall_donations: 1000000,
    retention: 78,
  };

  // GET TOTAL DONATIONS
  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const response = await getTotalDonations(donations_year, donations_month);
        console.log(response);
        if (response && typeof response.data.total_donations === "number") {
          setTotalDonations(response.data.total_donations);
        } else {
          console.error("Invalid response format:", response);
        }
      } catch (error) {
        console.error("Failed to fetch donor count:", error);
      }

    }
    fetchDonations();
  }, [donations_month]);

  type DonationsFilterType = "yearly" | "monthly";
  const handleTotalDonationsFilter = (type: DonationsFilterType) => {
    if(type == "yearly"){
      setDonationsMonth(null);
    } else {
      setDonationsMonth(currentDate.getMonth() + 1);
    }
  }

  // =======================================> TOTAL DONORS
  const [donors_count, setDonorCount] = useState<number>(0);
  //  GET TOTAL DONORS
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await getCountofDonors();
        if (response && typeof response.data.count === "number") {
          setDonorCount(response.data.count);
        } else {
          console.error("Invalid response format:", response);
        }
      } catch (error) {
        console.error("Failed to fetch donor count:", error);
      }
    };

    fetchCount();
  }, []);

  // =======================================> DONATION RETENTION
  const [ donation_retention, setDonationRetention] = useState<number>(0);
  useEffect(() => {
    const fetchRetention = async() =>{
      try{
        const response = await getRetentionRate(currentDate.getFullYear());
        console.log(response.data);
        if(response && typeof response.data.retention_rate == 'number'){
          setDonationRetention(response.data.retention_rate);
        } else {
          console.error("Invalid response format:", response);
        }
      } catch (error) {
        console.error("Failed to fetch donor count:", error);
      }
    }
    fetchRetention();
  }, []);

  // =======================================> TRANSPARENCY REPORT
  const [transparencyReports, setTransparencyReports] = useState<TransparencyReportInterface[]>([]);
  const [selectedTransparencyDate, setSelectedTransparencyDate] = useState("");
  const [transparencyReportPage, setTransparencyReportPage] = useState<number>(1);

  const transparencyReportLimit = 3;
  const [transparencyReportMaxPage, setTransparencyReportMaxPage] = useState<number>(1);

  // GET TRANSPARENCY REPORTS
  useEffect(() => {
    async function fetchReports() {
      try {
        const response = await getTransparencyReportsMini(
          "",
          selectedTransparencyDate,
          transparencyReportPage,
          transparencyReportLimit,
        );
        setTransparencyReportMaxPage(response.max_page);
        setTransparencyReports(response.reports);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, [transparencyReportPage, selectedTransparencyDate]);

  type DirectType = "prev" | "next";
  const handleTransparencyReportPage = (direct: DirectType) => {
    setTransparencyReportPage((prevPage) => {
      if (direct === "prev") {
        return Math.max(prevPage - 1, 1); // Prevent going below page 1
      } else {
        return Math.min(prevPage + 1, transparencyReportMaxPage); // Prevent going above max page
      }
    });
  };

  const fundingProposalsLimit = 4; // Number of fundingproposals per query
  const [fundingProposals, setFundingProposals] = useState<FundingProposalInterface[]>([]);
  const [fundingProposalsPage, setFundingProposalsPage] = useState<number>(1);
  const [fundingProposalMaxPage, setFundingProposalMaxPage] = useState<number>(1);

  // =======================================> GET FUNDING PROPOSALS
  useEffect(() => {
    async function fetchFundingProposals() {
      try {
        const proposals = await getFundingProposals(
          fundingProposalsLimit,
          fundingProposalsPage,
        );
        setFundingProposals(proposals.records);
        setFundingProposalMaxPage(proposals.max_page);
      } catch (error) {
        console.error("Failed to fetch funding proposals:", error);
      }
    }

    fetchFundingProposals();
  }, [fundingProposalsPage]);

  const handleFundingProposalPage = (direct: DirectType) => {
    setFundingProposalsPage((prevPage) => {
      return direct === "prev"
        ? Math.max(prevPage - 1, 1)
        : Math.min(prevPage + 1, fundingProposalMaxPage);
    });
  };

  if (loading) return <p>Loading...</p>;
  return (
    <>
      <div id="dashboard">
        <h3 className="public-feed-title">Donations Statistics</h3>
        <div id="donation-statistic">
          <div id="grid-container">
            <div className="donation-stat-card large">
              <p className="title">
                Overall Donations as of{" "}
                {donations_month != null && new Date(donations_year, donations_month - 1).toLocaleString("default", {
                  month: "long",
                })}{" "}
                {donations_year}
              </p>
              <p className="stat-data">
                {new Intl.NumberFormat("en-PH", {
                  style: "currency",
                  currency: "PHP",
                  minimumFractionDigits: 0,
                }).format(total_donations)}
              </p>
              <div className="total_donations_settings">
                <button onClick={() => handleTotalDonationsFilter("monthly")}>Monthly</button>
                <button onClick={() => handleTotalDonationsFilter("yearly")}>Yearly</button>
              </div>
            </div>

            <div className="donation-stat-card">
              <p className="title">Total Donors</p>
              <p className="stat-data">{donors_count}</p>
            </div>
            <div className="donation-stat-card">
              <p className="title">Donor Retention</p>
              <p className="stat-data">{donation_retention}%</p>
            </div>
          </div>
          <div id="transparency-report">
            <div className="head-container">
              <p className="title">Transparency Reports</p>
              <Link to="/transparency_report">
                <MenuDots />
              </Link>
            </div>
            <input
              type="date"
              id="t-report-date"
              className="entry no-icon"
              placeholder=" "
              value={selectedTransparencyDate}
              onChange={(e) => setSelectedTransparencyDate(e.target.value)}
            />
            {transparencyReports.map((report, index) => (
              <DownloadableFile
                key={index}
                icon={pdf_logo}
                filename={report.file_name}
                fileUrl={report.file}
                className="transparency-report-file"
              />
            ))}

            <div id="transparency-report-page-control" className="page-contorol">
              <button
                className="prev-page"
                onClick={() => handleTransparencyReportPage("prev")}
              >
                Previous
              </button>
              <p>
                Page: {transparencyReportPage}/{""}
                {transparencyReportMaxPage}{""}
              </p>
              <button
                className="next-page"
                onClick={() => handleTransparencyReportPage("next")}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <h3 className="public-feed-title">Donations Per Site</h3>
        <div id="donations-pie-chart">
          <PieChart
            labels={PieChartSample.labels}
            backgroundColor={PieChartSample.colors}
            data={PieChartSample.datasets}
            width={300}
            height={300}
            className="pie-chart"
          />
        </div>

        <h3 className="public-feed-title">Donation Record</h3>
        <div id="donation-record-container">
          {DonationRecordSample.map((donation, index) => (
            <DonationRecord
              key={index}
              donor={donation.donor}
              amount={donation.amount}
              site={donation.site}
              date={new Date(donation.date)}
              className="donation-record"
            />
          ))}
        </div>

        <h3 id="funding-proposals-title" className="public-feed-title">
          Recent Programs:
          <Link to="/donations_management/funding_proposals">
            <div className="icon-container">
              <MenuDots className="menu-icon" />
              Manage
            </div>
          </Link>

        </h3>
        <div id="funding-proposals">
          {fundingProposals.map((funding, index) => (
            <FundingCard
              key={index}
              image={funding.image}
              message={funding.description}
              funded={funding.progress}
              target={funding.budgetRequired}
              anchorLink={funding.iproposalId}
              className="funding-item"
            />
          ))}
        </div>
        <div id="funding-proposal-page-control" className="page-contorol">
          <button
            className="prev-page"
            onClick={() => handleFundingProposalPage("prev")}
          >
            Previous
          </button>
          <p>
            Page: {fundingProposalsPage}/{""}
            {fundingProposalMaxPage}{""}
          </p>
          <button
            className="next-page"
            onClick={() => handleFundingProposalPage("next")}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default DonationsDashboard;

