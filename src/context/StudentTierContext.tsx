"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type StudentTier = "Free" | "Foundation" | "Professional" | "Accelerator";

interface StudentTierContextType {
  tier: StudentTier;
  setTier: (tier: StudentTier) => void;
  isFoundation: boolean;
  isProfessional: boolean;
  isAccelerator: boolean;
}

const StudentTierContext = createContext<StudentTierContextType | undefined>(undefined);

export function StudentTierProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTierState] = useState<StudentTier>("Free");

  useEffect(() => {
    const saved = localStorage.getItem("nc_student_tier") as StudentTier;
    if (saved) setTierState(saved);
  }, []);

  const setTier = (t: StudentTier) => {
    setTierState(t);
    localStorage.setItem("nc_student_tier", t);
  };

  const isFoundation = tier !== "Free";
  const isProfessional = tier === "Professional" || tier === "Accelerator";
  const isAccelerator = tier === "Accelerator";

  return (
    <StudentTierContext.Provider value={{ tier, setTier, isFoundation, isProfessional, isAccelerator }}>
      {children}
    </StudentTierContext.Provider>
  );
}

export function useStudentTier() {
  const context = useContext(StudentTierContext);
  if (context === undefined) {
    throw new Error("useStudentTier must be used within a StudentTierProvider");
  }
  return context;
}
