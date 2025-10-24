import "./DonationsDashboard.scss";
import { useState, useEffect } from "react";
// import dayjs from "dayjs";
import { Link, useNavigate } from "react-router-dom";
import { MenuDots } from "../../../components/Page_Furniture/Icons";
import { useUserRoleContext } from "../../../UserRoleContext";
import DashboardPieChart from "./DonationPieChart";
import { DonationRecord as DonationRecordCard } from "./DonationRecord";
import { FundingCard } from "./FundingCard";

import {
  getCountofDonors,
  getFundingProposals,
} from "../../../API_Handler/donations_dashboard_handler";

import {
  getTotalDonations,
  getRetentionRate,
} from "../../../API_Handler/donations_donation_handler";

import { sampleFundingProposals } from './dummy_data';

export interface FundingProposalInterface {
  funding_id: number;
  title: string;
  description: string;
  total_donated: number;
  budget_required: number;
  status: string;
  image: string;
}

const DonationsDashboard = () => {
  const navigate = useNavigate();
  const { userRoles } = useUserRoleContext();
  const isAdmin = userRoles.includes("finance admin") || userRoles.includes("operations admin") || userRoles.includes("superadmin");

  const [loading, setLoading] = useState(true);

  // TOTAL DONATIONS VARIABLES
  const currentDate = new Date();
  const [activeDonationButton, setDonationButton] = useState<"monthly" | "yearly" | null>("monthly");
  const [total_donations, setTotalDonations] = useState<number>(0);
  const [donations_year, setDonationsYear] = useState<number>(currentDate.getFullYear());
  const [donations_month, setDonationsMonth] = useState<number | null>(currentDate.getMonth() + 1);

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
        console.error("Failed to fetch total donations:", error);
      }
    };
    fetchDonations();
  }, [donations_month, donations_year]);

  type DonationsFilterType = "monthly" | "yearly";
  const handleTotalDonationsFilter = (type: DonationsFilterType) => {
    if (type === "yearly") {
      setDonationsMonth(null);
    } else {
      setDonationsMonth(currentDate.getMonth() + 1);
      setDonationsYear(currentDate.getFullYear());
    }
    setDonationButton(type);
  };

  // =======================================> TOTAL DONORS
  const [donors_count, setDonorCount] = useState<number>(0);
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
        if (response && typeof response.data.retention_rate === "number") {
          setDonationRetention(response.data.retention_rate);
        } else {
          console.error("Invalid response format:", response);
        }
      } catch (error) {
        console.error("Failed to fetch retention rate:", error);
      }
    };
    fetchRetention();
  }, []);

  // =======================================> FUNDING PROPOSALS
  const fundingProposalsLimit = 8;
  const [fundingProposals, setFundingProposals] = useState<FundingProposalInterface[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function fetchFundingProposals() {
      try {
        const proposals = await getFundingProposals(fundingProposalsLimit, 1);
        const records: FundingProposalInterface[] = proposals?.records ?? [];

        if (records.length === 0) {
          // Use dummy programs and lock pagination to 1 page
          setFundingProposals(sampleFundingProposals);
        } else {
          setFundingProposals(records);
        }
      } catch (error) {
        console.error("Failed to fetch funding proposals:", error);
        setFundingProposals(sampleFundingProposals); // fallback to dummy on error
      } finally {
        setLoading(false);
      }
    }

    fetchFundingProposals();
  }, []);

  const handleNavigation = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentIndex((prevIndex) => (prevIndex === 0 ? fundingProposals.length - 1 : prevIndex - 1));
    } else {
      setCurrentIndex((prevIndex) => (prevIndex === fundingProposals.length - 1 ? 0 : prevIndex + 1));
    }
  };

  // =======================================> Helpers
  const safeParseDate = (d?: string | Date) => {
    if (!d) return undefined;
    const parsed = typeof d === "string" ? new Date(d) : d;
    return isNaN(parsed.getTime()) ? undefined : parsed;
  };

  // // Handler for View All button
  // const handleViewAllDonations = () => {
  //   // Update this path to match your donations list/history route
  //   navigate("/donations_management/donation_records");
  // };

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <div id="dashboard">
        <div className="public-feed-title">
          <div className="title-child">
            <h3>Donations Statistics</h3>
          </div>
          {isAdmin && (
            <div className="icon-container closer-texts" onClick={() => navigate("/donation_report")}>
              <MenuDots className="menu-icon" />
              Generate Report
            </div>
          )}
        </div>

        <div id="donation-statistic">
          <div id="grid-container">
            <div className="donation-stat-card">
              <div className="horizontal-container">
                <p className="title">
                  Overall Donations as of{" "}
                  {donations_month != null &&
                    new Date(donations_year, donations_month - 1).toLocaleString("default", {
                      month: "long",
                    })}{" "}
                  {donations_year}
                </p>

                <div className="total_donations_settings">
                  <button
                    className={`prev-page ${activeDonationButton === "monthly" ? "active" : "inactive"}`}
                    onClick={() => handleTotalDonationsFilter("monthly")}
                  >
                    Monthly
                  </button>

                  <button
                    className={`prev-page ${activeDonationButton === "yearly" ? "active" : "inactive"}`}
                    onClick={() => handleTotalDonationsFilter("yearly")}
                  >
                    Yearly
                  </button>
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
        </div>

        <div className="donations-container">
          <div className="donation-pie-chart-container">
            <h3 className="public-feed-title funding-proposal-titles">
              Donation Distribution
            </h3>
            <DashboardPieChart />
          </div>

          {/* =============== Recent Programs (always renders; dummy if empty) =============== */}
          <div id="funding-proposals">
            <div id="funding-proposals-title" className="public-feed-title funding-proposal-titles">
              <div className="title-child">
                <h3>Recent Programs</h3>
              </div>
              {isAdmin && (
                <Link to="/donations_management/funding_proposals">
                  <div className="icon-container">
                    <MenuDots className="menu-icon" />
                    Manage
                  </div>
                </Link>
              )}
            </div>

            {fundingProposals.length > 0 && (
              <FundingCard
                key={currentIndex}
                image={fundingProposals[currentIndex].image}
                message={fundingProposals[currentIndex].description}
                donated={fundingProposals[currentIndex].total_donated}
                target={fundingProposals[currentIndex].budget_required}
                anchorLink={""}
                funding_id={fundingProposals[currentIndex].funding_id}
                className="funding-item"
              />
            )}
            <div id="funding-proposal-page-control" className="page-contorol">
              <button
                className="prev-page"
                onClick={() => handleNavigation("prev")}
                disabled={fundingProposals.length <= 1}
              >
                Previous
              </button>
              <p>
                {currentIndex + 1}/{fundingProposals.length}
              </p>
              <button
                className="next-page"
                onClick={() => handleNavigation("next")}
                disabled={fundingProposals.length <= 1}
              >
                Next
              </button>
            </div>

          </div>

        </div>

      </div>
    </>
  );
};

export default DonationsDashboard;
