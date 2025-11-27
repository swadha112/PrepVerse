/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import PVNavbar from "../ui/PVNavbar";
import { useAuth } from "../auth/AuthContext";
import "./InterviewCoach.css";

import useFaceTracking from "../hooks/useFaceTracking";


const SOCKET_URL = import.meta.env.VITE_API_BASE || "http://localhost:4000";

const CATEGORIES = [
  { name: "HR Interview", icon: "💼" },
  { name: "Technical Interview", icon: "💻" },
  { name: "Group Discussion", icon: "👥" },
  { name: "Resume-based Questions", icon: "📄" }
];

export default function InterviewCoach() {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [showCategorySelection, setShowCategorySelection] = useState(true);
  const [qIndex, setQIndex] = useState(1);
  const [qTotal, setQTotal] = useState(3);
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("");
  const [topic, setTopic] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [liveTip, setLiveTip] = useState("Setting up your practice…");

  const [metrics, setMetrics] = useState({
    wpm: 0,
    fillers: 0,
    fluency: 0,
    eyeContact: 0,
    yaw: 0,
    pitch: 0,
    seconds: 0,
    words: 0
  });

  const [review, setReview] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const startTsRef = useRef(0);
  const [calibrated, setCalibrated] = useState(false);

  /* ===========================================================
     SOCKET SETUP
  ============================================================ */
  useEffect(() => {
    const s = io(SOCKET_URL);
    setSocket(s);

    s.on("coachQuestion", ({ text, index, total }) => {
      setQuestion(text);
      setQIndex((index ?? 0) + 1);
      setQTotal(total || 3);
      setShowCategorySelection(false);
    });

    s.on("feedback", ({ text }) => setLiveTip(text || ""));
    s.on("review", ({ quickTip }) => setLiveTip(quickTip || ""));

    return () => s.close();
  }, []);

  /* ===========================================================
     FACE TRACKING (REAL)
  ============================================================ */
  const faceData = useFaceTracking(videoRef, calibrated);

  useEffect(() => {
    if (!calibrated) return;
    setMetrics((m) => ({
      ...m,
      eyeContact: Math.round(faceData.eyeContact),
      yaw: faceData.yaw,
      pitch: faceData.pitch
    }));
  }, [faceData, calibrated]);

  /* SEND TO BACKEND FOR AGGREGATION */
  useEffect(() => {
    if (!socket) return;
    if (!recording) return;
    if (!calibrated) return;

    socket.emit("eyeMetrics", {
      eyeContact: metrics.eyeContact,
      yaw: metrics.yaw,
      pitch: metrics.pitch
    });
  }, [metrics.eyeContact, metrics.yaw, metrics.pitch, socket, recording, calibrated]);

  /* ===========================================================
     SPEECH / RECORDING LOGIC
  ============================================================ */

  const FILLERS = ["um", "uh", "like", "you know", "so", "basically", "actually", "kind of", "sort of"];

  const countFillers = (text) => {
    const lower = text.toLowerCase();
    return FILLERS.reduce(
      (sum, f) => sum + (lower.match(new RegExp(`\\b${f}\\b`, "g")) || []).length,
      0
    );
  };

  const calcWPM = (text, seconds) => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.round((words / Math.max(seconds, 1)) * 60);
  };

  const calcFluency = (text, fillers) => {
    const words = text.trim().split(/\s+/).filter(Boolean).length || 1;
    const ratio = fillers / words;
    return Math.max(0, Math.min(100, Math.round((1 - ratio) * 100)));
  };

  const startPractice = () => {
    if (!category) return alert("Please select a category");
    socket?.emit("selectCategory", { category, topic });
  };

  const startRecording = async () => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });

      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      // Speech recognition
      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        let finalText = "";

        rec.onresult = (e) => {
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const res = e.results[i];
            if (res.isFinal) finalText += res[0].transcript + " ";
            else interim += res[0].transcript;
          }

          const merged = (finalText + interim).replace(/\s+/g, " ").trim();
          setTranscript(merged);

          const seconds = Math.round((Date.now() - startTsRef.current) / 1000);
          const fillers = countFillers(merged);
          const wpm = calcWPM(merged, seconds || 1);
          const fluency = calcFluency(merged, fillers);
          const words = merged.split(/\s+/).filter(Boolean).length;

          setMetrics((m) => ({
            ...m,
            fillers,
            wpm,
            fluency,
            seconds,
            words
          }));
        };

        rec.onend = () => {
          if (recording) rec.start();
        };

        recognitionRef.current = rec;
        rec.start();
      }

      const mr = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9"
      });

      mediaRecorderRef.current = mr;
      mr.start();

      setLiveTip("Listening… answer naturally.");
      setRecording(true);
      startTsRef.current = Date.now();

      socket?.emit("startRecording");
    } catch (err) {
      alert("Camera/Mic permission denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    recognitionRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setRecording(false);

    socket?.emit("stopRecording");

    const text = transcript.trim();
    const seconds = Math.round((Date.now() - startTsRef.current) / 1000);
    const fillers = countFillers(text);
    const wpm = calcWPM(text, seconds);
    const fluency = calcFluency(text, fillers);
    const words = text.split(/\s+/).filter(Boolean).length;

    socket?.emit("answerSummary", {
      question,
      transcript: text,
      metrics: { ...metrics, wpm, fillers, fluency, seconds, words }
    });
  };

  const nextQuestion = () => {
    setTranscript("");
    setReview(null);
    socket?.emit("nextQuestion");
  };

  const skipQuestion = () => {
    setTranscript("");
    setReview(null);
    socket?.emit("skipQuestion");
  };

  const getReview = async () => {
    if (!transcript.trim()) return alert("Speak first.");

    const res = await fetch(`${SOCKET_URL}/api/interviewCoach/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, topic, question, transcript, metrics })
    });

    const data = await res.json();
    setReview(data);
  };

  const calibrateEye = () => {
  setCalibrated((v) => v + 1);   // increment → triggers new baseline
  setLiveTip("Eye-contact calibrated. Look at the lens!");
};


  const backToCategories = () => {
    setShowCategorySelection(true);
    setCategory("");
    setTopic("");
    setQuestion("");
    setTranscript("");
    setReview(null);
    setRecording(false);

    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
  };

  /* ===========================================================
     UI RENDER
  ============================================================ */

  if (showCategorySelection) {
    return (
      <>
        <PVNavbar user={user} />

        <div className="coach-root">
          <div className="coach-container">
            <div className="coach-header">
              <h1 className="coach-title">🎤 AI Interview Coach</h1>
              <p className="coach-subtitle">
                Practice with AI-powered feedback and improve your interview skills
              </p>
            </div>

            <div className="coach-setup">
              <h2 className="setup-title">Choose Your Practice Category</h2>

              <div className="category-grid">
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat.name}
                    className={`cat-card ${category === cat.name ? "active" : ""}`}
                    onClick={() => setCategory(cat.name)}
                  >
                    <div className="cat-icon">{cat.icon}</div>
                    <div className="cat-name">{cat.name}</div>
                  </div>
                ))}
              </div>

              {category === "Technical Interview" && (
                <input
                  type="text"
                  placeholder="Enter topic (e.g., React, DSA, System Design)"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="topic-input"
                />
              )}

              <button onClick={startPractice} className="start-practice-btn">
                Start Practice →
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ===========================================================
     INTERVIEW SCREEN
  ============================================================ */

  return (
    <div className="ic-shell">
      <PVNavbar user={user} />

      <div className="ic-wrap">
        <header className="ic-header">
          <div className="ic-left">
            <div className="ic-crumb">Current Question</div>
            <h2 className="ic-qtext">{question || "Loading question..."}</h2>
          </div>
          <div className="ic-right">
            Q{qIndex} / {qTotal}
          </div>
        </header>

        <section className="ic-content">
          <div className="ic-video-card">
            <video ref={videoRef} autoPlay muted playsInline className="ic-video" />
          </div>

          <div className="ic-controls">
            <button className="ic-btn ic-back" onClick={backToCategories}>
              ← Back
            </button>

            {!recording ? (
              <button className="ic-btn ic-start" onClick={startRecording}>
                Start
              </button>
            ) : (
              <button className="ic-btn ic-stop" onClick={stopRecording}>
                Stop
              </button>
            )}

            <button className="ic-btn ic-next" onClick={nextQuestion}>
              Next
            </button>

            <button className="ic-btn ic-skip" onClick={skipQuestion}>
              Skip
            </button>

            <button className="ic-btn ic-calibrate" onClick={calibrateEye}>
              Calibrate Eye-Contact
            </button>
          </div>

          <div className="ic-live">
            <div className="ic-pill">
              <div className="ic-pill-value">{metrics.wpm}</div>
              <div className="ic-pill-label">WPM</div>
            </div>

            <div className="ic-pill">
              <div className="ic-pill-value">{metrics.fillers}</div>
              <div className="ic-pill-label">Fillers</div>
            </div>

            <div className="ic-pill">
              <div className="ic-pill-value">{metrics.fluency}/100</div>
              <div className="ic-pill-label">Fluency</div>
            </div>

            <div className="ic-pill">
              <div className="ic-pill-value">
                {calibrated ? `${metrics.eyeContact}%` : "0%"}
              </div>
              <div className="ic-pill-label">Eye-contact</div>
            </div>

            <div className="ic-pill">
              <div className="ic-pill-value">{metrics.yaw}°</div>
              <div className="ic-pill-label">Yaw</div>
            </div>

            <div className="ic-pill">
              <div className="ic-pill-value">{metrics.pitch}°</div>
              <div className="ic-pill-label">Pitch</div>
            </div>
          </div>

          <div className="ic-transcript">
            <div className="ic-tip-title">Live Coach</div>
            <div className="ic-tip-sub">
              {recording ? "Listening…" : "Stopped. Review will be generated."}
            </div>

            <div className="ic-pills-row">
              <div className="ic-chip">WPM {metrics.wpm}</div>
              <div className="ic-chip">Fillers {metrics.fillers}</div>
              <div className="ic-chip">Fluency {metrics.fluency}/100</div>
              <div className="ic-chip">
                Eye-contact {calibrated ? `${metrics.eyeContact}%` : "0%"}
              </div>
              <div className="ic-chip">Yaw {metrics.yaw}°</div>
              <div className="ic-chip">Pitch {metrics.pitch}°</div>
            </div>

            <div className="ic-block">
              <div className="ic-block-title">Transcript (live)</div>
              <div className="ic-block-body">
                {transcript || "Say something to see transcript..."}
              </div>
            </div>

            {liveTip && (
              <div className="ic-block">
                <div className="ic-block-title">Quick review tip</div>
                <div className="ic-block-body">{liveTip}</div>
              </div>
            )}

            <div className="ic-actions">
              <button className="ic-btn ic-review" onClick={getReview}>
                Generate AI Review
              </button>
            </div>

            {review && (
              <div className="ic-review">
                <div className="ic-scoreline">
                  Accuracy {review.accuracy}/5 · Relevance {review.relevance}/5 ·
                  Depth {review.depth}/5
                </div>

                <div className="ic-cols">
                  <div className="ic-col">
                    <div className="ic-block">
                      <div className="ic-block-title">What went well</div>
                      <ul className="ic-list">
                        {(review.what_went_well || []).map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="ic-block">
                      <div className="ic-block-title">Improve this by</div>
                      <ul className="ic-list">
                        {(review.improvements || []).map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="ic-col">
                    <div className="ic-block">
                      <div className="ic-block-title">Upgraded answer</div>
                      <div className="ic-block-body">{review.upgraded_answer}</div>
                    </div>
                  </div>
                </div>

                {review.drills?.length ? (
                  <div className="ic-block">
                    <div className="ic-block-title">Practice drills</div>
                    <ul className="ic-list">
                      {review.drills.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
