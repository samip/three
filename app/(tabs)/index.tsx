import { StyleSheet, View, Text } from 'react-native';
import { Canvas } from "@react-three/fiber";
import Matrix from '@/components/Matrix';
import Box from '@/components/Box';
import * as THREE from 'three';
import { useEffect, useRef, useState } from 'react';
import { getPigMesh } from '@/components/Pig';
import CameraFollow from '@/components/CameraFollow';
import CursorLight from '@/components/CursorLight';
import { useTexture } from '@react-three/drei';

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
        <ambientLight intensity={0.2} />
        <CursorLight />
        <CameraFollow padding={1.2}>
          <Matrix padding={0.1} xSize={8} ySize={8}>
            {sphereMesh}
          </Matrix>
        </CameraFollow>
      </Canvas>
    </View>
  );
}