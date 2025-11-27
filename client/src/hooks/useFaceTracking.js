// client/src/hooks/useFaceTracking.js
import { useEffect, useState, useRef } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

export default function useFaceTracking(videoRef, calibrated) {
  const [data, setData] = useState({
    eyeContact: 0,
    yaw: 0,
    pitch: 0,
  });

  const baselineRef = useRef({ yaw: 0, pitch: 0, ready: false });

  useEffect(() => {
    if (!videoRef.current) return;

    let camera = null;

    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`, // keep your working CDN
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

    faceMesh.onResults((results) => {
      const face = results.multiFaceLandmarks?.[0];

      if (!face) {
        setData((prev) => ({
          ...prev,
          eyeContact: prev.eyeContact * 0.85,
        }));
        return;
      }

      const nose = face[1];
      const leftEye = face[33];
      const rightEye = face[263];

      /* ---------------------------------------------------
         ✔ FIXED YAW FORMULA (correct orientation)
      --------------------------------------------------- */
      const dx = rightEye.x - leftEye.x;
      const dy = rightEye.y - leftEye.y;

      // Correct yaw: horizontal rotation, flipped for mirror
      let rawYaw = Math.atan2(dy, dx) * (180 / Math.PI);
      rawYaw = rawYaw * -1;

      const yaw = clamp(rawYaw, -40, 40);

      /* ---------------------------------------------------
         ✔ FIXED PITCH FORMULA (stable + normalized)
      --------------------------------------------------- */
      const eyesMidY = (leftEye.y + rightEye.y) / 2;
      const mouth = face[13];
      const faceHeight = Math.abs(mouth.y - eyesMidY);

      let rawPitch = ((eyesMidY - nose.y) / faceHeight) * 200;
      const pitch = clamp(rawPitch, -40, 40);

      /* ---------------------------------------------------
         BASELINE (unchanged)
      --------------------------------------------------- */
      if (baselineRef.current.key !== calibrated) {
        baselineRef.current = {
          yaw,
          pitch,
          key: calibrated,
          ready: true,
        };
        console.log("🎯 NEW baseline:", baselineRef.current);
      }

      /* ---------------------------------------------------
         EYE CONTACT (unchanged)
      --------------------------------------------------- */
      let eyeContact = 0;

      if (baselineRef.current.ready) {
        const yawDelta = Math.abs(yaw - baselineRef.current.yaw);
        const pitchDelta = Math.abs(pitch - baselineRef.current.pitch);

        let contact = 100 - (yawDelta * 2.2 + pitchDelta * 1.2);
        contact = clamp(contact, 0, 100);
        eyeContact = contact;
      }

      /* ---------------------------------------------------
         SMOOTH OUTPUT (unchanged)
      --------------------------------------------------- */
      const a = 0.15;

      setData((prev) => ({
        eyeContact: prev.eyeContact + a * (eyeContact - prev.eyeContact),
        yaw: Math.round(prev.yaw + a * (yaw - prev.yaw)),
        pitch: Math.round(prev.pitch + a * (pitch - prev.pitch)),
      }));
    });

    camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await faceMesh.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480,
    });

    camera.start();

    return () => {
      camera?.stop();
      faceMesh?.close();
    };
  }, [videoRef, calibrated]);

  return data;
}
