import { useState, lazy, Suspense } from "react";
import { useUserContext, UserProvider } from "./UserContext";
import { useUserRoleContext, UserRoleProvider } from "./UserRoleContext";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import "./styles/App.scss";

import ProtectedRoute from "./ProtectedRoute";
import Navbar from "./components/Page_Furniture/Navbar";
import Header from "./components/Page_Furniture/Header";
import Footer from "./components/Page_Furniture/Footer";

const Page = lazy(() => import("./components/Pages/Pages"));

const ReportsGeneration = lazy(
  () => import("./pages/reports_generation/reports_generation"),
);
const DamageAssessment = lazy(
  () => import("./pages/damage_assessment/damage_assessment"),
);
const FinanceManagement = lazy(
  () => import("./pages/finance&admin/finance_management/finance_management"),
);
const Login = lazy(() => import("./components/Page_Furniture/Login"));
const Register = lazy(() => import("./components/Page_Furniture/Register"));

//LGU Profilling

const MapOfCebu = lazy(
  () => import("./pages/lgu_profiling/map_of_cebu/MapOfCebu"),
);
const EvacuationAndShelter = lazy(
  () =>
    import(
      "./pages/lgu_profiling/evacuationandshelter/manage_evacuation_and_shelter"
    ),
);
const LGU = lazy(() => import("./pages/lgu_profiling/map_of_cebu/lgu"));
const LGUSeeMore = lazy(
  () => import("./pages/lgu_profiling/map_of_cebu/LGUSeeMore"),
);
const ManageLGU = lazy(
  () => import("./pages/lgu_profiling/LGUmanagement/manage_LGU"),
);
//Volunteer Management
const TrackVolunteerApplication = lazy(
  () =>
    import(
      "./pages/volunteer_management/track_volunteer_application/TrackVolunteerApplication"
    ),
);
const ManageApplicant = lazy(
  () => import("./pages/volunteer_management/manage_applicant/ManageApplicant"),
);
const VolunteerDashboard = lazy(
  () =>
    import(
      "./pages/volunteer_management/volunteer_dashboard/VolunteerDashboard"
    ),
);
const VolunteerProfiles = lazy(
  () =>
    import("./pages/volunteer_management/volunteer_profiles/VolunteerPofiles"),
);
const OrganizationForm = lazy(
  () => import("./pages/volunteer_management/volunteer_form/OrganizationForm"),
);
const OtherOrganizationForm = lazy(
  () =>
    import("./pages/volunteer_management/volunteer_form/otherOrganizationForm"),
);
const IndividualForm = lazy(
  () => import("./pages/volunteer_management/volunteer_form/IndividualForm"),
);
const OtherIndividualForm = lazy(
  () =>
    import("./pages/volunteer_management/volunteer_form/otherIndividualForm"),
);
const ManageVolunteer = lazy(
  () =>
    import("./pages/volunteer_management/manage_volunteers/ManageVolunteer"),
);
const ViewCredentials = lazy(
  () =>
    import("./pages/volunteer_management/manage_applicant/view_credentials"),
);
//Donation Management
const DonationsDashboard = lazy(
  () =>
    import(
      "./pages/donations_management/donations_dashboard/Donations_Dashboard"
    ),
);
const ListOfRAFIDonors = lazy(
  () =>
    import("./pages/donations_management/list_of_rafi_donors/ListOfRAFIDonors"),
);
const FundingProposals = lazy(
  () =>
    import("./pages/donations_management/funding_proposals/FundingProposals"),
);
const CreateFunding = lazy(
  () => import("./pages/donations_management/funding_proposals/CreateFunding"),
);
const UpdateFunding = lazy(
  () => import("./pages/donations_management/funding_proposals/UpdateFunding"),
);
//Response Dashboard
const RouteOutlet = lazy(() => import("./RouteOulet"));

const ResponseDashboard = lazy(
  () => import("./pages/response_dashboard/ResponseDashboard"),
);
const ReportList = lazy(
  () => import("./pages/response_dashboard/report_list/ReportList"),
);
const ModalityDistribution = lazy(
  () =>
    import(
      "./pages/response_dashboard/modality_distribution/ModalityDistribution"
    ),
);
const BudgetRecord = lazy(
  () => import("./pages/response_dashboard/budget_record/BudgetRecord"),
);

//Procurement Inventory
const ProcurementInventory = lazy(
  () =>
    import(
      "./pages/procurement_inventory/procurement_inventory/procurement_inventory"
    ),
);
const DistributionPlanning = lazy(
  () =>
    import(
      "./pages/procurement_inventory/distribution_planning/distribution_planning_and_monitoring"
    ),
);
const ProcurementManagement = lazy(
  () =>
    import(
      "./pages/procurement_inventory/procurement_management/procurement_management"
    ),
);
function App() {
  return (
    <UserProvider>
      <UserRoleProvider>
        <Router>
          <AppRoutes />
        </Router>
      </UserRoleProvider>
    </UserProvider>
  );
}

