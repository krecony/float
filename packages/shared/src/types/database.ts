import type {
  Group,
  GroupMember,
  PaymentMethod,
  Transaction,
  TransactionApproval,
  TransactionParticipant,
  User,
  VirtualCard,
} from './domain';

type TableDef<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      users: TableDef<
        User,
        { id: string } & Partial<Omit<User, 'id' | 'created_at'>>,
        Partial<Omit<User, 'id' | 'created_at'>>
      >;
      payment_methods: TableDef<
        PaymentMethod,
        Omit<PaymentMethod, 'id' | 'created_at'> & { id?: string },
        Partial<Omit<PaymentMethod, 'id' | 'created_at'>>
      >;
      groups: TableDef<
        Group,
        Omit<Group, 'id' | 'created_at'> & { id?: string },
        Partial<Omit<Group, 'id' | 'created_at'>>
      >;
      virtual_cards: TableDef<
        VirtualCard,
        Omit<VirtualCard, 'id' | 'created_at'> & { id?: string },
        Partial<Omit<VirtualCard, 'id' | 'created_at'>>
      >;
      group_members: TableDef<GroupMember, GroupMember, Partial<GroupMember>>;
      transactions: TableDef<
        Transaction,
        Omit<Transaction, 'id' | 'created_at'> & { id?: string },
        Partial<Omit<Transaction, 'id' | 'created_at'>>
      >;
      transaction_participants: TableDef<
        TransactionParticipant,
        TransactionParticipant,
        Partial<TransactionParticipant>
      >;
      transaction_approvals: TableDef<
        TransactionApproval,
        TransactionApproval,
        Partial<TransactionApproval>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
