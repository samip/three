import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Gyroscope } from 'expo-sensors';
import { Platform } from "react-native";

interface BoxProps {
  position: [number, number, number];
}

export default function Box({ position = [0, 0, 0] }: BoxProps) {
  const ref = useRef<THREE.Mesh>(null!);
  const rotation = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    let subscription: any;

    if (Platform.OS !== "web") {
      // available was true on web platform for some reason
      Gyroscope.isAvailableAsync().then((available) => {
        if (available) {
          subscription = Gyroscope.addListener((data) => {
            rotation.current.x = data.x ?? 0;
            rotation.current.y = data.y ?? 0;
            rotation.current.z = data.z ?? 0;
          });
        }
      });
    }

    Gyroscope.setUpdateInterval(16); // Update interval in milliseconds

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.x += rotation.current.x;
      ref.current.rotation.y += rotation.current.y;
      ref.current.rotation.z += rotation.current.z;
    }
  });

  const materials = [
    new THREE.MeshStandardMaterial({ color: "red" }), // Right face
    new THREE.MeshStandardMaterial({ color: "green" }), // Left face
    new THREE.MeshStandardMaterial({ color: "blue" }), // Top face
    new THREE.MeshStandardMaterial({ color: "yellow" }), // Bottom face
    new THREE.MeshStandardMaterial({ color: "cyan" }), // Front face
    new THREE.MeshStandardMaterial({ color: "magenta" }), // Back face
  ];

  return (
    <mesh position={position} ref={ref} material={materials}>
      <boxGeometry args={[1, 1, 1]} />
    </mesh>
  );
}