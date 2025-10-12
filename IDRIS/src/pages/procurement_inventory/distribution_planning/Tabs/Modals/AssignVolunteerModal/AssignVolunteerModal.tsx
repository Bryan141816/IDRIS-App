import { useEffect, useState } from "react";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";
interface AssignVolunteerModalProp {
  onClose: () => void;
}
const volunteers = [
  {
    id: 1,
    name: "Juan Dela Cruz",
    role: "Team Leader",
    status: "Available",
    area: "Cebu City",
  },
  {
    id: 2,
    name: "Maria Santos",
    role: "Volunteer",
    status: "Deployed",
    area: "Mandaue",
  },
  {
    id: 3,
    name: "Pedro Garcia",
    role: "Driver",
    status: "Available",
    area: "Lapu-Lapu",
  },
  {
    id: 4,
    name: "Ana Reyes",
    role: "Coordinator",
    status: "Available",
    area: "Talisay",
  },
];
export const AssignVolunteerModal: React.FC<AssignVolunteerModalProp> = ({
  onClose,
}) => {
  const [isEditMember, setIsEditMember] = useState(false);

  return (
    <>
      {isEditMember && (
        <SelectVolunteer
          onClose={() => setIsEditMember(false)}
        ></SelectVolunteer>
      )}
      <div className="modal-overlay">
        <div className="modal" style={{ zIndex: 950 }}>
          <div className="modal-header">
            <h3>Assign Volunteer to Deployment Area</h3>
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-content">
            <div className="form-group">
              <label>Team Name</label>
              <input type="text" />
            </div>
            <div className="form-group">
              <label>Team Memebers</label>
              <button
                style={{
                  width: "100%",
                  textAlign: "center",
                  border: "1px solid gray",
                  padding: "10px",
                  borderRadius: "5px",
                }}
                onClick={() => setIsEditMember(true)}
              >
                Edit Members
              </button>

              <div style={{ width: "100%", marginTop: "5px" }}>
                <table style={{ width: "100%" }}>
                  <thead
                    style={{
                      textAlign: "start",
                      padding: "10px",
                      backgroundColor: "#749ab6 ",
                      color: "white",
                    }}
                  >
                    <tr>
                      <th style={{ textAlign: "start", padding: "10px" }}>
                        Name
                      </th>
                      <th style={{ textAlign: "start", padding: "10px" }}>
                        Role
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {volunteers.map((volunteer) => (
                      <tr key={volunteer.id}>
                        <td style={{ padding: "10px" }}>{volunteer.name}</td>
                        <td style={{ padding: "10px" }}>{volunteer.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="form-group">
              <label>Deployment Area</label>
              <input type="text" />
            </div>
            <div className="form-group">
              <label>Assignment Duration *Days</label>
              <input type="number" />
            </div>
            <div className="form-group">
              <label>Assignment Starting Data</label>
              <input type="date" />
            </div>
          </div>
          <div className="modal-actions">
            <button className="secondary-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-btn">Assign</button>
          </div>
        </div>
      </div>
    </>
  );
};
interface SelectVolunteerProp {
  onClose: () => void;
}
const SelectVolunteer: React.FC<SelectVolunteerProp> = ({ onClose }) => {
  type volunteersProp = {
    volunteer_id: number;
    first_name: string;
    last_name: string;
    age: number;
    skills: string;
    gender: string;
    address: string;
  };
  const [volunteersData, setVolunteersData] = useState<volunteersProp[]>([]);
  const fetchData = () => {
    const fetch = async () => {
      try {
        const response = await API.get("/distribution_planning/get_volunteers");

        setVolunteersData(response.data);
      } catch (e: any) {
        console.error("error fetching volunteer: " + e);
      }
    };
    fetch();
  };
  useEffect(() => {
    fetchData();
  }, []);
  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div
        className="modal"
        style={{
          zIndex: 990,
          width: "60% ",
          maxWidth: "1000px",
        }}
      >
        <div className="modal-header">
          <h3>Select Members</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-content">
          {volunteersData && (
            <div style={{ width: "100%" }}>
              <table style={{ width: "100%" }}>
                <thead
                  style={{
                    textAlign: "start",
                    padding: "10px",
                    backgroundColor: "#749ab6 ",
                    color: "white",
                  }}
                >
                  <tr>
                    <th>{"  "}</th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Name
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Address
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>Age</th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Gender
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Skills
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {volunteersData.map((volunteer) => (
                    <tr key={volunteer.volunteer_id}>
                      <td>
                        <input type="checkbox" />
                      </td>
                      <td style={{ padding: "10px" }}>
                        {volunteer.first_name} {volunteer.last_name}
                      </td>
                      <td style={{ padding: "10px" }}>{volunteer.address}</td>
                      <td style={{ padding: "10px" }}>{volunteer.gender}</td>
                      <td style={{ padding: "10px" }}>{volunteer.age}</td>
                      <td style={{ padding: "10px" }}>{volunteer.skills}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn">Select</button>
        </div>
      </div>
    </div>
  );
};
