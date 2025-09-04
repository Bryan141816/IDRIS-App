import "./FundingProposals.scss";
import SearchBar from "../../../components/Page_Furniture/Search";
import FilterBar from "../../../components/Page_Furniture/Filter";
import { useUserRoleContext } from "../../../UserRoleContext";
import FundingCard from "./fundingCard";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFundingProposals } from "../../../API_Handler/donations_funding_proposals_handler";

interface Proposal {
  funding_id: number;
  title: string;
  description: string;
  budget_required: number;
  image?: string;
  total_donated?: number;
}

const FundingProposals = () => {
  const { userRoles } = useUserRoleContext();
  const navigate = useNavigate();
  const filterItems = ["Ascending", "Descending"];

  const [filtered, setFiltered] = useState<string>("");
  const [searched, setSearched] = useState<string>("");
  const limit = 6;
  const [page, setPage] = useState<number>(1);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [fundingProposalMaxPage, setFundingProposalMaxPage] = useState<number>(1);

  // NEW: loading / empty flags
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [noResults, setNoResults] = useState<boolean>(false);

  useEffect(() => {
    async function fetchProposals() {
      setIsLoading(true);
      try {
        const data = await getFundingProposals(searched, limit, page);
        const records: Proposal[] = data?.records ?? [];
        const maxPage: number = data?.max_page ?? 1;

        setProposals(records);
        setFundingProposalMaxPage(Math.max(maxPage, 1));
        setNoResults(records.length === 0);
      } catch (error) {
        console.error("Error fetching proposals:", error);
        setProposals([]);
        setFundingProposalMaxPage(1);
        setNoResults(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProposals();
  }, [searched, page]);

  const filteredProposals = proposals
    .filter((p) => p.title.toLowerCase().includes(searched.toLowerCase()))
    .sort((a, b) => {
      if (filtered === "Ascending") return a.budget_required - b.budget_required;
      if (filtered === "Descending") return b.budget_required - a.budget_required;
      return 0;
    });

  type DirectType = "prev" | "next";
  const handleFundingProposalPage = (direct: DirectType) => {
    setPage((prevPage) => {
      if (direct === "prev") return Math.max(prevPage - 1, 1);
      return Math.min(prevPage + 1, fundingProposalMaxPage);
    });
  };

  const nothingToShow = !isLoading && filteredProposals.length === 0;

  return (
    <div id="funding">
      <h3 className="public-feed-title">Funding Proposals</h3>
      <div id="settings-container">
        <SearchBar
          placeholder="Search Proposal"
          value={searched}
          onChange={setSearched}
        />

        <FilterBar items={filterItems} value={filtered} onChange={setFiltered} />

        {(userRoles.includes("finance admin") || userRoles.includes("operations admin")) && (
          <button
            className="green-button"
            onClick={() => navigate("/donations_management/funding_proposals/create")}
          >
            Create New Proposal
          </button>
        )}
      </div>

      { !noResults &&
        <div id="transparency-report-page-control" className="page-contorol">
          <button
            className="prev-page"
            onClick={() => handleFundingProposalPage("prev")}
            disabled={page <= 1 || fundingProposalMaxPage <= 1 || nothingToShow}
          >
            Previous
          </button>
          <p>
            Page: {Math.min(page, fundingProposalMaxPage)}/{fundingProposalMaxPage}
          </p>
          <button
            className="next-page"
            onClick={() => handleFundingProposalPage("next")}
            disabled={page >= fundingProposalMaxPage || fundingProposalMaxPage <= 1 || nothingToShow}
          >
            Next
          </button>
        </div>
      }

      <div id="funding-body">
        {isLoading ? (
          <p id="loading">Loading…</p>
        ) : nothingToShow ? (
          <p id="no-proposals">
            {searched.trim()
              ? `No proposals match “${searched}”`
              : "No proposals found"}
          </p>
        ) : (
          filteredProposals.map((item) => (
            <FundingCard
              key={item.funding_id}
              proposalId={item.funding_id}
              title={item.title}
              description={item.description}
              donated={item.total_donated ?? 0}
              target={item.budget_required}
              image={item.image || undefined}
            />
          ))
        )}
      </div>

      { !noResults &&
        <div id="transparency-report-page-control" className="page-contorol">
          <button
            className="prev-page"
            onClick={() => handleFundingProposalPage("prev")}
            disabled={page <= 1 || fundingProposalMaxPage <= 1 || nothingToShow}
          >
            Previous
          </button>
          <p>
            Page: {Math.min(page, fundingProposalMaxPage)}/{fundingProposalMaxPage}
          </p>
          <button
            className="next-page"
            onClick={() => handleFundingProposalPage("next")}
            disabled={page >= fundingProposalMaxPage || fundingProposalMaxPage <= 1 || nothingToShow}
          >
            Next
          </button>
        </div>
      }
    </div>
  );
};

export default FundingProposals;
