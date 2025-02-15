import { useEffect, useRef, useState } from "react";
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
  const widthAndHeightOfScean = useRef()
  const [sunglassesMesh, setSunglassesMesh] = useState();
  let lastVideoTime = -1;

  function renderLoop(glassesMesh) {
    if (videoRef.current && glassesMesh) {
      const { video } = videoRef.current;
      // console.log(video.currentTime)
      let startTimeMs = performance.now();

      if (video.currentTime !== lastVideoTime) {
        const faceLandmarkerResult = faceLandmarkerRef.current.detectForVideo(
          video,
          startTimeMs
        );
        lastVideoTime = video.currentTime;
        if (
          faceLandmarkerResult &&
          faceLandmarkerResult.faceLandmarks &&
          faceLandmarkerResult.faceLandmarks[0]
        ) {
          const leftEye = faceLandmarkerResult.faceLandmarks[0][130];
          const rightEye = faceLandmarkerResult.faceLandmarks[0][359];
          const eyeCenter = faceLandmarkerResult.faceLandmarks[0][168];
          const eyeDistance = Math.sqrt(
            Math.pow(rightEye.x - leftEye.x, 2) +
            Math.pow(rightEye.y - leftEye.y, 2)
          );
          const scaleMultiplier = eyeDistance;
          
          const scaleX = -0.1;
          const scaleY = -0.1;
          const offsetX = 0.0;
          const offsetY = -0.1;
          // console.log(eyeCenter.x*100)
          // glassesMesh.position.x = -eyeCenter.x
          glassesMesh.position.x =-(widthAndHeightOfScean.current[0]-((widthAndHeightOfScean.current[0]*2) / 100)*((1-eyeCenter.x)*100))
          // glassesMesh.position.x = ((widthAndHeightOfScean.current[0]/100)*((1-eyeCenter.x)*100))
          // glassesMesh.position.x = -eyeCenter.x
            // (eyeCenter.x - video.videoWidth / 2) * scaleX + offsetX;
          glassesMesh.position.y =-(widthAndHeightOfScean.current[1]-((widthAndHeightOfScean.current[1]*2) / 100)*((1-eyeCenter.y)*100))
          // glassesMesh.position.y =-eyeCenter.y
            // (eyeCenter.y - video.videoHeight / 2) * scaleY + offsetY;
          glassesMesh.scale.set(
            scaleMultiplier,
            scaleMultiplier,
            scaleMultiplier
          );
          // glassesMesh.position.z = 1;

          const eyeLine = new THREE.Vector2(
            rightEye.x - leftEye.x,
            rightEye.y - leftEye.y
          );
          const rotationZ = Math.atan2(eyeLine.y, eyeLine.x);
          glassesMesh.rotation.z = rotationZ;
        }
      }
    }
    requestAnimationFrame(() => {
      renderLoop(glassesMesh);
    });
  }
  async function initThreejs() {
    return new Promise((resolve) => {
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.z = 1;
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
      });
      renderer.setSize(width, height);
      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
      });

      const textureLoader = new THREE.TextureLoader();
      textureLoader.load("http://localhost:5173/img.png", (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const geometry = new THREE.PlaneGeometry(2, 1);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
        });
        const glasses = new THREE.Mesh(geometry, material);
        scene.add(glasses);

        const vFOV = (camera.fov * Math.PI) / 180;
        const heightOfScean = 2 * Math.tan(vFOV / 2) * Math.abs(camera.position.z);
        const widthOfScean = heightOfScean * camera.aspect;
        widthAndHeightOfScean.current = [widthOfScean/2,heightOfScean/2]
        setSunglassesMesh(glasses);
        resolve(glasses);
      });
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
      outputFacialTransformationMatrixes: true,
      outputFaceBlendshapes: true,
    });
    const {width,height} = videoRef.current.stream.getVideoTracks()[0].getSettings()
    canvasRef.current.width = videoRef.current.video.clientWidth;
    canvasRef.current.height = videoRef.current.video.clientHeight;
    const glasses = await initThreejs();
    renderLoop(glasses);
  }
  // useEffect(() => {
  //   if (videoRef.current && videoRef.current.video && videoRef.current.video.readyState===4) {
  //     console.log([videoRef.current.video])
  //     initMP();
  //   }
  //   return () => {};
  // }, [videoRef.current]);

  return (
    <div className="flex justify-center w-screen h-screen items-center relative">
      <Webcam
        mirrored
        // height={1000}
        ref={videoRef}
        audio={false}
        videoConstraints={{ width: { min: 480 },
        height: { min: 720 },
        aspectRatio: 16/9}}
        className=""
        onUserMedia={() => {
          initMP();
        }}
      />

    <canvas
      ref={canvasRef}
      className="absolute aspect-video inset-auto z-10"
    ></canvas>
      {/* <video
        ref={(r) => {
          videoRef.current = { video: r };
        }}
        muted
        autoPlay
        loop
        className="w-[500px] h-[800px]"
        onClick={initMP}
      >
        <source src="/video.mp4" />
      </video> */}
    </div>
  );
};

export default App;

