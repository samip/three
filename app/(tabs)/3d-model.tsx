import { OrbitControls } from '@react-three/drei/native';
import { Canvas } from '@react-three/fiber/native';
import { Suspense } from 'react';

import { View } from 'react-native';
import Pig from '../../components/Pig';

const ThreeDModelScreen = () => {
  const renderPigCanvas = () => {
    return (
      <Canvas shadows>
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
