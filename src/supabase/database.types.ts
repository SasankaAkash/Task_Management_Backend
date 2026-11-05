export type TaskStatus = 'pending' | 'completed';

export type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
};

type TaskInsert = {
  id?: string;
  user_id: string;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  created_at?: string;
  updated_at?: string;
};

type TaskUpdate = Partial<Omit<TaskInsert, 'user_id'>>;

export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: TaskRow;
        Insert: TaskInsert;
        Update: TaskUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { TaskStatus: TaskStatus };
    CompositeTypes: Record<string, never>;
  };
};
