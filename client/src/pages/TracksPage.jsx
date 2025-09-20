import React, { useState } from "react";
import PVCard from "../ui/PVCard";
import PVButton from "../ui/PVButton";
import PVProgressRing from "../ui/PVProgressRing";

// Static list of LeetCode topic tracks
const TRACKS = [
  "Array", "String", "Hash Table", "Dynamic Programming", "Math", "Sorting", "Greedy",
  "Depth-First Search", "Binary Search", "Database", "Matrix", "Tree", "Breadth-First Search",
  "Bit Manipulation", "Two Pointers", "Prefix Sum", "Heap (Priority Queue)", "Simulation", "Binary Tree",
  "Graph", "Stack", "Counting", "Sliding Window", "Design", "Enumeration", "Backtracking",
  "Union Find", "Linked List", "Number Theory", "Ordered Set", "Monotonic Stack", "Segment Tree", "Trie",
  "Combinatorics", "Bitmask", "Divide and Conquer", "Queue", "Recursion", "Geometry",
  "Binary Indexed Tree", "Memoization", "Hash Function", "Binary Search Tree", "Shortest Path",
  "String Matching", "Topological Sort", "Rolling Hash", "Game Theory", "Interactive", "Data Stream",
  "Monotonic Queue", "Brainteaser", "Doubly-Linked List", "Randomized", "Merge Sort", "Counting Sort",
  "Iterator", "Concurrency", "Probability and Statistics", "Quickselect", "Suffix Array", "Line Sweep",
  "Minimum Spanning Tree", "Bucket Sort", "Shell", "Reservoir Sampling", "Strongly Connected Component",
  "Eulerian Circuit", "Radix Sort", "Rejection Sampling", "Biconnected Component"
];

// Placeholder initial progress
const INITIAL_PROGRESS = TRACKS.reduce((acc, track) => {
  acc[track] = { foundation: 0, intermediate: 0, advanced: 0 };
  return acc;
}, {});

export default function TracksPage() {
  const [progress] = useState(INITIAL_PROGRESS);

  const renderTier = (label, value, unlocked, onClick) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontSize: 14, color: unlocked ? 'var(--pv-text)' : 'var(--pv-muted)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <PVProgressRing size={32} progress={value} dimmed={!unlocked} />
        <PVButton
          disabled={!unlocked}
          variant={unlocked ? 'primary' : 'secondary'}
          onClick={onClick}
        >
          {unlocked ? 'Solve' : 'Locked'}
        </PVButton>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 16 }}>Tracks</h1>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 16
      }}>
        {TRACKS.map(track => {
          const { foundation, intermediate, advanced } = progress[track];
          const canInt = foundation >= 70;
          const canAdv = intermediate >= 70;

          return (
            <PVCard key={track} style={{ padding: 16 }}>
              <div style={{ fontWeight: 700, color: 'var(--pv-ink)', marginBottom: 12 }}>{track}</div>
              {renderTier('Foundation', foundation, true, () => console.log('Go foundation', track))}
              {renderTier('Intermediate', intermediate, canInt, () => console.log('Go intermediate', track))}
              {renderTier('Advanced', advanced, canAdv, () => console.log('Go advanced', track))}
            </PVCard>
          );
        })}
      </div>
    </div>
  );
}
