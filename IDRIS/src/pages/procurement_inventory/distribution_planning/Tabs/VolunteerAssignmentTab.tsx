import { useEffect, useState } from "react";
import { AssignVolunteerModal } from "./Modals/AssignVolunteerModal/AssignVolunteerModal";
import { API } from "../../../../API_Handler/Axio_API_Handler";

type Volunteer = {
  last_name: string;
  first_name: string;
};
type VolunteerRecord = {
  role: string;
  volunteer: Volunteer;
};
type TeamData = {
  team_id: number;
  team_name: string;
  team_members: VolunteerRecord[];
  deployment_area: string;
  assignment_duration: number;
  starting_date: string;
};

export const VolunteerAssignmentTab = () => {
  const [activeModal, setActiveModal] = useState("");
  const [teamDatas, setTeamData] = useState<TeamData[]>([]);
  const openModal = (type: string, selectedData: any = null) => {
    setActiveModal(type);
  };
  const closeModal = () => {
    setActiveModal("");
  };
  const refreshTable = async () => {
    try {
      const response = await API.get(
        "/distribution_planning/get_distribution_team",
      );
      console.log(response.data);
      setTeamData(response.data);
    } catch (e: any) {
      console.error("Error fetching distsributions team: " + e);
    }
  };
  useEffect(() => {
    refreshTable();
  }, []);
  return (
    <>
      {activeModal === "assign" && (
        <AssignVolunteerModal onClose={closeModal}></AssignVolunteerModal>
      )}
      <div className="routes-content">
        <div className="section-header">
          <h2>Volunteer Assignment</h2>
          <button className="primary-btn" onClick={() => openModal("assign")}>
            + Assign Volunteer
          </button>
        </div>

        <div className="routes-grid">
          {teamDatas.map((teamData) => (
            <div key={teamData.team_id} className="route-card">
              <div className="route-header">
                <h3>{teamData.team_name}</h3>
              </div>
              <div className="route-details">
                <span>
                  <b>Team Members:</b>
                </span>
                <div
                  style={{
                    width: "100%",
                    marginTop: "5px",
                    border: "1px solid #749ab6",
                    borderRadius: "5px",
                  }}
                >
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
                      {teamData.team_members.map((volunteer) => (
                        <tr>
                          <td style={{ padding: "10px" }}>
                            {volunteer.volunteer.first_name}{" "}
                            {volunteer.volunteer.last_name}
                          </td>
                          <td style={{ padding: "10px" }}>{volunteer.role}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <span>
                  <b>Deployment Area:</b>
                  {teamData.deployment_area}
                </span>

                <span>
                  <b>Assignment Duration:</b>
                  {teamData.assignment_duration}{" "}
                  {teamData.assignment_duration > 1 ? "Days" : "Day"}
                </span>
                <span>
                  <b>Starting Date:</b>
                  {teamData.starting_date}
                </span>
                <div className="route-actions">
                  <button className="secondary-btn">Edit Schedule</button>
                  <button className="primary-btn">View Details</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
