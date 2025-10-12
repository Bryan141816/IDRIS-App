import { useEffect, useState, ChangeEvent } from "react";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";
interface AssignVolunteerModalProp {
  onClose: () => void;
}

type Volunteer = {
  volunteer_id: number;
  first_name: string;
  last_name: string;
  age: number;
  skills: string;
  gender: string;
  address: string;
  role?: string;
};
type TeamData = {
  team_name: string;
  team_members: { volunteer_id: number; role: string | undefined }[];
  deployment_area: string;
  assignment_duration: number;
  starting_date: string;
};
export const AssignVolunteerModal: React.FC<AssignVolunteerModalProp> = ({
  onClose,
}) => {
  const [isEditMember, setIsEditMember] = useState(false);

  const [teamMember, setTeamMember] = useState<Volunteer[]>([]);

  const [teamData, setTeamData] = useState<TeamData>({
    team_name: "",
    team_members: [],
    deployment_area: "",
    assignment_duration: 0,
    starting_date: "",
  });

  const handleSelect = (volunteers: Volunteer[]) => {
    // If some volunteers already had roles, keep them
    const merged = volunteers.map((v) => {
      const existing = teamMember.find(
        (tm) => tm.volunteer_id === v.volunteer_id,
      );
      return existing ? existing : { ...v, role: "" };
    });
    setTeamMember(merged);
  };
  const handleRoleChange = (volunteer_id: number, role: string) => {
    setTeamMember((prev) =>
      prev.map((member) =>
        member.volunteer_id === volunteer_id ? { ...member, role } : member,
      ),
    );
  };
  const handleAssign = () => {
    const filteredMember = teamMember.map(({ volunteer_id, role }) => ({
      volunteer_id,
      role,
    }));
    teamData.team_members = filteredMember;
    const submit = async (teamData: TeamData) => {
      try {
        const response = await API.post(
          "/distribution_planning/add_team",
          teamData,
        );
      } catch (e: any) {
        console.error("Error in adding team: " + e);
      }
    };
    submit(teamData);
  };
  const handleInputChanges = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setTeamData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  return (
    <>
      {isEditMember && (
        <SelectVolunteer
          onClose={() => setIsEditMember(false)}
          handleSelect={handleSelect}
          teamMember={teamMember}
        ></SelectVolunteer>
      )}
      <div className="modal-overlay" style={{ zIndex: 900 }}>
        <div className="modal" style={{ zIndex: 900 }}>
          <div className="modal-header">
            <h3>Assign Volunteer to Deployment Area</h3>
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-content">
            <div className="form-group">
              <label>Team Name</label>
              <input
                type="text"
                value={teamData.team_name}
                name="team_name"
                onChange={handleInputChanges}
              />
            </div>
            <div className="form-group">
              <label>Team Members</label>
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
                    {teamMember.map((volunteer) => (
                      <tr key={volunteer.volunteer_id}>
                        <td style={{ padding: "10px" }}>
                          {volunteer.first_name} {volunteer.last_name}
                        </td>
                        <td style={{ padding: "10px" }}>
                          <select
                            value={volunteer.role || ""}
                            onChange={(e) =>
                              handleRoleChange(
                                volunteer.volunteer_id,
                                e.target.value,
                              )
                            }
                          >
                            <option value="">Select Role</option>
                            <option value="team leader">Team Leader</option>
                            <option value="coordinator">Coordinator</option>
                            <option value="volunteer">Volunteer</option>
                            <option value="driver">Driver</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="form-group">
              <label>Deployment Area</label>
              <input
                type="text"
                value={teamData.deployment_area}
                name="deployment_area"
                onChange={handleInputChanges}
              />
            </div>
            <div className="form-group">
              <label>Assignment Duration *Days</label>
              <input
                type="number"
                value={teamData.assignment_duration}
                name="assignment_duration"
                onChange={handleInputChanges}
              />
            </div>
            <div className="form-group">
              <label>Assignment Starting Date</label>
              <input
                type="date"
                value={teamData.starting_date}
                name="starting_date"
                onChange={handleInputChanges}
              />
            </div>
          </div>
          <div className="modal-actions">
            <button className="secondary-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-btn" onClick={handleAssign}>
              Assign
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

interface SelectVolunteerProp {
  onClose: () => void;
  handleSelect: (volunteers: Volunteer[]) => void;
  teamMember: Volunteer[];
}

const SelectVolunteer: React.FC<SelectVolunteerProp> = ({
  onClose,
  handleSelect,
  teamMember,
}) => {
  const [volunteersData, setVolunteersData] = useState<Volunteer[]>([]);
  const [selectedVolunteers, setSelectedVolunteers] =
    useState<Volunteer[]>(teamMember);

  const fetchData = async () => {
    try {
      const response = await API.get("/distribution_planning/get_volunteers");
      setVolunteersData(response.data);
    } catch (e: any) {
      console.error("error fetching volunteer: " + e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckboxChange = (volunteer: Volunteer, checked: boolean) => {
    if (checked) {
      // add to selected
      setSelectedVolunteers((prev) => [...prev, volunteer]);
    } else {
      // remove from selected
      setSelectedVolunteers((prev) =>
        prev.filter((v) => v.volunteer_id !== volunteer.volunteer_id),
      );
    }
  };

  const handleSelectClick = () => {
    handleSelect(selectedVolunteers);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div
        className="modal"
        style={{
          zIndex: 990,
          width: "60%",
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
                    backgroundColor: "#749ab6",
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
                        <input
                          type="checkbox"
                          checked={selectedVolunteers.some(
                            (v) => v.volunteer_id === volunteer.volunteer_id,
                          )}
                          onChange={(e) =>
                            handleCheckboxChange(volunteer, e.target.checked)
                          }
                        />
                      </td>
                      <td style={{ padding: "10px" }}>
                        {volunteer.first_name} {volunteer.last_name}
                      </td>
                      <td style={{ padding: "10px" }}>{volunteer.address}</td>
                      <td style={{ padding: "10px" }}>{volunteer.age}</td>
                      <td style={{ padding: "10px" }}>{volunteer.gender}</td>
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
          <button className="primary-btn" onClick={handleSelectClick}>
            Select
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectVolunteer;
