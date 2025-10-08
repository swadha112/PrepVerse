import { Search, Filter, X } from "lucide-react";

interface SearchFiltersProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedRole: string;
  setSelectedRole: (r: string) => void;
  selectedDifficulty: string;
  setSelectedDifficulty: (d: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  activeFilters: string[];
  clearFilters: () => void;
  removeFilter: (f: string) => void;
}

const SearchFilters = ({
  searchQuery,
  setSearchQuery,
  selectedRole,
  setSelectedRole,
  selectedDifficulty,
  setSelectedDifficulty,
  sortBy,
  setSortBy,
  activeFilters,
  clearFilters,
  removeFilter,
}: SearchFiltersProps) => {
  return (
    <aside className="pv-card" style={{ padding: 18, borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h4 style={{ margin: 0, color: "var(--pv-ink)", display: "flex", alignItems: "center", gap: 8 }}>
          <Filter className="w-5 h-5" style={{ color: "var(--pv-primary)" }} /> Search & Filters
        </h4>
        {activeFilters.length > 0 && <button className="pv-btn-glass" onClick={clearFilters}>Clear</button>}
      </div>

      <div style={{ position: "relative", marginBottom: 12 }}>
        <Search className="w-4 h-4" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--pv-muted)" }} />
        <input className="pv-field" style={{ paddingLeft: 36 }} placeholder="Search companies, roles, or keywords..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ display: "block", color: "var(--pv-muted)", marginBottom: 8 }}>Role</label>
          <select className="pv-field" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
            <option value="all">Any role</option>
            <option value="frontend">Frontend Engineer</option>
            <option value="backend">Backend Engineer</option>
            <option value="fullstack">Full Stack Engineer</option>
            <option value="mobile">Mobile Developer</option>
            <option value="data">Data Scientist</option>
            <option value="devops">DevOps Engineer</option>
            <option value="pm">Product Manager</option>
            <option value="design">UX/UI Designer</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", color: "var(--pv-muted)", marginBottom: 8 }}>Difficulty</label>
          <select className="pv-field" value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}>
            <option value="all">Any difficulty</option>
            <option value="1">⭐ Easy</option>
            <option value="2">⭐⭐ Fair</option>
            <option value="3">⭐⭐⭐ Medium</option>
            <option value="4">⭐⭐⭐⭐ Hard</option>
            <option value="5">⭐⭐⭐⭐⭐ Very Hard</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", color: "var(--pv-muted)", marginBottom: 8 }}>Sort</label>
        <select className="pv-field" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="createdAt">Recent</option>
          <option value="upvotes">Upvotes</option>
          <option value="downvotes">Downvotes</option>
        </select>
      </div>

      {activeFilters.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {activeFilters.map((f, i) => (
            <div key={i} className="pv-btn-glass" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: "var(--pv-ink)" }}>{f}</span>
              <X className="w-3 h-3" style={{ cursor: "pointer", color: "var(--pv-error)" }} onClick={() => removeFilter(f)} />
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};

export default SearchFilters;
