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
  getFundingProposalMaxPage,
} from "../../../API_Handler/donations_dashboard_handler";
import {
  getTransparencyReportsMini,
  getMaxPage,
} from "../../../API_Handler/donations_transparency_report";

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

  const [donors_count, setDonorCount] = useState<number>(0);
  let statistics = {
    overall_donations: 1000000,
    retention: 78,
  };

  // GET TOTAL DONORS
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

  // TRANSPARENCY REPORT
  const [transparencyReports, setTransparencyReports] = useState<
    TransparencyReportInterface[]
  >([]);
  const [selectedTransparencyDate, setSelectedTransparencyDate] = useState("");
  const [transparencyReportPage, setTransparencyReportPage] =
    useState<number>(1);
  const transparencyReportLimit = 5;
  const [transparencyReportMaxPage, setTransparencyReportMaxPage] =
    useState<number>(1);

  useEffect(() => {
    const fetchMaxPage = async () => {
      try {
        const response = await getMaxPage(transparencyReportLimit);
        if (response && typeof response.count === "number") {
          setTransparencyReportMaxPage(response.count);
        } else {
          console.error("Invalid response format:", response);
        }
      } catch (error) {
        console.error("Failed to fetch donor count:", error);
      }
    };

    fetchMaxPage();
  }, []);

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
        setTransparencyReports(response.data);
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
  const [fundingProposals, setFundingProposals] = useState<
    FundingProposalInterface[]
  >([]);
  const [fundingProposalsPage, setFundingProposalsPage] = useState<number>(1);
  const [fundingProposalMaxPage, setFundingProposalMaxPage] =
    useState<number>(1);

  // GET FUNDING PROPOSALS MAX PAGE
  useEffect(() => {
    async function fetchFundingProposalsMaxPage() {
      try {
        const maxpage = await getFundingProposalMaxPage(fundingProposalsLimit);
        setFundingProposalMaxPage(maxpage.count);
      } catch (error) {
        console.error("Failed to fetch funding proposals max page", error);
      }
    }

    fetchFundingProposalsMaxPage();
  }, []);

  // GET FUNDING PROPOSALS
  useEffect(() => {
    async function fetchFundingProposals() {
      try {
        const proposals = await getFundingProposals(
          fundingProposalsLimit,
          fundingProposalsPage,
        );
        setFundingProposals(proposals);
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
              <p className="title">Overall Donations</p>
              <p className="stat-data">
                {new Intl.NumberFormat("en-PH", {
                  style: "currency",
                  currency: "PHP",
                  minimumFractionDigits: 0,
                }).format(statistics.overall_donations)}
              </p>
            </div>

            <div className="donation-stat-card">
              <p className="title">Total Donors</p>
              <p className="stat-data">{donors_count}</p>
            </div>
            <div className="donation-stat-card">
              <p className="title">Donor Retention</p>
              <p className="stat-data">{statistics.retention}%</p>
            </div>
          </div>
          <div id="transparency-report">
            <p className="title">Transparency Reports</p>
            <Link to="/transparency_report">
              <MenuDots />
            </Link>
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

            <div id="transparency-report-page-control">
              <button
                className="prev-page"
                onClick={() => handleTransparencyReportPage("prev")}
              >
                Previous
              </button>
              <p>
                Page: {transparencyReportPage} /{" "}
                {transparencyReportMaxPage}{" "}
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

        <h3 className="public-feed-title">Recent Programs:</h3>
        <div id="funding-proposals">
          <button
            className="prev-page"
            onClick={() => handleFundingProposalPage("prev")}
          >
            Prev
          </button>
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

