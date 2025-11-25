// src/components/ShareExperienceForm.tsx
import React, { useMemo, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useForm } from "react-hook-form";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthContext"; // 👈 new
import { useNavigate } from "react-router-dom"; // 👈 new

interface FormData {
  author: string;
  company: string;
  role: string;
  date: string;
  interviewType: string;
  difficulty: number | "";
  outcome: string;
  content: string;
  preparationTip?: string;
}

interface Props {
  triggerLabel?: string;
  triggerClassName?: string;
  triggerStyle?: React.CSSProperties;
}

export default function ShareExperienceForm({
  triggerLabel = "Start Sharing",
  triggerClassName = "pv-btn-royal",
  triggerStyle,
}: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSmall, setIsSmall] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth <= 720 : false
  );

  const { user } = useAuth() as { user: any } | any; // 👈 get current user
  const navigate = useNavigate(); // 👈 router navigation

  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth <= 720);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const { register, handleSubmit, reset } = useForm<FormData>({
    defaultValues: {
      author: "",
      company: "",
      role: "",
      date: "",
      interviewType: "",
      difficulty: "" as any,
      outcome: "",
      content: "",
      preparationTip: "",
    },
  });

  const today = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await addDoc(collection(db, "experiences"), {
        ...data,
        difficulty: Number(data.difficulty || 0),
        upvotes: 0,
        downvotes: 0,
        comments: 0,
        createdAt: serverTimestamp(),
      });
      reset();
      setOpen(false);
    } catch (err) {
      console.error("Failed to post experience:", err);
      alert("Failed to share experience. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: 14,
    color: "var(--pv-ink)",
    marginBottom: 6,
    textAlign: "left",
    display: "block",
  };

  const modalContent = (
    <>
      <div
        onClick={() => setOpen(false)}
        style={{ position: "fixed", inset: 0, background: "rgba(12,16,28,0.6)", zIndex: 80 }}
      />

      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 90,
          width: "92%",
          maxWidth: 880,
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        <div className="pv-card" style={{ padding: 24, borderRadius: "var(--pv-radius-lg)" }}>
          {/* header */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <h2 style={{ margin: 0, color: "var(--pv-ink)", fontSize: 22, fontWeight: 700 }}>
              Share Your Interview Experience
            </h2>
            <p style={{ marginTop: 6, color: "var(--pv-muted)", fontSize: 14 }}>
              Help others by sharing your interview experience. Your insights could help someone land their dream job!
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isSmall ? "1fr" : "1fr 1fr",
                gap: 16,
              }}
            >
              <div>
                <label style={labelStyle}>Your name</label>
                <input
                  className="pv-field"
                  placeholder="e.g. Tejaswini Shet"
                  {...register("author")}
                />
              </div>

              <div>
                <label style={labelStyle}>Company</label>
                <input
                  className="pv-field"
                  placeholder="e.g. Google, Microsoft"
                  {...register("company")}
                />
              </div>

              <div>
                <label style={labelStyle}>Role</label>
                <input
                  className="pv-field"
                  placeholder="e.g. Software Engineer"
                  {...register("role")}
                />
              </div>

              <div>
                <label style={labelStyle}>Interview Date</label>
                <input className="pv-field" type="date" max={today} {...register("date")} />
              </div>

              <div>
                <label style={labelStyle}>Interview Type</label>
                <select className="pv-field" defaultValue="" {...register("interviewType")}>
                  <option value="" disabled>
                    Select type
                  </option>
                  <option value="technical">Technical</option>
                  <option value="hr">HR</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Difficulty Level</label>
                <select className="pv-field" defaultValue="" {...register("difficulty")}>
                  <option value="" disabled>
                    Rate difficulty
                  </option>
                  <option value="1">★ Easy</option>
                  <option value="2">★★ Moderate</option>
                  <option value="3">★★★ Medium</option>
                  <option value="4">★★★★ Hard</option>
                  <option value="5">★★★★★ Very Hard</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Outcome</label>
                <select className="pv-field" defaultValue="" {...register("outcome")}>
                  <option value="" disabled>
                    Select outcome
                  </option>
                  <option value="Selected">Selected</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>Interview Experience</label>
              <textarea
                className="pv-field"
                style={{ minHeight: 120, padding: 14, lineHeight: 1.55 }}
                placeholder="Share your interview experience in detail. Include questions asked, process, tips for future candidates, etc."
                {...register("content")}
              />
            </div>

            <div style={{ marginTop: 8 }}>
              <label style={labelStyle}>Preparation Tip (optional)</label>
              <input
                className="pv-field"
                placeholder="Any tips you used that helped"
                {...register("preparationTip")}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
              <button
                type="button"
                className="pv-btn-glass"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="submit" className="pv-btn-royal" disabled={submitting}>
                {submitting ? "Sharing..." : "Share Experience"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  // 👇 only change in behavior: gate button by login
  const handleTriggerClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        className={triggerClassName}
        style={triggerStyle}
        onClick={handleTriggerClick}
        type="button"
      >
        {triggerLabel}
      </button>

      {open &&
        (typeof document !== "undefined"
          ? ReactDOM.createPortal(modalContent, document.body)
          : modalContent)}
    </>
  );
}
