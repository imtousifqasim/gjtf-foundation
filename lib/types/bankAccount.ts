export interface BankAccountRecord {
  id: string;
  bank_name: string;
  branch: string;
  account_title: string;
  account_number: string;
  iban: string;
  swift?: string | null;
  currency: string;
  is_active: boolean;
  sort_order: number;
  instructions?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_BANK_ISLAMI: BankAccountRecord = {
  id: "bank-islami-primary",
  bank_name: "Bank Islami",
  branch: "Allama Iqbal Town, Lahore",
  account_title: "Ghais Jhuggi Taleem Foundation",
  account_number: "203756213050001",
  iban: "PK19BKIP0203756213050001",
  swift: "",
  currency: "PKR",
  is_active: true,
  sort_order: 1,
  instructions:
    "Please include your Reference Number (GJTF-YYYY-NNNNNN) in the transfer description/remarks so your pledge can be verified immediately.",
};
