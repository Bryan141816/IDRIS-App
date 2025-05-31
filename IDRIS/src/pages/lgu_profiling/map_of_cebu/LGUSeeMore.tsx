import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/LGUSeeMore.css";

const lguData = [
  {
    lguName: "CebuCity",
    fullName: "Cebu City",
    image: "/images/lgu/cebucity.jpeg"
    ,
    info: {
      Population: "964,169",
      "Contact No": "(032) 253-5000",
      "Local Players in DRR": "CDRRMO, Barangay DRR Officers",
      Schools:
        "University of San Carlos, Cebu Normal University, Cebu Technological University",
      Gyms: "Cebu City Sports Center Gym, Quest Gym Cebu",
      "Local Suppliers": "Local hardware stores, disaster response material suppliers",
      "Hazard Areas": [
        "Flood-prone Area - Near Guadalupe riverbanks",
        "Landslide Area - Mountainous barangays near Transcentral Highway",
      ],
    },
  },
  {
    lguName: "MandaueCity",
    fullName: "Mandaue City",
    image: "/images/lgu/mandaue.jpg",
    info: {
      Population: "364,116",
      "Contact No": "(032) 230-4500",
      "Local Players in DRR": "MCDRRMO, Barangay Response Teams",
      Schools: "University of Cebu, Mandaue City College",
      Gyms: "Mandaue Coliseum, City Sports Complex",
      "Local Suppliers": "Nearby hardware, food suppliers, emergency kit providers",
      "Hazard Areas": ["Flood zones in low-lying barangays", "Fire-prone urban zones"],
    },
  },
];

const LGUSeeMore: React.FC = () => {
  const { lguName } = useParams<{ lguName: string }>();
  const navigate = useNavigate();

  const selectedLGU = lguData.find(
    (lgu) => lgu.lguName.toLowerCase() === (lguName ?? "").toLowerCase()
  );

  if (!selectedLGU) {
    return (
      <div className="lgu-error">
        <h2>LGU Not Found</h2>
        <p>The LGU you are looking for does not exist or the link is invalid.</p>
        <button onClick={() => navigate("/lgu_profiling/map_of_cebu")}>
          Back to Map of Cebu
        </button>
      </div>
    );
  }

  return (
    <div className="lgu-container">
      <button className="back-button" onClick={() => navigate("/lgu_profiling/map_of_cebu")}>
        ← Back 
      </button>

      <h1 className="lgu-title">{selectedLGU.fullName}</h1>

      <img src={selectedLGU.image} alt={selectedLGU.fullName} className="lgu-image" />

      <div className="lgu-grid">
        {Object.entries(selectedLGU.info).map(([key, value]) => (
          <React.Fragment key={key}>
            <div className="lgu-key">{key}:</div>
            <div className="lgu-value">
              {Array.isArray(value) ? (
                <ul>
                  {value.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                value
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default LGUSeeMore;
