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
  getDonationRecord,
} from "../../../API_Handler/donations_donation_handler";

import { sampleDonationRecord, sampleFundingProposals } from './dummy_data';

export interface FundingProposalInterface {
  funding_id: number;
  title: string;
  description: string;
  total_donated: number;
  budget_required: number;
  status: string;
  image: string;
}

export interface DonationRecordItem {
  donor_name?: string;
  amount?: number | string;
  funding_title?: string;
  donation_date?: string | Date;
  donation_type?: string;
  item_description?: string;
  className?: string;
}

const DonationsDashboard = () => {
  const navigate = useNavigate();
  const { userRoles } = useUserRoleContext();
  const isAdmin = userRoles.includes("finance admin") || userRoles.includes("operations admin");

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

  // =======================================> DONATIONS RECORDS
  const donationsRecordsLimit = 5;
  const [donationRecords, setDonationRecords] = useState<DonationRecordItem[]>([]); // always an array

  useEffect(() => {
    const fetchDonationRecords = async () => {
      try {
        const response = await getDonationRecord(donationsRecordsLimit);
        const arr = Array.isArray(response) ? response : [];
        // If no records, inject dummy
        setDonationRecords(arr.length > 0 ? arr : sampleDonationRecord);
      } catch (error) {
        console.error("Failed to fetch donation records:", error);
        setDonationRecords(sampleDonationRecord); // fallback to dummy on error
      }
    };

    fetchDonationRecords();
  }, []);

  // =======================================> FUNDING PROPOSALS
  const fundingProposalsLimit = 4;
  const [fundingProposals, setFundingProposals] = useState<FundingProposalInterface[]>([]);
  const [fundingProposalsPage, setFundingProposalsPage] = useState<number>(1);
  const [fundingProposalMaxPage, setFundingProposalMaxPage] = useState<number>(1);

  useEffect(() => {
    async function fetchFundingProposals() {
      try {
        const proposals = await getFundingProposals(fundingProposalsLimit, fundingProposalsPage);
        const records: FundingProposalInterface[] = proposals?.records ?? [];
        const maxPage: number = proposals?.max_page ?? 1;

        if (records.length === 0) {
          // Use dummy programs and lock pagination to 1 page
          setFundingProposals(sampleFundingProposals);
          setFundingProposalMaxPage(1);
        } else {
          setFundingProposals(records);
          setFundingProposalMaxPage(Math.max(maxPage, 1));
        }
      } catch (error) {
        console.error("Failed to fetch funding proposals:", error);
        setFundingProposals(sampleFundingProposals); // fallback to dummy on error
        setFundingProposalMaxPage(1);
      } finally {
        setLoading(false);
      }
    }

    fetchFundingProposals();
  }, [fundingProposalsPage]);

  const handleFundingProposalPage = (direct: "prev" | "next") => {
    setFundingProposalsPage((prevPage) =>
      direct === "prev"
        ? Math.max(prevPage - 1, 1)
        : Math.min(prevPage + 1, fundingProposalMaxPage)
    );
  };

  // =======================================> Helpers
  const safeParseDate = (d?: string | Date) => {
    if (!d) return undefined;
    const parsed = typeof d === "string" ? new Date(d) : d;
    return isNaN(parsed.getTime()) ? undefined : parsed;
  };

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

          <div className="donation-record-container">
            {/* =============== Donation Record (always renders; dummy if empty) =============== */}
            <div id="donation-record-list">
              <h3 className="public-feed-title funding-proposal-titles">Recent Donations</h3>
              {donationRecords.map((donation, index) => (
                <DonationRecordCard
                  key={index}
                  donor_name={donation.donor_name}
                  amount={donation.amount}
                  funding_title={donation.funding_title}
                  donation_date={safeParseDate(donation.donation_date)}
                  donation_type={donation.donation_type}
                  item_description={donation.item_description}
                  className="donation-record"
                />
              ))}
            </div>
          </div>
        </div>

        {/* =============== Recent Programs (always renders; dummy if empty) =============== */}
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

        <div id="funding-proposals">
          {fundingProposals.map((funding, index) => (
            <FundingCard
              key={index}
              image={funding.image}
              message={funding.description}
              donated={funding.total_donated}
              target={funding.budget_required}
              anchorLink={""}
              funding_id={funding.funding_id}
              className="funding-item"
            />
          ))}
        </div>

        <div id="funding-proposal-page-control" className="page-contorol">
          <button
            className="prev-page"
            onClick={() => handleFundingProposalPage("prev")}
            disabled={fundingProposalsPage <= 1 || fundingProposalMaxPage <= 1}
          >
            Previous
          </button>
          <p>
            Page: {Math.min(fundingProposalsPage, fundingProposalMaxPage)}/{fundingProposalMaxPage}
          </p>
          <button
            className="next-page"
            onClick={() => handleFundingProposalPage("next")}
            disabled={fundingProposalsPage >= fundingProposalMaxPage || fundingProposalMaxPage <= 1}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default DonationsDashboard;
