import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface TimesheetEntry {
    id: string;
    status: TimesheetStatus;
    resourceId: string;
    date: Time;
    description: string;
    projectId: string;
    hoursLogged: bigint;
}
export interface Milestone {
    id: string;
    title: string;
    completed: boolean;
    dueDate: Time;
}
export interface Resource {
    id: string;
    doj: Time;
    status: ResourceStatus;
    client: string;
    assignmentStartDate: Time;
    totalExperience: string;
    name: string;
    role: string;
    skillTags: Array<string>;
    projectManager: string;
    deliveryHead: string;
    assignmentEndDate: Time;
    email: string;
    employeeId: string;
    projectId?: string;
    practice: string;
    primarySkills: Array<string>;
    billabilityStatus: BillabilityStatus;
    contactNumber: string;
    department: string;
    secondarySkills: Array<string>;
    location: string;
    nonBillableStatus?: NonBillableStatus;
    project: string;
    reportingManager: string;
}
export interface Project {
    id: string;
    status: ProjectStatus;
    assignedResourceIds: Array<string>;
    endDate: Time;
    name: string;
    description: string;
    budget: bigint;
    startDate: Time;
    milestones: Array<Milestone>;
    managerName: string;
}
export interface UserProfile {
    appRole: UserRole;
    name: string;
}
export enum BillabilityStatus {
    billable = "billable",
    nonBillable = "nonBillable"
}
export enum NonBillableStatus {
    availableForDeployment = "availableForDeployment",
    solutionInvestment = "solutionInvestment",
    biBench = "biBench",
    partialBench = "partialBench",
    projectBuffer = "projectBuffer",
    benchBlocked = "benchBlocked",
    maternity = "maternity",
    deliverySupport = "deliverySupport"
}
export enum ProjectStatus {
    active = "active",
    completed = "completed",
    onHold = "onHold",
    planning = "planning"
}
export enum ResourceStatus {
    active = "active",
    inactive = "inactive"
}
export enum TimesheetStatus {
    submitted = "submitted",
    approved = "approved",
    draft = "draft"
}
export enum UserRole {
    pm = "pm",
    pmo = "pmo",
    admin = "admin",
    deliveryHead = "deliveryHead",
    employee = "employee",
    management = "management"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    /**
     * / Bulk-add projects. Permitted for admins and PMO users.
     */
    addBulkProjects(projectList: Array<Project>): Promise<void>;
    /**
     * / Bulk-add resources. Permitted for admins and PMO users.
     */
    addBulkResources(resourceList: Array<Resource>): Promise<void>;
    /**
     * / Create a new project. Permitted for admins and PMO users.
     */
    addProject(project: Project): Promise<void>;
    /**
     * / Add a single resource. Permitted for admins and PMO users.
     */
    addResource(resource: Resource): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    /**
     * / **************** Power BI Reporting ************
     */
    getPowerBIEmbedUrl(): Promise<string | null>;
    /**
     * / **************** Projects **********************
     */
    getProjects(status: ProjectStatus | null, managerName: string | null, startDate: Time | null, endDate: Time | null): Promise<Array<Project>>;
    /**
     * / **************** Resource Management ********************
     */
    getResources(): Promise<Array<Resource>>;
    /**
     * / **************** Timesheets *******************
     */
    getTimesheetEntries(resourceId: string | null, projectId: string | null, startDate: Time | null, endDate: Time | null): Promise<Array<TimesheetEntry>>;
    /**
     * / **************** User Profiles *****************
     */
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setPowerBIEmbedUrl(url: string): Promise<void>;
    /**
     * / Update an existing project. Permitted for admins and PMO users.
     */
    updateProject(project: Project): Promise<void>;
}
