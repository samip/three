import Scene from '@/components/Scene';
import { calculateMissingGeometry } from '@/lib/Mesh';
import { Canvas } from '@react-three/fiber/native';
import { THREE } from 'expo-three';
import { View } from 'react-native';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils';

export default function ThreeDModelScreen() {
  const getCube = () => {
    const geometry = new THREE.IcosahedronGeometry(30);
    const indexedGeometry = mergeVertices(geometry);
    const cube = new THREE.Mesh(indexedGeometry);
    calculateMissingGeometry(cube);
    return cube;
  };

  return (
    <View style={{ flex: 1 }}>
      <Canvas shadows>
        <Scene mesh={getCube()} />
        {/* <primitive object={getCube()} /> */}
        {/* <Pig onControlsChange={addOnControlsChangeEventHandler}></Pig> */}
      </Canvas>
    </View>
  );
}
