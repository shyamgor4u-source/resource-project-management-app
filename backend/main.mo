import List "mo:core/List";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Order "mo:core/Order";

import Principal "mo:core/Principal";

import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  include MixinStorage();

  // Persistent Storage Elements
  let accessControlState = AccessControl.initState();
  let resources = List.empty<Resource>();
  let timesheetEntriesMap = Map.empty<Text, TimesheetEntry>();
  let projectStoreMap = Map.empty<Text, Project>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Power BI Report Storage
  var powerBIEmbedUrl : ?Text = null;

  // Seeded state flag to prevent re-seeding after first deployment
  var demoSeeded = false;

  // Include Authorization Mixin
  include MixinAuthorization(accessControlState);

  /********* Types **************/
  public type BillabilityStatus = { #billable; #nonBillable };

  public type NonBillableStatus = {
    #availableForDeployment;
    #biBench;
    #partialBench;
    #benchBlocked;
    #maternity;
    #solutionInvestment;
    #deliverySupport;
    #projectBuffer;
  };

  public type ResourceStatus = { #active; #inactive };

  public type Resource = {
    id : Text;
    employeeId : Text;
    name : Text;
    email : Text;
    contactNumber : Text;
    location : Text;
    client : Text;
    project : Text;
    projectId : ?Text;
    projectManager : Text;
    reportingManager : Text;
    deliveryHead : Text;
    billabilityStatus : BillabilityStatus;
    nonBillableStatus : ?NonBillableStatus;
    totalExperience : Text;
    doj : Time.Time;
    assignmentStartDate : Time.Time;
    assignmentEndDate : Time.Time;
    practice : Text;
    primarySkills : [Text];
    secondarySkills : [Text];
    status : ResourceStatus;
    role : Text; // Deprecated but kept for backward compatibility
    department : Text; // Deprecated but kept for backward compatibility
    skillTags : [Text]; // Deprecated but kept for backward compatibility
  };

  module Resource {
    public func compare(r1 : Resource, r2 : Resource) : Order.Order {
      Text.compare(r1.id, r2.id);
    };
  };

  // Timesheet Model
  type TimesheetEntry = {
    id : Text;
    resourceId : Text;
    projectId : Text;
    date : Time.Time;
    hoursLogged : Nat;
    description : Text;
    status : TimesheetStatus;
  };

  type TimesheetStatus = {
    #draft;
    #submitted;
    #approved;
  };

  module TimesheetEntry {
    public func compareByDate(t1 : TimesheetEntry, t2 : TimesheetEntry) : Order.Order {
      Int.compare(t1.date, t2.date);
    };
  };

  // Project Model
  type Project = {
    id : Text;
    name : Text;
    description : Text;
    status : ProjectStatus;
    startDate : Time.Time;
    endDate : Time.Time;
    budget : Nat;
    managerName : Text;
    assignedResourceIds : [Text];
    milestones : [Milestone];
  };

  type ProjectStatus = {
    #planning;
    #active;
    #onHold;
    #completed;
  };

  type Milestone = {
    id : Text;
    title : Text;
    dueDate : Time.Time;
    completed : Bool;
  };

  module Project {
    public func compareByStartDate(p1 : Project, p2 : Project) : Order.Order {
      Int.compare(p1.startDate, p2.startDate);
    };
  };

  public type UserRole = {
    #admin;
    #pmo;
    #pm;
    #deliveryHead;
    #management;
    #employee;
  };

  public type UserProfile = {
    name : Text;
    appRole : UserRole;
  };

  /********* Helper Functions for Authorization **********/

  /// Returns true if the caller is an admin (via AccessControl system role).
  func isSystemAdmin(caller : Principal) : Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  /// Returns true if the caller has at least #user system role.
  func isAuthenticatedUser(caller : Principal) : Bool {
    AccessControl.hasPermission(accessControlState, caller, #user);
  };

  /// Returns the app-level role stored in the caller's UserProfile, if any.
  func getCallerAppRole(caller : Principal) : ?UserRole {
    switch (userProfiles.get(caller)) {
      case (?profile) { ?profile.appRole };
      case (null) { null };
    };
  };

  /// Returns true if the caller is an admin OR has the PMO app role.
  func isAdminOrPMO(caller : Principal) : Bool {
    if (isSystemAdmin(caller)) { return true };
    switch (getCallerAppRole(caller)) {
      case (? #pmo) { true };
      case (? #admin) { true };
      case (_) { false };
    };
  };

  /// Authorize caller as a system-level admin; trap otherwise.
  func authorizeAsAdmin<T>(caller : Principal, action : () -> T) : T {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins have access");
    };
    action();
  };

  /// Authorize caller as an authenticated user (at least #user role); trap otherwise.
  func authorizeAsUser<T>(caller : Principal, action : () -> T) : T {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users have access");
    };
    action();
  };

  /// Authorize caller as admin OR PMO app role; trap otherwise.
  /// Caller must also be an authenticated user.
  func authorizeAsAdminOrPMO<T>(caller : Principal, action : () -> T) : T {
    if (not isAuthenticatedUser(caller)) {
      Runtime.trap("Unauthorized: Only users have access");
    };
    if (not isAdminOrPMO(caller)) {
      Runtime.trap("Unauthorized: Only admins or PMO users can perform this action");
    };
    action();
  };

  /****************** Resource Management *********************/

  public query ({ caller }) func getResources() : async [Resource] {
    authorizeAsUser<[Resource]>(caller, func() { resources.toArray() });
  };

  /// Add a single resource. Permitted for admins and PMO users.
  public shared ({ caller }) func addResource(resource : Resource) : async () {
    authorizeAsAdminOrPMO<()>(caller, func() {
      if (resources.values().any(func(existing) { existing.id == resource.id })) {
        Runtime.trap("Resource with this id already exists!");
      };
      resources.add(resource);
    });
  };

  /// Bulk-add resources. Permitted for admins and PMO users.
  public shared ({ caller }) func addBulkResources(resourceList : [Resource]) : async () {
    authorizeAsAdminOrPMO<()>(caller, func() {
      let newIds = resourceList.map(func(r) { r.id });
      let existingIds = resources.values().map(func(existing) { existing.id }).toArray();

      let duplicates = newIds.filter(
        func(id) {
          switch (resources.values().find(func(res) { res.id == id })) {
            case (?_) { true };
            case (null) { false };
          };
        }
      );

      if (duplicates.size() > 0) {
        Runtime.trap("Resource(s) with id(s) already exist!");
      };

      for (resource in resourceList.values()) {
        resources.add(resource);
      };
    });
  };

  /****************** Timesheets ********************/

  public query ({ caller }) func getTimesheetEntries(resourceId : ?Text, projectId : ?Text, startDate : ?Time.Time, endDate : ?Time.Time) : async [TimesheetEntry] {
    authorizeAsUser<[TimesheetEntry]>(caller, func() {
      var iter = timesheetEntriesMap.values();

      iter := iter.filter(
        func(entry) {
          switch (resourceId, projectId, startDate, endDate) {
            case (?rid, ?pid, ?sd, ?ed) {
              entry.resourceId == rid and entry.projectId == pid and entry.date >= sd and entry.date <= ed
            };
            case (?rid, ?pid, ?sd, null) {
              entry.resourceId == rid and entry.projectId == pid and entry.date >= sd
            };
            case (?rid, ?pid, null, ?ed) {
              entry.resourceId == rid and entry.projectId == pid and entry.date <= ed
            };
            case (?rid, ?pid, null, null) {
              entry.resourceId == rid and entry.projectId == pid
            };
            case (?rid, null, ?sd, ?ed) {
              entry.resourceId == rid and entry.date >= sd and entry.date <= ed
            };
            case (?rid, null, ?sd, null) {
              entry.resourceId == rid and entry.date >= sd
            };
            case (?rid, null, null, ?ed) {
              entry.resourceId == rid and entry.date <= ed
            };
            case (?rid, null, null, null) { entry.resourceId == rid };
            case (null, ?pid, ?sd, ?ed) {
              entry.projectId == pid and entry.date >= sd and entry.date <= ed
            };
            case (null, ?pid, ?sd, null) {
              entry.projectId == pid and entry.date >= sd
            };
            case (null, ?pid, null, ?ed) {
              entry.projectId == pid and entry.date <= ed
            };
            case (null, ?pid, null, null) { entry.projectId == pid };
            case (null, null, ?sd, ?ed) { entry.date >= sd and entry.date <= ed };
            case (null, null, ?sd, null) { entry.date >= sd };
            case (null, null, null, ?ed) { entry.date <= ed };
            case (null, null, null, null) { true };
          };
        }
      );

      iter.toArray().sort(TimesheetEntry.compareByDate);
    });
  };

  /****************** Projects ***********************/

  public query ({ caller }) func getProjects(status : ?ProjectStatus, managerName : ?Text, startDate : ?Time.Time, endDate : ?Time.Time) : async [Project] {
    authorizeAsUser<[Project]>(caller, func() {
      var iter = projectStoreMap.values();

      // Filter by status if provided
      if (status != null) {
        iter := iter.filter(
          func(p) {
            switch (status) {
              case (?s) { p.status == s };
              case (null) { true };
            };
          }
        );
      };

      // Filter by managerName if provided
      if (managerName != null) {
        iter := iter.filter(
          func(p) {
            switch (managerName) {
              case (?m) { p.managerName == m };
              case (null) { true };
            };
          }
        );
      };

      // Filter by date range if provided
      if (startDate != null or endDate != null) {
        iter := iter.filter(
          func(p) {
            switch (startDate, endDate) {
              case (?s, ?e) { p.startDate >= s and p.endDate <= e };
              case (null, ?e) { p.endDate <= e };
              case (?s, null) { p.startDate >= s };
              case (null, null) { true };
            };
          }
        );
      };

      iter.toArray().sort(Project.compareByStartDate);
    });
  };

  /// Create a new project. Permitted for admins and PMO users.
  public shared ({ caller }) func addProject(project : Project) : async () {
    authorizeAsAdminOrPMO<()>(caller, func() {
      if (projectStoreMap.get(project.id) != null) {
        Runtime.trap("Project with this id already exists!");
      };
      projectStoreMap.add(project.id, project);
    });
  };

  /// Bulk-add projects. Permitted for admins and PMO users.
  public shared ({ caller }) func addBulkProjects(projectList : [Project]) : async () {
    authorizeAsAdminOrPMO<()>(caller, func() {
      let duplicates = projectList.filter(
        func(p) { projectStoreMap.get(p.id) != null }
      );
      if (duplicates.size() > 0) {
        Runtime.trap("Project(s) with id(s) already exist!");
      };
      for (project in projectList.values()) {
        projectStoreMap.add(project.id, project);
      };
    });
  };

  /// Update an existing project. Permitted for admins and PMO users.
  public shared ({ caller }) func updateProject(project : Project) : async () {
    authorizeAsAdminOrPMO<()>(caller, func() {
      if (projectStoreMap.get(project.id) == null) {
        Runtime.trap("Project with this id does not exist!");
      };
      projectStoreMap.add(project.id, project);
    });
  };

  /****************** User Profiles ******************/

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    authorizeAsUser<?UserProfile>(caller, func() {
      if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
        Runtime.trap("Unauthorized: Can only view your own profile");
      };
      userProfiles.get(user);
    });
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    authorizeAsUser<?UserProfile>(caller, func() {
      userProfiles.get(caller);
    });
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    authorizeAsUser<()>(caller, func() { userProfiles.add(caller, profile) });
  };

  /****************** Power BI Reporting *************/

  public query ({ caller }) func getPowerBIEmbedUrl() : async ?Text {
    authorizeAsUser<?Text>(caller, func() { powerBIEmbedUrl });
  };

  public shared ({ caller }) func setPowerBIEmbedUrl(url : Text) : async () {
    authorizeAsAdmin<()>(caller, func() {
      powerBIEmbedUrl := ?url;
    });
  };
};
