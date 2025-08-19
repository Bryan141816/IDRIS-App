import "./dashboard.scss";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MenuDots } from "../../../components/Page_Furniture/Icons";
import { useUserRoleContext } from "../../../UserRoleContext";
import DownloadableFile from "../../../components/Page_Furniture/Downloadable_File";
import DashboardPieChart from "./Donation_dashboard_piechart";
import pdf_logo from "../files/pdf-logo.png";
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
  getRetentionRate,
  getDonationRecord
} from "../../../API_Handler/donations_donation_handler";
import { StringGradients } from "antd/es/progress/progress";

interface TransparencyReportInterface {
  file_name: string;
  file: string;
}

interface FundingProposalInterface {
  iproposalId: number;
  title: string;
  description: string;
  total_donated: number;
  budgetRequired: number;
  status: string;
  image: string;
}

interface DonationRecord {
  donation_date: Date;
  donor_name: string;
  funding_title: string;
  amount: number;
  donation_kind: string;
  item_description: string;
}

const DonationsDashboard = () => {
  const { userRoles } = useUserRoleContext();
  const [loading, setLoading] = useState(true);

  // TOTAL DONATIONS VARIABLES
  const currentDate = new Date();
  const [activeDonationButton, setDonationButton] = useState<"monthly" | "yearly" | null>("monthly");
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

  type DonationsFilterType = "monthly" | "yearly";
  const handleTotalDonationsFilter = (type: DonationsFilterType) => {
    if (type == "yearly") {
      setDonationsMonth(null);
    } else {
      setDonationsMonth(currentDate.getMonth() + 1);
    }
    setDonationButton(type);
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
  const [donation_retention, setDonationRetention] = useState<number>(0);
  useEffect(() => {
    const fetchRetention = async () => {
      try {
        const response = await getRetentionRate(currentDate.getFullYear());
        if (response && typeof response.data.retention_rate == 'number') {
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

  // =======================================> DONATIONS RECORDS
  const donationsRecordsLimit = 5;
  const [donationRecords, setDonationRecords] = useState<DonationRecord[]>();

  // GET DONATIONS RECORDS
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await getDonationRecord(donationsRecordsLimit);
        setDonationRecords(response.data);
      } catch (error) {
        console.error("Failed to fetch donor count:", error);
        setDonationRecords([]);
      }
    };

    fetchCount();
  }, []);

  // =======================================> FUNDING PROPOSALS
  const fundingProposalsLimit = 4; // Number of fundingproposals per query
  const [fundingProposals, setFundingProposals] = useState<FundingProposalInterface[]>([]);
  const [fundingProposalsPage, setFundingProposalsPage] = useState<number>(1);
  const [fundingProposalMaxPage, setFundingProposalMaxPage] = useState<number>(1);

  // GET FUNDING PROPOSALS
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
              <div className="horizontal-container">
                <p className="title">
                  Overall Donations as of{" "}
                  {donations_month != null && new Date(donations_year, donations_month - 1).toLocaleString("default", {
                    month: "long",
                  })}{" "}
                  {donations_year}

                </p>
                <div className="total_donations_settings">
                  <button
                    className={`prev-page ${activeDonationButton === "monthly" ? "active" : "inactive"}`}
                    onClick={() => handleTotalDonationsFilter("monthly")}
                  >Monthly</button>

                  <button
                    className={`prev-page ${activeDonationButton === "yearly" ? "active" : "inactive"}`}
                    onClick={() => handleTotalDonationsFilter("yearly")}
                  >Yearly</button>
                </div>
              </div>

              <p className="stat-data">
                {new Intl.NumberFormat("en-PH", {
                  style: "currency",
                  currency: "PHP",
                  minimumFractionDigits: 0,
                }).format(total_donations)}
              </p>
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

              {userRoles.includes("finance admin") &&
                <Link to="/transparency_report">
                  <MenuDots />
                </Link>
              }

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

        <DashboardPieChart />

        <h3 className="public-feed-title">Donation Record</h3>
        <div id="donation-record-container">
          {donationRecords && donationRecords.map((donation, index) => (
            <DonationRecord
              key={index}
              donor={donation.donor_name}
              amount={donation.amount}
              site={donation.funding_title}
              date={new Date(donation.donation_date)}
              kind={donation.donation_kind}
              description={donation.item_description}
              className="donation-record"
            />
          ))}
        </div>

        <h3 id="funding-proposals-title" className="public-feed-title">
          Recent Programs:
          {userRoles.includes("finance admin") &&
            <Link to="/donations_management/funding_proposals">
              <div className="icon-container">
                <MenuDots className="menu-icon" />
                Manage
              </div>
            </Link>
          }
        </h3>
        <div id="funding-proposals">
          {fundingProposals.map((funding, index) => (
            <FundingCard
              key={index}
              image={funding.image}
              message={funding.description}
              donated={funding.total_donated}
              target={funding.budgetRequired}
              anchorLink={'/donations_management/funding_donation'}
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

