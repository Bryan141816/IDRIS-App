import {FundingProposalInterface, DonationRecordItem} from './DonationsDashboard';

// Sample donation records
export const sampleDonationRecord: DonationRecordItem[] = [
    {
      donor_name: "Anonymous Donor",
      amount: 2500,
      funding_title: "General Operations",
      donation_date: new Date(),
      donation_type: "cash",
    },
    {
      donor_name: "Good Hearts Org.",
      amount: 15000,
      funding_title: "School Supplies Drive",
      donation_date: new Date(Date.now() - 86400000 * 2), // 2 days ago
      donation_type: "inkind",
      item_description: "notebooks, pencils, crayons",
    },
    {
      donor_name: "Maria D.",
      amount: 1000,
      funding_title: "Medical Mission",
      donation_date: new Date(Date.now() - 86400000 * 5), // 5 days ago
      donation_type: "cash",
    },
  ];
  
  // Sample funding proposals
  export const sampleFundingProposals: FundingProposalInterface[] = [
    {
      funding_id: 1001,
      title: "Clean Water Initiative",
      description: "No Funding Proposal Found.",
      total_donated: 75000,
      budget_required: 150000,
      status: "active",
      image: "",
    },
    {
      funding_id: 1002,
      title: "Community Feeding Program",
      description: "No Funding Proposal Found.",
      total_donated: 0,
      budget_required: 80000,
      status: "active",
      image: "",
    },
    {
      funding_id: 1003,
      title: "Disaster Relief Packs",
      description: "No Funding Proposal Found.",
      total_donated: 0,
      budget_required: 250000,
      status: "active",
      image: "",
    },
    {
      funding_id: 1004,
      title: "After-School Tutorials",
      description: "No Funding Proposal Found.",
      total_donated: 0,
      budget_required: 60000,
      status: "active",
      image: "",
    },
  ];