import { StyleSheet, View, Text } from 'react-native';
import {  Canvas } from "@react-three/fiber";
import Matrix from '@/components/Matrix';
import Box from '@/components/Box';
import * as THREE from 'three';
import { useEffect, useRef } from 'react';
import { getPigMesh } from '@/components/Pig';
import CameraFollow from '@/components/CameraFollow';

export default function HomeScreen() {
  const materials = [
    new THREE.MeshStandardMaterial({ color: "red" }), // Right face
    new THREE.MeshStandardMaterial({ color: "green" }), // Left face
    new THREE.MeshStandardMaterial({ color: "blue" }), // Top face
    new THREE.MeshStandardMaterial({ color: "yellow" }), // Bottom face
    new THREE.MeshStandardMaterial({ color: "cyan" }), // Front face
    new THREE.MeshStandardMaterial({ color: "magenta" }), // Back face
  ];

  const sphereGeometry = new THREE.SphereGeometry(5); // change to circle
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const sphereMesh = new THREE.Mesh(sphereGeometry, material);
  
  return (
    <View style={{ flex: 1 }}>
      <Canvas  style={{ flex: 1, backgroundColor: '#3b3b3b' }}>
        <CameraFollow padding={1.2}>
          <Matrix xSize={8} ySize={8}>
            {getPigMesh()}
          </Matrix>
        </CameraFollow>
      </Canvas>
    </View>
    )
  }