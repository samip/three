import Scene from '@/components/Scene';
import { calculateMissingGeometry } from '@/lib/Mesh';
import { Canvas } from '@react-three/fiber/native';
import { THREE } from 'expo-three';
import { useRef } from 'react';
import { View } from 'react-native';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils';

export default function ThreeDModelScreen() {
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
    // onControlsChangeEventHandlers.current.push(handler);
  };

  const onControlsChange = (e: any) => {
    onControlsChangeEventHandlers.current.forEach((handler) => {
      handler(e);
    });
  };
  // const orbitControls = new OrbitControls(camera, renderer.domElement);

  const renderPigCanvas = () => {
    return (
      <Canvas shadows>
        <Scene onControlsChange={addOnControlsChangeEventHandler} mesh={getCube()} />
        <primitive object={getCube()} />
        {/* <Pig onControlsChange={addOnControlsChangeEventHandler}></Pig> */}
      </Canvas>
    );
  };

  return <View style={{ flex: 1 }}>{renderPigCanvas()}</View>;
}
