import { OrbitControls } from '@react-three/drei/native';
import { Canvas } from '@react-three/fiber/native';
import { Suspense } from 'react';

import { View } from 'react-native';
import Pig from '../../components/Pig';

type Light = {
  position: [number, number, number];
  intensity: number;
  castShadow: boolean;
};

const ThreeDModelScreen = () => {

  const lights: Light[] = [
    { position: [500, 10, 15], intensity: 1, castShadow: true },
    { position: [-100, 10, 15], intensity: 1, castShadow: false },
    { position: [1, 10, 15], intensity: 1, castShadow: false }
  ];

  const renderPigCanvas = () => {
    return (
      <Canvas shadows>
        {lights.map((light, index) => (
          <directionalLight
            key={index}
            position={light.position}
            intensity={light.intensity}
            castShadow={light.castShadow}
          />
        ))}
        <Suspense fallback={null}>
          <Pig />
        </Suspense>
        <OrbitControls enableZoom={true} />
      </Canvas>
    );
  };

  return <View style={{ flex: 1 }}>{renderPigCanvas()}</View>;
};

export default ThreeDModelScreen;
