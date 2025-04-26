import './funding.scss';
import SearchBar from '../../../components/Public/Search';
import FilterBar from '../../../components/Public/Filter';
import donationFacility from '../files/donations_facility.png';
import reliefGoods from '../files/donations_facility.png';
import donationBox from '../files/donation_box.png';
import donateKids from '../files/donate_kids.png';
import FundingCard from './fundingCard';

import { useState } from 'react';

const dummyFundingProposals = [
    {
        id: 1,
        title: " Flood-Affected Rural Districts",
        image: donationFacility,        
        description: "This proposal requests funding to address the urgent food and water needs resulting from severe flooding in rural communities. The project will provide emergency food parcels, clean drinking water through mobile purification units, and essential farming inputs to help over 3,000 affected" + 
        "This proposal requests funding to address the urgent food and water needs resulting from severe flooding in rural communities. The project will provide emergency food parcels, clean drinking water through mobile purification units, and essential farming inputs to help over 3,000 affected ... Read more",
        donated: 45000,
        target: 100000,
    },
    {
        id: 2,
        title: "Rapid Emergency Relief and Recovery for Flood-Affected Communities in Cebu City",
        image: donationBox,    
        description: "This proposal requests funding to address the urgent food and water needs resulting from severe flooding in rural communities.",
        donated: 120000,
        target: 200000,
    },
    {
        id: 3,
        title: "Restoring Livelihoods and Infrastructure After Typhoon Yolanda in Coastal Communities",
        image: reliefGoods,
        description: "This proposal outlines a plan to support long-term recovery for coastal communities affected by Typhoon Halina. The project will provide.",
        donated: 80000,
        target: 80000, // fully funded
    },
    {
        id: 4,
        title: "Rapid Emergency Relief and Recovery for Flood-Affected Communities in Cebu City",
        image: donateKids,
        description: "This proposal seeks funding to provide immediate emergency relief and support early recovery efforts for communities devastated.",
        donated: 15000,
        target: 50000,
    },
    {
        id: 5,
        title: "Plant 10,000 Trees Initiative",
        image: "https://source.unsplash.com/400x300/?forest,trees",
        description: "Help us combat climate change by planting thousands of trees across the country.",
        donated: 25000,
        target: 100000,
    }
];


const FundingProposals = () =>{
    const [searched, searchState] = useState("");
    const [selectedFilter, setSelectedFilter] = useState<string>("");

    return(
        <div id="funding">
            <h2>Funding Proposals</h2>
            <div className="page-settings-container">
                <SearchBar placeholder='Search' value={searched} onChange={searchState} />
                <FilterBar items={["Ascending", "Descending"]} value={selectedFilter} onChange={setSelectedFilter} />
            </div>
            <div id="funding-body">
                {dummyFundingProposals.map((item, index) => (
                    <FundingCard 
                        key={index}
                        id={item.id}
                        title={item.title}
                        description={item.description}
                        donated={item.donated}
                        target={item.target}
                        image={item.image}
                    />
                ))}
            </div>
        </div>
    );
}
export default FundingProposals