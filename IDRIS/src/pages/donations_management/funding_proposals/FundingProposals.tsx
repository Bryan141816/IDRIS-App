import "./funding.scss";
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
  total_donated?: number; // optional unless you're tracking donations
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

  useEffect(() => {
    async function fetchProposals() {
      try {
        const data = await getFundingProposals(
          searched,
          limit,
          page
        ); // or pass search param
        console.log(data);
        setFundingProposalMaxPage(data.max_page);
        setProposals(data.records);
      } catch (error) {
        console.error("Error fetching proposals:", error);
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

  // Funding Proposals Page Buttons - Previous & Next
  type DirectType = "prev" | "next";
  const handleFundingProposalPage = (direct: DirectType) => {
    setPage((prevPage) => {
      if (direct === "prev") {
        return Math.max(prevPage - 1, 1); // Prevent going below page 1
      } else {
        return Math.min(prevPage + 1, fundingProposalMaxPage); // Prevent going above max page
      }
    });
  };


  return (
    <div id="funding">
      <h3 className="public-feed-title">Funding Proposals</h3>
      <div id="settings-container">
        <SearchBar
          placeholder="Search Donor"
          value={searched}
          onChange={setSearched}
        />

        <FilterBar
          items={filterItems}
          value={filtered}
          onChange={setFiltered}
        />
        { (userRoles.includes("finance admin") || userRoles.includes("operations admin")) &&
          <button
            className="green-button"
            onClick={() =>
              navigate("/donations_management/funding_proposals/create")
            }
          >
            Create New Proposal
          </button>
        }
      </div>
      <div id="transparency-report-page-control" className="page-contorol">
        <button
          className="prev-page"
          onClick={() => handleFundingProposalPage("prev")}
        >
          Previous
        </button>
        <p>
          Page: {page}/{""}
          {fundingProposalMaxPage}{""}
        </p>
        <button
          className="next-page"
          onClick={() => handleFundingProposalPage("next")}
        >
          Next
        </button>
      </div>

      <div id="funding-body">
        {filteredProposals.map((item, index ) => (
          <FundingCard
            key={item.funding_id}
            proposalId={item.funding_id}
            title={item.title}
            description={item.description}
            donated={item.total_donated ?? 0}
            target={item.budget_required}
            image={item.image ? `${item.image}` : undefined}
          />
        ))}
      </div>

      <div id="transparency-report-page-control" className="page-contorol">
        <button
          className="prev-page"
          onClick={() => handleFundingProposalPage("prev")}
        >
          Previous
        </button>
        <p>
          Page: {page}/{""}
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
  );
};

export default FundingProposals;
