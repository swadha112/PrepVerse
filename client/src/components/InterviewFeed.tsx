// src/components/InterviewFeed.tsx
import { useEffect, useState, useMemo } from "react";
import InterviewPost from "./InterviewPost";
import SearchFilters from "./SearchFilters";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

interface Post {
  id: string;
  company: string;
  role: string;
  interviewDate?: string;
  interviewType?: string;
  difficulty?: number;
  outcome?: string;
  content?: string;
  author?: string;
  createdAt?: any;
  upvotes?: number;
  downvotes?: number;
  comments?: number;
  companyLogo?: string;
  preparationTip?: string;
}

const PAGE_SIZE = 3;

const InterviewFeed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedRole("all");
    setSelectedDifficulty("all");
  };

  const removeFilter = (filter: string) => {
    if (filter === searchQuery) setSearchQuery("");
    if (filter === selectedRole) setSelectedRole("all");
    if (filter === selectedDifficulty) setSelectedDifficulty("all");
  };

  useEffect(() => {
    const q = query(collection(db, "experiences"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];
      setPosts(allPosts);
    });
    return () => unsubscribe();
  }, []);

  const loadMore = () => setVisibleCount((p) => p + PAGE_SIZE);

  /**
   * Compute:
   *  - totalFilteredCount: number of posts AFTER applying filters (but BEFORE slicing by visibleCount)
   *  - visiblePosts: the posts after filtering and slicing
   */
  const { totalFilteredCount, visiblePosts } = useMemo(() => {
    let result = [...posts];

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (post) =>
          post.company?.toLowerCase().includes(q) ||
          post.role?.toLowerCase().includes(q) ||
          post.content?.toLowerCase().includes(q)
      );
    }

    if (selectedRole !== "all") {
      const r = selectedRole.toLowerCase();
      result = result.filter((post) => (post.role || "").toLowerCase().includes(r));
    }

    if (selectedDifficulty !== "all") {
      result = result.filter((post) => post.difficulty === Number(selectedDifficulty));
    }

    result.sort((a, b) => {
      if (sortBy === "upvotes") return (b.upvotes || 0) - (a.upvotes || 0);
      if (sortBy === "downvotes") return (b.downvotes || 0) - (a.downvotes || 0);
      return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
    });

    const totalFiltered = result.length;
    const sliced = result.slice(0, visibleCount);
    return { totalFilteredCount: totalFiltered, visiblePosts: sliced };
  }, [posts, searchQuery, selectedRole, selectedDifficulty, sortBy, visibleCount]);

  return (
    <main style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      {/* outer wrapper: 95% width, centered */}
      <div style={{ width: "95vw", maxWidth: 1600, marginTop: 28, marginBottom: 48 }}>
        {/* grid: left filters 30%, right feed 70% */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(260px, 30%) 1fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* left filters */}
          <aside style={{ position: "relative" }}>
            <div style={{ position: "sticky", top: 24 }}>
              <div className="pv-card" style={{ padding: 18, borderRadius: 14 }}>
                <SearchFilters
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedRole={selectedRole}
                  setSelectedRole={setSelectedRole}
                  selectedDifficulty={selectedDifficulty}
                  setSelectedDifficulty={setSelectedDifficulty}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  activeFilters={[searchQuery, selectedRole, selectedDifficulty].filter((f) => f !== "all" && f !== "")}
                  clearFilters={clearFilters}
                  removeFilter={removeFilter}
                />
              </div>
            </div>
          </aside>

          {/* right feed */}
          <section>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* --- Empty state when filters produce zero results --- */}
              {totalFilteredCount === 0 ? (
                <div className="pv-card" style={{ padding: 20, borderRadius: 12 }}>
                  <h3 style={{ margin: 0, color: "var(--pv-ink)" }}>No posts found</h3>
                  <p style={{ marginTop: 8, color: "var(--pv-muted)" }}>
                    We couldn't find any interview experiences matching your filters. Try clearing filters or broadening your search.
                  </p>
                </div>
              ) : (
                // Render posts when there are filtered results
                <>
                  {visiblePosts.map((post) => (
                    <div key={post.id} style={{ width: "100%" }}>
                      <InterviewPost {...post} />
                    </div>
                  ))}

                  <div style={{ textAlign: "center", paddingTop: 18 }}>
                    {/* Only show Load More if there are filtered posts and there are more to load */}
                    {visiblePosts.length > 0 && visibleCount < totalFilteredCount ? (
                      <button className="pv-btn-royal" onClick={loadMore} disabled={loading}>
                        {loading ? "Loading..." : "Load more posts"}
                      </button>
                    ) : (
                      // When we've loaded everything show a gentle message in white card style
                      <div style={{ color: "var(--pv-muted)" }}>{/* keep this subtle — nothing shown when posts exist and we've loaded them */}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default InterviewFeed;
