import './funding.scss';
import SearchBar from '../../../components/Page_Furniture/Search';
import FilterBar from '../../../components/Page_Furniture/Filter';
import FundingCard from './fundingCard';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFundingProposals } from '../../../API_Handler/donations_funding_proposals_handler';

interface Proposal {
  proposalId: number;
  title: string;
  description: string;
  budgetRequired: number;
  image?: string;
  donated?: number; // optional unless you're tracking donations
}

const FundingProposals = () => {
  const navigate = useNavigate();
  const filterItems = ["Ascending", "Descending"];

  const [filtered, setFiltered] = useState<string>("");
  const [searched, setSearched] = useState<string>("");
  const [proposals, setProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    async function fetchProposals() {
      try {
        const data = await getFundingProposals(); // or pass search param
        setProposals(data);
        console.log(data);
      } catch (error) {
        console.error('Error fetching proposals:', error);
      }
    }

    fetchProposals();
  }, []);

  const filteredProposals = proposals
    .filter(p => p.title.toLowerCase().includes(searched.toLowerCase()))
    .sort((a, b) => {
      if (filtered === "Ascending") return a.budgetRequired - b.budgetRequired;
      if (filtered === "Descending") return b.budgetRequired - a.budgetRequired;
      return 0;
    });

  return (
    <div id="funding">
      <h3 className="public-feed-title">Funding Proposals</h3>
      <div id="settings-container">
        <SearchBar placeholder="Search Donor" value={searched} onChange={setSearched} />

        <FilterBar items={filterItems} value={filtered} onChange={setFiltered} />
        <button className='green-button' onClick={() => navigate('/donations_management/funding_proposals/create')}>
          Create New Proposal
        </button>
      </div>

      <div id="funding-body">
        {filteredProposals.map((item) => (
          <FundingCard
            key={item.proposalId}
            proposalId={item.proposalId}
            title={item.title}
            description={item.description}
            donated={item.donated ?? 0}
            target={item.budgetRequired}
            image={item.image ? `http://localhost:8000/media/fundingproposals/${item.image}` : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default FundingProposals;
