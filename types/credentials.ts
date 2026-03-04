import { Assertion } from "@iblai/iblai-api";

export interface Expires {
    amount: number | null;
    duration: string | null;
}

export interface IssuerDetails {
    name: string;
    org: string;
    entityId: string;
    signatories: any[];
    url: string;
    iconImage: string | null;
    allowed_template_tags: any | null;
}

export interface CredentialCourse {
    name: string;
    course_id: string;
}

export interface CredentialDetails {
    entityId: string;
    name: string;
    name_override: string | null;
    description: string;
    criteriaUrl: string;
    criteriaNarrative: string;
    createdAt: string;
    iconImage: string;
    icon_image_id: number;
    backgroundImage: string | null;
    background_image_id: number | null;
    thumbnailImage: string | null;
    thumbnail_image_id: number | null;
    catalog_items: string[];
    courses: CredentialCourse[];
    programs: any[];
    issuerDetails: IssuerDetails;
    html_template: string | null;
    css_template: string | null;
    metadata: any | null;
    credentialType: string;
    expires: Expires;
    tags: any | null;
    signatories: any[];
    signal: string;
    pathways: any[];
}

export interface CredentialRecipient {
    username: string;
    name: string;
}

export interface CredentialMetadata {
    org_id: string | null;
    assigned_at: string;
    assigned_by: string;
    assignment_id: string;
    issuance_type: string;
    assigned_by_id: number;
}

export interface Credential {
    entityId: string;
    issuedOn: string;
    credentialDetails: CredentialDetails;
    recipient: CredentialRecipient;
    metadata: CredentialMetadata;
    course: CredentialCourse;
    program: any | null;
    narrative: string | null;
    revoked: boolean;
    revocationReason: string | null;
    acceptance: string;
    expires: string | null;
}

export type CredentialsResponse = {
    data: Assertion[];
}


export type CustomAssertion = Assertion & {
    credentialDetails: Record<string, any>
}