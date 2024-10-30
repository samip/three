import { StyleSheet, View, Text } from 'react-native';
import {  Canvas } from "@react-three/fiber";
import Matrix from '@/components/Matrix';
import Box from '@/components/Box';
import * as THREE from 'three';
import { useEffect, useRef } from 'react';
import { getPigMesh } from '@/components/Pig';

export default function HomeScreen() {
  const materials = [
    new THREE.MeshStandardMaterial({ color: "red" }), // Right face
    new THREE.MeshStandardMaterial({ color: "green" }), // Left face
    new THREE.MeshStandardMaterial({ color: "blue" }), // Top face
    new THREE.MeshStandardMaterial({ color: "yellow" }), // Bottom face
    new THREE.MeshStandardMaterial({ color: "cyan" }), // Front face
    new THREE.MeshStandardMaterial({ color: "magenta" }), // Back face
  ];

  const circleGeometry = new THREE.CircleGeometry(0.5, 32); // change to circle
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const circleMesh = new THREE.Mesh(circleGeometry, material);
  
  return (
    <View style={{ flex: 1 }}>
      <Canvas  style={{ flex: 1, backgroundColor: '#3b3b3b' }}>
        <Matrix xSize={8} ySize={8}>
          {getPigMesh()}
        </Matrix>
      </Canvas>
    </View>
    )
  }