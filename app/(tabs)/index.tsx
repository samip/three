import CameraFollow from '@/components/CameraFollow';
import CursorLight from '@/components/CursorLight';
import Matrix from '@/components/Matrix';
import Scene from '@/components/Scene';
import { Canvas } from '@react-three/fiber';
import { THREE } from 'expo-three';
import { View } from 'react-native';

export default function HomeScreen() {
  const sphereGeometry = new THREE.SphereGeometry(5);
  const material = new THREE.MeshStandardMaterial({
    // color: 0x00ffff,
    roughness: 0.7,
    metalness: 0.1,
  });

  const sphereMesh = new THREE.Mesh(sphereGeometry, material);

  return (
    <View style={{ flex: 1 }}>
      <Canvas style={{ flex: 1, backgroundColor: '#3b3b3b' }}>
        <CursorLight />
        <CameraFollow padding={1.2}>
          <Scene />
          <Matrix padding={0.1} xSize={8} ySize={8}>
            {sphereMesh}
          </Matrix>
        </CameraFollow>
      </Canvas>
    </View>
  );
}
