export type IssueCategory = 
  | 'Pothole'
  | 'Water Leakage'
  | 'Waste Accumulation'
  | 'Broken Road'
  | 'Damaged Light'
  | 'Other';

export type IssueSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type IssueStatus = 'Submitted' | 'Under Review' | 'In Progress' | 'Resolved';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  location: Location;
  lat?: number;
  lng?: number;
  address?: string | null;
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
  reporterId: string;
  reporterName?: string;
  upvotes: number;
  departmentId?: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
}

export interface OfficialMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  receiverName: string;
  content: string;
  createdAt: number;
  read: boolean;
}

