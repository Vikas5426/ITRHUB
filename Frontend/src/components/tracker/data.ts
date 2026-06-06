export type UserProfile = 'Salaried' | 'Freelancer' | 'Business';

export type DeadlineStatus = 'Upcoming' | 'Due Soon' | 'Overdue' | 'Done';

export interface Deadline {
  id: string;
  name: string;
  date: string; // ISO date string YYYY-MM-DD
  displayDate: string;
  percentage?: string;
  applicableProfiles: UserProfile[];
  penalty: string;
  type: 'Advance Tax' | 'ITR' | 'Audit' | 'TDS' | 'Other';
  status?: DeadlineStatus; // Computed dynamically
}

export const DEADLINES_DATA: Deadline[] = [
  {
    id: "adv1",
    name: "Advance Tax Q1",
    percentage: "15%",
    date: "2026-06-15",
    displayDate: "June 15",
    applicableProfiles: ["Freelancer", "Business"],
    penalty: "1% interest per month under Sec 234C.",
    type: "Advance Tax"
  },
  {
    id: "tds1",
    name: "TDS Payment",
    date: "2026-07-07",
    displayDate: "July 7",
    applicableProfiles: ["Business"],
    penalty: "1.5% interest per month for late payment.",
    type: "TDS"
  },
  {
    id: "itr",
    name: "ITR Filing (Non-Audit)",
    date: "2026-07-31",
    displayDate: "July 31",
    applicableProfiles: ["Salaried", "Freelancer", "Business"],
    penalty: "Late fee up to ₹5,000 under Sec 234F. No carry-forward of losses.",
    type: "ITR"
  },
  {
    id: "adv2",
    name: "Advance Tax Q2",
    percentage: "45%",
    date: "2026-09-15",
    displayDate: "Sept 15",
    applicableProfiles: ["Freelancer", "Business"],
    penalty: "1% interest per month under Sec 234C.",
    type: "Advance Tax"
  },
  {
    id: "audit",
    name: "Tax Audit Report",
    date: "2026-09-30",
    displayDate: "Sept 30",
    applicableProfiles: ["Business"],
    penalty: "0.5% of turnover or ₹1.5L max penalty.",
    type: "Audit"
  },
  {
    id: "itr_audit",
    name: "ITR Filing (Audit Cases)",
    date: "2026-10-31",
    displayDate: "Oct 31",
    applicableProfiles: ["Business"],
    penalty: "Late fee up to ₹5,000 under Sec 234F.",
    type: "ITR"
  },
  {
    id: "adv3",
    name: "Advance Tax Q3",
    percentage: "75%",
    date: "2026-12-15",
    displayDate: "Dec 15",
    applicableProfiles: ["Freelancer", "Business"],
    penalty: "1% interest per month under Sec 234C.",
    type: "Advance Tax"
  },
  {
    id: "adv4",
    name: "Advance Tax Q4",
    percentage: "100%",
    date: "2027-03-15",
    displayDate: "Mar 15",
    applicableProfiles: ["Freelancer", "Business"],
    penalty: "1% interest per month under Sec 234B & 234C.",
    type: "Advance Tax"
  },
  {
    id: "belated_itr",
    name: "Belated ITR Filing",
    date: "2027-03-31",
    displayDate: "Mar 31",
    applicableProfiles: ["Salaried", "Freelancer", "Business"],
    penalty: "₹5,000 late fee. Last chance to file for FY25-26.",
    type: "ITR"
  }
];

export function computeStatus(date: string, isDone: boolean = false): DeadlineStatus {
  if (isDone) return 'Done';
  
  const targetDate = new Date(date).getTime();
  const now = new Date().getTime();
  const diffDays = (targetDate - now) / (1000 * 60 * 60 * 24);
  
  if (diffDays < 0) return 'Overdue';
  if (diffDays <= 30) return 'Due Soon';
  return 'Upcoming';
}
