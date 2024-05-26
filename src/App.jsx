import React, { useEffect, useRef } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

const App = () => {
  const faceLandmarkerRef = useRef();
  const videoRef = useRef();
  let lastVideoTime = -1;

  function renderLoop() {
    if (videoRef.current) {
      const video = videoRef.current;
      // console.log(video.currentTime)
      let startTimeMs = performance.now();

      if (video.currentTime !== lastVideoTime) {
        const faceLandmarkerResult = faceLandmarkerRef.current.detectForVideo(
          video,
          startTimeMs
        );
        lastVideoTime = video.currentTime;
        console.log(faceLandmarkerResult);
      }
    }
    requestAnimationFrame(() => {
      renderLoop();
    });
  }

  async function initMP() {
    const vision = await FilesetResolver.forVisionTasks(
      // "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      "http://localhost:5173/wasm"
    );
    faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "http://localhost:5173/face_landmarker.task",
      },
      runningMode: "VIDEO",
      outputFacialTransformationMatrixes:true,
      outputFaceBlendshapes: true,
    });
    renderLoop();
  }
  useEffect(() => {
    initMP();
    return () => {};
  }, []);

  return (
    <div className="w-full h-screen">
      <video
        ref={videoRef}
        muted
        autoPlay
        loop
        className="max-h-full max-w-full aspect-video"
      >
        <source src="/video.mp4" />
      </video>
    </div>
  );
};

export default App;
