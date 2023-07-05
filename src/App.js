import React, { useEffect, useRef, useState } from "react";
import { DrawingUtils, HandLandmarker } from "@mediapipe/tasks-vision";
import { createHandLandmarker } from "./handlandmarker";

const letterThresholds = [
  { letter: "L", minDistance: 0.1, maxDistance: 0.15 },
  { letter: "A", minDistance: 0.15, maxDistance: 0.2 },
];

function calculateFingerDistances(landmarks) {
  const fingerDistances = [];
  const fingerIndices = [
    [2, 3, 4], // Thumb
    [5, 6, 7], // Index finger
    [9, 10, 11], // Middle finger
    [13, 14, 15], // Ring finger
    [17, 18, 19], // Little finger
  ];

  for (const indices of fingerIndices) {
    const [p1, p2, p3] = indices.map((i) => landmarks[i]);
    const distance = calculateDistance(p1, p2) + calculateDistance(p2, p3);
    fingerDistances.push(distance);
  }

  return fingerDistances;
}

function calculateDistance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function detectFingerLetter(fingerDistances) {
  for (const threshold of letterThresholds) {
    const { letter, minDistance, maxDistance } = threshold;
    const distance = fingerDistances[0];

    if (distance >= minDistance && distance <= maxDistance) {
      return { letter, distance };
    }
  }

  return { letter: "", distance: 0 };
}

function App() {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const inputVideoRef = useRef(null);
  const [fingerData, setFingerData] = useState({ letter: "", distance: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const videoRef = inputVideoRef.current;

    if (canvas) {
      contextRef.current = canvas.getContext("2d");
    }

    if (contextRef.current && canvas && videoRef) {
      createHandLandmarker().then((handLandmarker) => {
        const drawingUtils = new DrawingUtils(contextRef.current);
        let lastVideoTime = -1;
        let results = undefined;

        function predict() {
          canvas.style.width = videoRef.videoWidth;
          canvas.style.height = videoRef.videoHeight;
          canvas.width = videoRef.videoWidth;
          canvas.height = videoRef.videoHeight;

          let startTimeMs = performance.now();
          if (lastVideoTime !== videoRef.currentTime) {
            lastVideoTime = videoRef.currentTime;
            results = handLandmarker.detectForVideo(videoRef, startTimeMs);
          }

          contextRef.current.save();
          contextRef.current.clearRect(0, 0, canvas.width, canvas.height);

          if (results.landmarks) {
            for (const landmarks of results.landmarks) {
              drawingUtils.drawConnectors(
                landmarks,
                HandLandmarker.HAND_CONNECTIONS,
                {
                  color: "#00ff00",
                  lineWidth: 5,
                }
              );

              drawingUtils.drawLandmarks(landmarks, {
                color: "#ff0000",
                lineWidth: 2,
              });

              const fingerDistances = calculateFingerDistances(landmarks);
              const { letter, distance } = detectFingerLetter(fingerDistances);

              // Draw finger letter and distance
              const xPos = landmarks[0].x;
              const yPos = landmarks[0].y;
              contextRef.current.fillStyle = "#000000";
              contextRef.current.font = "16px Arial";
              contextRef.current.fillText(
                `Letter: ${letter}`,
                xPos + 10,
                yPos + 50
              );
              contextRef.current.fillText(
                `Distance: ${distance.toFixed(2)}`,
                xPos + 10,
                yPos + 70
              );

              setFingerData({ letter, distance }); // Update fingerData state
            }
          }

          contextRef.current.restore();
          window.requestAnimationFrame(predict);
        }

        navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
          videoRef.srcObject = stream;
          videoRef.addEventListener("loadeddata", predict);
        });
      });
    }

    return () => {
      // Clean up any resources or event listeners if needed
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <video
        id="webcam"
        style={{ position: "absolute" }}
        autoPlay
        playsInline
        ref={inputVideoRef}
      ></video>
      <canvas
        ref={canvasRef}
        id="output_canvas"
        style={{
          position: "absolute",
          left: "0px",
          top: "0px",
        }}
      ></canvas>
      <div style={{ position: "absolute", top: "10px", left: "10px" }}>
        Detected Letter: {fingerData.letter}
        <br />
        Distance: {fingerData.distance.toFixed(2)}
      </div>
    </div>
  );
}

export default App;
