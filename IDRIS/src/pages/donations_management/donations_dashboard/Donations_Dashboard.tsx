import "./dashboard.scss";
import { useState, useEffect, useRef } from "react";
import dayjs, { Dayjs } from "dayjs";
import { Link, useNavigate } from "react-router-dom";
import { MenuDots } from "../../../components/Page_Furniture/Icons";
import { useUserRoleContext } from "../../../UserRoleContext";
import DashboardPieChart from "./Donation_dashboard_piechart";
import { DonationRecord } from "./DonationRecord";
import { FundingCard } from "./FundingCard";

import {
  getCountofDonors,
  getFundingProposals,
} from "../../../API_Handler/donations_dashboard_handler";

import {
  getTotalDonations,
  getRetentionRate,
  getDonationRecord
} from "../../../API_Handler/donations_donation_handler";

interface FundingProposalInterface {
  funding_id: number;
  title: string;
  description: string;
  total_donated: number;
  budget_required: number;
  status: string;
  image: string;
}

interface DonationRecord {
  donor_name?: string;
  amount?: number | string;
  funding_title?: string;
  donation_date?: Date;
  donation_type?: string;
  item_description?: string;
  className?: string;
}

const DonationsDashboard = () => {
  const navigate = useNavigate();
  const { userRoles } = useUserRoleContext();
  const [loading, setLoading] = useState(true);


  type DirectType = "prev" | "next";

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

  // =======================================> DONATIONS RECORDS
  const donationsRecordsLimit = 5;
  const [donationRecords, setDonationRecords] = useState<DonationRecord[]>();

  // GET DONATIONS RECORDS
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await getDonationRecord(donationsRecordsLimit);
        setDonationRecords(response);
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
        console.log(proposals.records)
        setFundingProposalMaxPage(proposals.max_page);
      } catch (error) {
        console.error("Failed to fetch funding proposals:", error);
      } finally {
        setLoading(false);
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

  // =======================================> Modal Controls
  const [activeModal, setActiveModal] = useState("");
  const closeModal = () => {
    setActiveModal("");
  }
  
  if (loading) return <p>Loading...</p>;
  return (
    <>
      {(activeModal != "donation-report-file") &&
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
            {/* <div id="transparency-report">
            <div className="head-container">
              <p className="title">Transparency Reports</p>

            </div>  
          </div> */}
          </div>

          <h3 className="public-feed-title funding-proposal-titles">Donations Per Site
            {(userRoles.includes("finance admin") || userRoles.includes("operations admin")) &&
              <div className="icon-container closer-texts" onClick={() => navigate("/donation_report")}>
                <MenuDots className="menu-icon" />
                Request Report
              </div>
            }

          </h3>

          <DashboardPieChart />

          <h3 className="public-feed-title">Donation Record</h3>
          <div id="donation-record-container">
            {donationRecords && donationRecords.map((donation, index) => (
              <DonationRecord
                key={index}
                donor_name={donation.donor_name}
                amount={donation.amount}
                funding_title={donation.funding_title}
                donation_date={donation.donation_date ? new Date(donation.donation_date) : undefined}
                donation_type={donation.donation_type}
                item_description={donation.item_description}
                className="donation-record"
              />
            ))}
          </div>

          <h3 id="funding-proposals-title" className="public-feed-title funding-proposal-titles">
            Recent Programs:
            {(userRoles.includes("finance admin") || userRoles.includes("operations admin")) &&
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
                target={funding.budget_required}
                anchorLink={''}
                funding_id={funding.funding_id}
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
      }
    </>
  );
};
export default DonationsDashboard;

