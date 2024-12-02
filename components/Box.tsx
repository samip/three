import { Gyroscope } from 'expo-sensors';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as THREE from 'three';

interface BoxProps {
  position: [number, number, number];
}

export default function Box({ position = [0, 0, 0] }: BoxProps) {
  const materials = [
    new THREE.MeshStandardMaterial({ color: 'red' }), // Right face
    new THREE.MeshStandardMaterial({ color: 'green' }), // Left face
    new THREE.MeshStandardMaterial({ color: 'blue' }), // Top face
    new THREE.MeshStandardMaterial({ color: 'yellow' }), // Bottom face
    new THREE.MeshStandardMaterial({ color: 'cyan' }), // Front face
    new THREE.MeshStandardMaterial({ color: 'magenta' }), // Back face
  ];

  const meshRef = useRef<THREE.Mesh>(
    new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), materials),
  );

  useEffect(() => {
    let subscription: any;

    if (Platform.OS !== 'web') {
      // available was true on web platform for some reason
      Gyroscope.isAvailableAsync().then((available) => {
        if (available) {
          subscription = Gyroscope.addListener((data) => {
            meshRef.current.rotation.set(data.x ?? 0, data.y ?? 0, data.z ?? 0);
          });
        }
      });

      Gyroscope.setUpdateInterval(16); // Update interval in milliseconds
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const mesh = new THREE.Mesh();
  mesh.position.set(...position);
  return mesh;
}
