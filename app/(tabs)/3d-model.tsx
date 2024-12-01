import { OrbitControls } from '@react-three/drei/native';
import { Canvas } from '@react-three/fiber/native';
import { Suspense, useRef } from 'react';

import { View } from 'react-native';
import Pig from '../../components/Pig';
import Scene from '@/components/Scene';

type Light = {
  position: [number, number, number];
  intensity: number;
  castShadow: boolean;
};

const ThreeDModelScreen = () => {
  const orbitControlsRef = useRef<any>(null);

  const lights: Light[] = [
    { position: [500, 10, 15], intensity: 1, castShadow: true },
    { position: [-100, 10, 15], intensity: 1, castShadow: false },
    { position: [1, 10, 15], intensity: 1, castShadow: false },
  ];

  const onControlsChangeEventHandlers = useRef<((e: any) => void)[]>([]);

  const addOnControlsChangeEventHandler = (handler: (e: any) => void) => {
    console.log('Adding handler', handler);
    onControlsChangeEventHandlers.current.push(handler);
  };

  const onControlsChange = (e: any) => {
    onControlsChangeEventHandlers.current.forEach((handler) => {
      handler(e);
    });
  };

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
        <OrbitControls ref={orbitControlsRef} onChange={onControlsChange} enableZoom={true} />
        <Scene></Scene>
        <Suspense fallback={null}>
          <Pig onControlsChange={addOnControlsChangeEventHandler} />
        </Suspense>
      </Canvas>
    );
  };

  return <View style={{ flex: 1 }}>{renderPigCanvas()}</View>;
};

export default ThreeDModelScreen;
