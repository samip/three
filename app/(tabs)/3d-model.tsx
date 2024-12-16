import Scene from '@/components/Scene';
import { calculateMissingGeometry } from '@/lib/Mesh';
import { Canvas } from '@react-three/fiber/native';
import { THREE } from 'expo-three';
import { useRef } from 'react';
import { View } from 'react-native';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils';

export default function ThreeDModelScreen() {

  const getMesh = () => {
    const geometry = new THREE.IcosahedronGeometry(30);
    const indexedGeometry = mergeVertices(geometry);
    const mesh = new THREE.Mesh(indexedGeometry);
    calculateMissingGeometry(mesh);
    return mesh;
  };

  const mesh = useRef<THREE.Mesh>(getMesh());

  return (
    <View style={{ flex: 1 }}>
      <Canvas shadows>
        <Scene mesh={mesh.current} />
        {/* <primitive object={getCube()} /> */}
        {/* <Pig onControlsChange={addOnControlsChangeEventHandler}></Pig> */}
      </Canvas>
    </View>
  );
}
