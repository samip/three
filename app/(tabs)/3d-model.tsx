import Scene from '@/components/Scene';
import { calculateMissingGeometry } from '@/lib/Mesh';
import { OrbitControls } from '@react-three/drei/native';
import { Canvas } from '@react-three/fiber/native';
import { THREE } from 'expo-three';
import { useRef } from 'react';
import { View } from 'react-native';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils';

type Light = {
  position: [number, number, number];
  intensity: number;
  castShadow: boolean;
};

const ThreeDModelScreen = () => {
  const orbitControlsRef = useRef<any>(null);
  const onControlsChangeEventHandlers = useRef<((e: any) => void)[]>([]);

  const getCube = () => {
    const geometry = new THREE.IcosahedronGeometry(30);
    const indexedGeometry = mergeVertices(geometry);
    const cube = new THREE.Mesh(indexedGeometry);
    calculateMissingGeometry(cube);
    return cube;
  };

  const addOnControlsChangeEventHandler = (handler: (e: any) => void) => {
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
        <OrbitControls ref={orbitControlsRef} onChange={onControlsChange} enableZoom={true} />
        <Scene onControlsChange={addOnControlsChangeEventHandler} mesh={getCube()} />
        {/* <Pig onControlsChange={addOnControlsChangeEventHandler}></Pig> */}
      </Canvas>
    );
  };

  return <View style={{ flex: 1 }}>{renderPigCanvas()}</View>;
};

export default ThreeDModelScreen;
