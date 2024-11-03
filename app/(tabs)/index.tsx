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

// Create a component for the textured mesh
function TexturedMesh() {
  const [mesh, setMesh] = useState<THREE.Mesh | null>(null);

  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/assets/textures/bricks.jpg', (texture) => {
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const newMesh = new THREE.Mesh(boxGeometry, material);
      setMesh(newMesh);
    });
  }, []);

  return mesh ? mesh : new THREE.Mesh();
}

export default function HomeScreen() {
  const materials = [
    new THREE.MeshStandardMaterial({ color: "red" }), // Right face
    new THREE.MeshStandardMaterial({ color: "green" }), // Left face
    new THREE.MeshStandardMaterial({ color: "blue" }), // Top face
    new THREE.MeshStandardMaterial({ color: "yellow" }), // Bottom face
    new THREE.MeshStandardMaterial({ color: "cyan" }), // Front face
    new THREE.MeshStandardMaterial({ color: "magenta" }), // Back face
  ];

  const sphereGeometry = new THREE.SphereGeometry(5); 
  const material = new THREE.MeshStandardMaterial({ 
    roughness: 0.7,
    metalness: 0.1
  });
  const sphereMesh = new THREE.Mesh(sphereGeometry, material);
  
  return (
    <View style={{ flex: 1 }}>
      <Canvas style={{ flex: 1, backgroundColor: '#3b3b3b' }}>
        <CameraFollow padding={1.2}>
          <ambientLight intensity={1} />
          <CursorLight />
          <ambientLight intensity={0.2} />
          <Matrix padding={0.1} xSize={8} ySize={8}>
            {TexturedMesh()}
          </Matrix>
        </CameraFollow>
      </Canvas>
    </View>
  );
}