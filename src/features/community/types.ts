export type CommunityBookStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "changes-requested";

export type EducationLevel =
  | "Undergraduate"
  | "Postgraduate"
  | "Intermediate"
  | "General";

export interface CommunityBook {
  id: string;
  uploaderUid: string;
  uploaderName: string;
  uploaderRole: string;
  uploaderAvatar?: string;
  institutionId: string;
  title: string;
  author: string;
  subject: string;
  description: string;
  category: string;
  department: string;
  educationLevel: EducationLevel;
  coverUrl?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: CommunityBookStatus;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  downloadsCount: number;
  viewsCount: number;
  copyrightAgreed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityBookFilter {
  search?: string;
  category?: string;
  subject?: string;
  department?: string;
  educationLevel?: string;
  status?: CommunityBookStatus | "all";
  uploaderUid?: string;
}

export interface CommunityStats {
  totalBooks: number;
  pendingBooks: number;
  approvedBooks: number;
  rejectedBooks: number;
  totalDownloads: number;
  totalViews: number;
  uniqueUploaders: number;
}
