import { useEffect, useRef } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import * as THREE from "three";
import Webcam from "react-webcam";

const App = () => {
  const faceLandmarkerRef = useRef();
  const videoRef = useRef();
  const canvasRef = useRef();
  let lastVideoTime = -1;

  function renderLoop() {
    if (videoRef.current) {
      const { video } = videoRef.current;
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
  //todo add texture
  async function initThreejs() {
    const width = canvasRef.current.clientWidth
    const height = canvasRef.current.clientHeight
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75,width/height,0.1,1000)
    camera.position.z = 5
    const renderer = new THREE.WebGLRenderer({canvas:canvasRef.current,alpha:true})
    renderer.setSize(width,height)
    renderer.setAnimationLoop(()=>{renderer.render(scene,camera)})

    console.log(camera) 
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
      outputFacialTransformationMatrixes: true,
      outputFaceBlendshapes: true,
    });
    renderLoop();
    canvasRef.current.width = videoRef.current.video.clientWidth;
    canvasRef.current.height = videoRef.current.video.clientHeight;
    initThreejs();
  }
  // useEffect(() => {
  //   if (videoRef.current && videoRef.current.video && videoRef.current.video.readyState===4) {
  //     console.log([videoRef.current.video])
  //     initMP();
  //   }
  //   return () => {};
  // }, [videoRef.current]);

  return (
    <div className="w-fit h-full relative">
      <Webcam
        mirrored
        ref={videoRef}
        className="max-h-full max-w-full aspect-video"
        onUserMedia={() => {
          initMP();
        }}
      />

      <canvas
        ref={canvasRef}
        className="absolute w-auto h-auto left-0 top-0 right-0 bottom-0 z-10"
      ></canvas>
      {/* <video
        ref={videoRef}
        muted
        autoPlay
        loop
        className="max-h-full max-w-full aspect-video"
      >
        <source src="/video.mp4" />
      </video> */}
    </div>
  );
};

export default App;