function AppRoutes() {
  const location = useLocation();
  const { userType } = useUserContext();
  const { userRole } = useUserRoleContext();

  // List of pages where you want to hide both Header and Footer
  const hideHeaderFooterRoutes = ["/lgu_profiling/map_of_cebu"];

  // Check if the current path is one of the pages where you want to hide Header/Footer
  const shouldHideHeaderFooter = hideHeaderFooterRoutes.includes(
    location.pathname,
  );

  const [isNavbarVisible, setIsNavbarVisible] = useState(false);
  const toggleNavbar = () => {
    setIsNavbarVisible((prev) => !prev);
  };

  const shouldHideUI = !userRole || userRole === ""; // (!userType || userType === "") &&

  const closeSidebar = () => setIsNavbarVisible(false);
  return (
    <>
      {!shouldHideUI && (
        <Navbar isVisible={isNavbarVisible} onClose={closeSidebar} />
      )}
      {/* Only show the Header and Footer if the current route isn't '/lgu_profiling/map_of_cebu' */}
      <div id="right-body-section">
        {!shouldHideUI && <Header onIconClick={toggleNavbar} />}
        {/* {!shouldHideHeaderFooter && <Header onIconClick={toggleNavbar}/>} */}
        <main>
          <Suspense fallback={<div>Loading Page</div>}>
            <Routes>
              {/* Public route (Login) */}
              <Route
                path="/"
                element={
                  <Navigate
                    to="/donations_management/donations_dashboard"
                    replace
                  />
                }
              />
              <Route
                path="/login"
                element={
                  <Page title="IDRIS | Login">
                    <Login />
                  </Page>
                }
              />

              <Route
                path="/register"
                element={
                  <Page title="IDRIS | Register">
                    <Register />
                  </Page>
                }
              ></Route>

              {/* Protected routes wrapped in ProtectedRoute */}
              <Route
                path="/lgu_profiling"
                element={
                  <ProtectedRoute>
                    <RouteOutlet />
                  </ProtectedRoute>
                }
              >
                <Route
                  path="map_of_cebu"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Map of Cebu">
                        <MapOfCebu />
                      </Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="evacuationandshelter"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Evacuation and Shelter Management">
                        <EvacuationAndShelter />
                      </Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="LGU"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | LGU">
                        <LGU />
                      </Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="LGUmanagement"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | LGU Management">
                        <ManageLGU />
                      </Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="LGUSeeMore/:lguName"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | LGUSeeMore">
                        <LGUSeeMore />
                      </Page>
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route
                path="/volunteer_management"
                element={
                  <ProtectedRoute>
                    <Page title="IDRIS | Volunteer Management">
                      <RouteOutlet />
                    </Page>
                  </ProtectedRoute>
                }
              >
                <Route
                  path="track_volunteer_application"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Track Volunteer Application">
                        <TrackVolunteerApplication />
                      </Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="volunteer_dashboard"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Volunteer Profiles">
                        <VolunteerDashboard />
                      </Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="organization_form"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Volunteer Application">
                        <OrganizationForm />
                      </Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="otherorganization_form"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Volunteer Application">
                        <OtherOrganizationForm />
                      </Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="individual_form"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Volunteer Application">
                        <IndividualForm />
                      </Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="otherindividual_form"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Volunteer Application">
                        <OtherIndividualForm />
                      </Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="manage_applicant"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Manage Applicant">
                        <ManageApplicant />
                      </Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="view_credentials"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | View Credentials">
                        <ViewCredentials />
                      </Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="volunteer_profiles"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Volunteer Profiles">
                        <VolunteerProfiles />
                      </Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="manage_volunteers"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Manage Volunteer">
                        <ManageVolunteer />
                      </Page>
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route
                path="/donations_management"
                element={
                  <ProtectedRoute>
                    <Page title="IDRIS | Donations Management">
                      <RouteOutlet />
                    </Page>
                  </ProtectedRoute>
                }
              >
                <Route
                  path="donations_dashboard"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Donations Dashboard">
                        <DonationsDashboard />
                      </Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="list_of_rafi_donors"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | List of RAFI Donors">
                        <ListOfRAFIDonors />
                      </Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="funding_proposals"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Funding Proposals">
                        <FundingProposals />
                      </Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="funding_proposals/create"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Create Funding Proposal">
                        <CreateFunding />
                      </Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="funding_proposals/update"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Update Funding Proposal">
                        <UpdateFunding />
                      </Page>
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route
                path="/response_dashboard"
                element={
                  <ProtectedRoute>
                    <Page title="IDRIS | Response Dashboard">
                      <RouteOutlet />
                    </Page>
                  </ProtectedRoute>
                }
              >
                <Route
                  index
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Response Dashboard">
                        <ResponseDashboard />
                      </Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="report_list"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Report List">
                        <ReportList />
                      </Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="modality_distribution"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Modality Distribution">
                        <ModalityDistribution />
                      </Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="budget_record"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Budget Record">
                        <BudgetRecord />
                      </Page>
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route
                path="/reports_generation"
                element={
                  <ProtectedRoute>
                    <Page title="IDRIS | Reports Generation">
                      <ReportsGeneration />
                    </Page>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/damage_assessment"
                element={
                  <ProtectedRoute>
                    <Page title="IDRIS | Damage Assessment">
                      <DamageAssessment />
                    </Page>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/procurement_inventory"
                element={
                  <ProtectedRoute>
                    <Page title="IDRIS | Procurement Inventory">
                      <RouteOutlet />
                    </Page>
                  </ProtectedRoute>
                }
              >
                <Route
                  path="procurement_inventory"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Procurement Inventory">
                        <ProcurementInventory />
                      </Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="distribution_planning"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Distribution Planning">
                        <DistributionPlanning />
                      </Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="procurement_management"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Procurement Management">
                        <ProcurementManagement />
                      </Page>
                    </ProtectedRoute>
                  }
                />
              </Route>
              {userRole == "logistics admin" && (
                <Route
                  path="/finance&admin/finance_management"
                  element={
                    <ProtectedRoute>
                      <Page title="IDRIS | Finance Management">
                        <FinanceManagement />
                      </Page>
                    </ProtectedRoute>
                  }
                />
              )}
              {/* Add more routes as needed */}
            </Routes>
          </Suspense>
        </main>
        {!shouldHideUI && !shouldHideHeaderFooter && <Footer />}
      </div>
    </>
  );
}

export default App;
