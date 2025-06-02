import './funding.scss';
import SearchBar from '../../../components/Page_Furniture/Search';
import FilterBar from '../../../components/Page_Furniture/Filter';
import donationFacility from '../files/onsite.png';
import landslide from '../files/landslide.png';
import coastal from '../files/coastal.png';
import disaster6 from '../files/disaster6.png';
import FundingCard from './fundingCard';
import rescue1 from '../files/rescue4.png';
import fires from '../files/fires.png';

import { useState } from 'react';

const dummyFundingProposals = [
    {
        id: 1,
        title: " Flood-Affected Rural Districts",
        image: rescue1,
        description: "This proposal requests funding to address the urgent food and water needs resulting from severe flooding in rural communities. The project will provide emergency food parcels, clean drinking water through mobile purification units, and essential farming inputs to help over 3,000 affected" +
            "This proposal requests funding to address the urgent food and water needs resulting from severe flooding in rural communities. The project will provide emergency food parcels, clean drinking water through mobile purification units, and essential farming inputs to help over 3,000 affected ... Read more",
        donated: 45000,
        target: 100000,
    },
    {
        id: 2,
        title: "Rapid Emergency Relief and Recovery for Flood-Affected Communities in Cebu City",
        image: fires,
        description: "This proposal requests funding to address the urgent food and water needs resulting from devastating fires in rural communities.",
        donated: 120000,
        target: 200000,
    },
    {
        id: 3,
        title: "Restoring Livelihoods and Infrastructure After Typhoon Yolanda in Coastal Communities",
        image: landslide,
        description: "This proposal seeks funding to provide immediate relief assistance to families displaced by devastating landslides in mountainous areas. The intervention includes the distribution of essential items such as food packs, drinking water, and sleeping mats.",
        donated: 80000,
        target: 80000, // fully funded
    },
    {
        id: 4,
        title: "Rapid Emergency Relief and Recovery for Flood-Affected Communities in Cebu City",
        image: disaster6,
        description: "This proposal seeks funding to provide immediate emergency relief and support early recovery efforts for communities devastated.",
        donated: 15000,
        target: 50000,
    },
    {
        id: 5,
        title: "Strengthening Local Disaster Response Capacity Following Earthquake in Cebu City",
        image: donationFacility,
        description: "This proposal aims to mobilize funds for swift humanitarian response and capacity-building in Region X following the recent 6.8 magnitude earthquake. It focuses on search and rescue support, emergency",
        donated: 25000,
        target: 100000,
    },
    {
        id: 6,
        title: "Restoring Livelihoods and Infrastructure After Typhoon Yolanda in Coastal Communities",
        image: coastal,
        description: "This proposal outlines a plan to support long-term recovery for coastal communities affected by Typhoon Halina. The project will provide cash assistance, rebuild damaged schools and health centers, restore agricultural livelihoods, and offer trauma",
        donated: 25000,
        target: 100000,
    }
];



const FundingProposals = () => {

    const filterItems = ["Ascending", "Descending"];
    const [filtered, setSelectedFilter] = useState<string>("");


    const [searched, searchState] = useState("");
    const [selectedFilter, setSearchedValue] = useState<string>("");

    return (
        <div id="funding">
            <h3 className="public-feed-title">Funding Proposals</h3>
            <div id="settings-container">
                <SearchBar placeholder="Search Donor" value={searched} onChange={searchState} />
                <FilterBar items={filterItems} value={filtered} onChange={() => { setSelectedFilter }} />
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