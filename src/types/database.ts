// Types that describe our Supabase database, in the same shape the
// Supabase CLI generates. Keep in sync with supabase/migrations.
// Regenerate with: npm run db:types  (needs the Supabase CLI + a linked project)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      centres: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          phone: string;
          address: string;
          fee_due_day: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          phone?: string;
          address?: string;
          fee_due_day?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          phone?: string;
          address?: string;
          fee_due_day?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      batches: {
        Row: {
          id: string;
          centre_id: string;
          name: string;
          days: string[];
          start_time: string | null;
          end_time: string | null;
          monthly_fee: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          centre_id?: string;
          name: string;
          days?: string[];
          start_time?: string | null;
          end_time?: string | null;
          monthly_fee?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          centre_id?: string;
          name?: string;
          days?: string[];
          start_time?: string | null;
          end_time?: string | null;
          monthly_fee?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "batches_centre_id_fkey";
            columns: ["centre_id"];
            isOneToOne: false;
            referencedRelation: "centres";
            referencedColumns: ["id"];
          },
        ];
      };
      students: {
        Row: {
          id: string;
          centre_id: string;
          batch_id: string | null;
          name: string;
          class: string;
          parent_name: string;
          parent_whatsapp: string;
          joining_date: string;
          monthly_fee: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          centre_id?: string;
          batch_id?: string | null;
          name: string;
          class?: string;
          parent_name?: string;
          parent_whatsapp: string;
          joining_date?: string;
          monthly_fee?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          centre_id?: string;
          batch_id?: string | null;
          name?: string;
          class?: string;
          parent_name?: string;
          parent_whatsapp?: string;
          joining_date?: string;
          monthly_fee?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "students_batch_id_centre_id_fkey";
            columns: ["batch_id", "centre_id"];
            isOneToOne: false;
            referencedRelation: "batches";
            referencedColumns: ["id", "centre_id"];
          },
        ];
      };
      attendance: {
        Row: {
          id: string;
          centre_id: string;
          batch_id: string;
          student_id: string;
          date: string;
          status: Database["public"]["Enums"]["attendance_status"];
          marked_at: string;
        };
        Insert: {
          id?: string;
          centre_id?: string;
          batch_id: string;
          student_id: string;
          date: string;
          status?: Database["public"]["Enums"]["attendance_status"];
          marked_at?: string;
        };
        Update: {
          id?: string;
          centre_id?: string;
          batch_id?: string;
          student_id?: string;
          date?: string;
          status?: Database["public"]["Enums"]["attendance_status"];
          marked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_centre_id_fkey";
            columns: ["student_id", "centre_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id", "centre_id"];
          },
          {
            foreignKeyName: "attendance_batch_id_centre_id_fkey";
            columns: ["batch_id", "centre_id"];
            isOneToOne: false;
            referencedRelation: "batches";
            referencedColumns: ["id", "centre_id"];
          },
        ];
      };
      fee_records: {
        Row: {
          id: string;
          centre_id: string;
          student_id: string;
          month: string;
          amount_due: number;
          due_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          centre_id?: string;
          student_id: string;
          month: string;
          amount_due: number;
          due_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          centre_id?: string;
          student_id?: string;
          month?: string;
          amount_due?: number;
          due_date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fee_records_student_id_centre_id_fkey";
            columns: ["student_id", "centre_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id", "centre_id"];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          centre_id: string;
          fee_record_id: string;
          amount: number;
          paid_on: string;
          mode: Database["public"]["Enums"]["payment_mode"];
          note: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          centre_id?: string;
          fee_record_id: string;
          amount: number;
          paid_on?: string;
          mode?: Database["public"]["Enums"]["payment_mode"];
          note?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          centre_id?: string;
          fee_record_id?: string;
          amount?: number;
          paid_on?: string;
          mode?: Database["public"]["Enums"]["payment_mode"];
          note?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_fee_record_id_centre_id_fkey";
            columns: ["fee_record_id", "centre_id"];
            isOneToOne: false;
            referencedRelation: "fee_records";
            referencedColumns: ["id", "centre_id"];
          },
        ];
      };
      reminder_logs: {
        Row: {
          id: string;
          centre_id: string;
          student_id: string;
          type: Database["public"]["Enums"]["reminder_type"];
          message: string;
          fee_record_id: string | null;
          sent_at: string;
        };
        Insert: {
          id?: string;
          centre_id?: string;
          student_id: string;
          type: Database["public"]["Enums"]["reminder_type"];
          message: string;
          fee_record_id?: string | null;
          sent_at?: string;
        };
        Update: {
          id?: string;
          centre_id?: string;
          student_id?: string;
          type?: Database["public"]["Enums"]["reminder_type"];
          message?: string;
          fee_record_id?: string | null;
          sent_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reminder_logs_student_id_centre_id_fkey";
            columns: ["student_id", "centre_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id", "centre_id"];
          },
          {
            foreignKeyName: "reminder_logs_fee_record_id_fkey";
            columns: ["fee_record_id"];
            isOneToOne: false;
            referencedRelation: "fee_records";
            referencedColumns: ["id"];
          },
        ];
      };
      tests: {
        Row: {
          id: string;
          centre_id: string;
          batch_id: string;
          name: string;
          subject: string;
          test_date: string;
          max_marks: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          centre_id?: string;
          batch_id: string;
          name: string;
          subject?: string;
          test_date?: string;
          max_marks: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          centre_id?: string;
          batch_id?: string;
          name?: string;
          subject?: string;
          test_date?: string;
          max_marks?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tests_batch_id_centre_id_fkey";
            columns: ["batch_id", "centre_id"];
            isOneToOne: false;
            referencedRelation: "batches";
            referencedColumns: ["id", "centre_id"];
          },
        ];
      };
      test_marks: {
        Row: {
          id: string;
          centre_id: string;
          test_id: string;
          student_id: string;
          marks: number | null;
          absent: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          centre_id?: string;
          test_id: string;
          student_id: string;
          marks?: number | null;
          absent?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          centre_id?: string;
          test_id?: string;
          student_id?: string;
          marks?: number | null;
          absent?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "test_marks_test_id_centre_id_fkey";
            columns: ["test_id", "centre_id"];
            isOneToOne: false;
            referencedRelation: "tests";
            referencedColumns: ["id", "centre_id"];
          },
          {
            foreignKeyName: "test_marks_student_id_centre_id_fkey";
            columns: ["student_id", "centre_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id", "centre_id"];
          },
        ];
      };
    };
    Views: {
      fee_overview: {
        Row: {
          id: string;
          centre_id: string;
          student_id: string;
          month: string;
          amount_due: number;
          due_date: string;
          created_at: string;
          student_name: string;
          student_class: string;
          parent_name: string;
          parent_whatsapp: string;
          batch_id: string | null;
          batch_name: string | null;
          amount_paid: number;
          balance: number;
          last_paid_on: string | null;
          status: FeeStatus;
        };
        Relationships: [];
      };
      student_attendance_stats: {
        Row: {
          student_id: string;
          centre_id: string;
          student_name: string;
          batch_id: string | null;
          is_active: boolean;
          total_days: number;
          present_days: number;
          recent_total: number;
          recent_present: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      generate_monthly_fees: {
        Args: { p_month?: string };
        Returns: number;
      };
      my_centre_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      today_ist: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      attendance_status: "present" | "absent";
      payment_mode: "cash" | "upi" | "bank_transfer";
      reminder_type: "fee" | "absence" | "custom" | "result";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type FeeStatus = "due" | "overdue" | "paid";

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type Views<T extends keyof PublicSchema["Views"]> =
  PublicSchema["Views"][T]["Row"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];

export type Centre = Tables<"centres">;
export type Batch = Tables<"batches">;
export type Student = Tables<"students">;
export type Attendance = Tables<"attendance">;
export type FeeRecord = Tables<"fee_records">;
export type Payment = Tables<"payments">;
export type ReminderLog = Tables<"reminder_logs">;
export type Test = Tables<"tests">;
export type TestMark = Tables<"test_marks">;
export type FeeOverview = Views<"fee_overview">;
export type PaymentMode = Enums<"payment_mode">;
export type ReminderType = Enums<"reminder_type">;
export type AttendanceStatus = Enums<"attendance_status">;
