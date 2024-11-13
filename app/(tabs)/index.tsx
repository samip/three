import { StyleSheet, View, Text, ScrollView } from 'react-native';
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
  // create triangle mesh that points towards z+
  const geometry = new THREE.ConeGeometry(20, 20, 4);
  const coneMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const cone = new THREE.Mesh(geometry, material);
  cone.rotation.x = Math.PI / 2; // Rotate -90 degrees around X to point towards z+


  return (
    <View style={{ flex: 1, position: 'relative' }}>

      <Canvas style={{ flex: 1, backgroundColor: '#3b3b3b' }}>
        <ambientLight intensity={0.7} />
        <CursorLight />
        <CameraFollow padding={1.2}>
          <Matrix padding={0.1} xSize={8} ySize={8}>
            {cone}
          </Matrix>
        </CameraFollow>
      </Canvas>


    </View>
  );
}
