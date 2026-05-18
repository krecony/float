export type TransactionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed';

export interface User {
  id: string;
  display_name: string | null;
  legal_name: string | null;
  date_of_birth: string | null;
  id_document_last4: string | null;
  id_verified: boolean;
  id_verified_at: string | null;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  label: string;
  last_four: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  balance_cents: number;
  approval_threshold: number;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export interface Transaction {
  id: string;
  group_id: string;
  amount_cents: number;
  status: TransactionStatus;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface TransactionParticipant {
  transaction_id: string;
  user_id: string;
  share_cents: number | null;
  created_at: string;
}

export interface TransactionApproval {
  transaction_id: string;
  user_id: string;
  approved: boolean;
  created_at: string;
}

export interface GroupMemberWithUser extends GroupMember {
  users: Pick<User, 'id' | 'display_name' | 'legal_name'> | null;
}

export interface GroupOverview {
  group: Group;
  members: GroupMemberWithUser[];
  transactions: Transaction[];
}
