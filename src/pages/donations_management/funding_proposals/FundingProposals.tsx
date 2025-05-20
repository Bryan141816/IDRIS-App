import './funding.scss';
import SearchBar from '../../../components/Page_Furniture/Search';
import FilterBar from '../../../components/Page_Furniture/Filter';
import donationFacility from '../files/donations_facility.png';
import reliefGoods from '../files/donations_facility.png';
import donationBox from '../files/donation_box.png';
import donateKids from '../files/donate_kids.png';
import FundingCard from './fundingCard';
import rescue1 from '../files/rescue1.png';
import rescue2 from '../files/rescue2.png';

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
        image: rescue2,    
        description: "This proposal requests funding to address the urgent food and water needs resulting from severe flooding in rural communities.",
        donated: 120000,
        target: 200000,
    },
    {
        id: 3,
        title: "Restoring Livelihoods and Infrastructure After Typhoon Yolanda in Coastal Communities",
        image: reliefGoods,
        description: "This proposal seeks funding to provide immediate relief assistance to families displaced by devastating landslides in mountainous areas. The intervention includes the distribution of essential items such as food packs, drinking water, and sleeping mats.",
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
        title: "Strengthening Local Disaster Response Capacity Following Earthquake in Cebu City",
        image: donationFacility,
        description: "This proposal aims to mobilize funds for swift humanitarian response and capacity-building in Region X following the recent 6.8 magnitude earthquake. It focuses on search and rescue support, emergency",
        donated: 25000,
        target: 100000,
    },
    {
        id: 6,
        title: "Restoring Livelihoods and Infrastructure After Typhoon Yolanda in Coastal Communities",
        image: donationBox,
        description: "This proposal outlines a plan to support long-term recovery for coastal communities affected by Typhoon Halina. The project will provide cash assistance, rebuild damaged schools and health centers, restore agricultural livelihoods, and offer trauma",
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