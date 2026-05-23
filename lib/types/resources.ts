export type ResourceType = "DOCTOR" | "INTERPRETER";

export type DoctorRow = {
  id: string;
  type: "DOCTOR";
  name: string;
  specialty: string | null;
  languages: string[];
  phone: string | null;
  email: string | null;
  address: string | null;
  practiceName: string | null;
  notes: string | null;
  isActive: boolean;
  availability: "HIGH" | "MEDIUM" | "LOW" | null;
  acceptsNewPatients: boolean;
  tags: string[];
  latitude: number | null;
  longitude: number | null;
  caseDoctors:
    | {
        caseId: string;
        appointmentDate: Date | null;
        invoiceAmount: number | null;
        invoicePaid: boolean | null;
        case: {
          caseNumber: number;
          status: string;
          patient: {
            pseudonym: string;
          } | null;
        };
      }[]
    | null;
};

export type InterpreterRow = {
  id: string;
  type: "INTERPRETER";
  name: string;
  languages: string[];
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  availability: "HIGH" | "MEDIUM" | "LOW" | null;
  hourlyRate: number | null;
  tags: string[];
  latitude: number | null;
  longitude: number | null;
  caseInterpreters:
    | {
        caseId: string;
        appointmentDate: Date | null;
        cost: number | null;
        invoicePaid: boolean | null;
        case: {
          caseNumber: number;
          status: string;
          patient: {
            pseudonym: string;
          } | null;
        };
      }[]
    | null;
};

export type ResourceRow = DoctorRow | InterpreterRow;
