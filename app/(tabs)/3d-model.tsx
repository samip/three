import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber/native';
import { OrbitControls } from '@react-three/drei/native';

import { View } from 'react-native';
import Pig from '../../components/Pig';

const ThreeDModelScreen = () => {
  const renderPigCanvas = () => {
    return (
      <Canvas 
      shadows
      camera={{ position: [0, 0, 20], fov: 50 }} 
      >
        <directionalLight position={[5, 10, 15]} intensity={1} castShadow />
        <directionalLight position={[-10, 10, 15]} intensity={1} />
        <directionalLight position={[10, 10, 15]} intensity={1} />
        <Suspense fallback={null}>
          <Pig />
          <mesh
            receiveShadow
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -1, 0]}>
            <planeGeometry args={[10, 10]} />
            <shadowMaterial opacity={0.5} />
          </mesh>
        </Suspense>
        <OrbitControls enableZoom={true} />
      </Canvas>
    );
  };

  return <View style={{ flex: 1 }}>{renderPigCanvas()}</View>;
};

export default  ThreeDModelScreen;