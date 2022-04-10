import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import { PearlBackground } from "./PearlBackground";
import { Loading3DView } from "../Loading3DView";
import { CameraControls } from "./PearlCameraControls";

export const PearlScene = (props) => {
  const { children } = props;

  return (
    <Canvas
      gl={{ preserveDrawingBuffer: true }}
      camera={{
        fov: 50,
        aspect: 1,
        near: 0.005,
        far: 100,
        position: [0, 0.06, 2],
        zoom: 5,
      }}
      dpr={window.devicePixelRatio}
      onCreated={(canvasCtx) => {
        canvasCtx.gl.toneMapping = THREE.NoToneMapping;
        canvasCtx.gl.physicallyCorrectLights = true;
      }}
    >
      <CameraControls />
      <Suspense fallback={<Loading3DView styles={{ transform: "translate(0, -120px)" }} />}>
        {children}
        <PearlBackground />
      </Suspense>
      <ambientLight args={[0xffffff, 2]} />
    </Canvas>
  );
};
