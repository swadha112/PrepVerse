// src/pages/CompaniesPage.tsx
import React from "react";
import CompaniesSection from "../components/CompaniesSection";

const CompaniesPage: React.FC = () => {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 16 }}>All Companies</h1>
      <CompaniesSection />
    </main>
  );
};

export default CompaniesPage;
