import React, { useRef, useEffect, useMemo } from "react";
import { useFrame, useThree, MeshProps } from "@react-three/fiber";
import * as THREE from "three";
import { Gyroscope } from "expo-sensors";
import { Platform } from "react-native";
import { Children } from 'react';
import Box from './Box';

interface MatrixProps {
  xSize: number;
  ySize: number;
  children?:THREE.Mesh;
}

export default function Matrix({children, xSize, ySize}: MatrixProps) {
  const ref = useRef<THREE.Mesh>(null!);
  console.log('Children', children);
  const rotation = useRef({ x: 0, y: 0, z: 0 });
  const { scene, camera } = useThree();
  
  const onChildFrame = (mesh: THREE.Mesh, x: number, y: number) => {
    const maxDistanceToCenter = Math.sqrt(Math.pow(-3.5, 2) + Math.pow(-3, 2));
    const distanceToCenter = Math.sqrt(Math.pow(x - 3.5, 2) + Math.pow(y - 3, 2));
    (mesh.material as THREE.Material).opacity = distanceToCenter / maxDistanceToCenter;
    mesh.rotation.x = rotation.current.x;
    mesh.rotation.y = rotation.current.y;
    mesh.rotation.z = rotation.current.z;
  }

  const getBoxMesh = () => {
    const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    return new THREE.Mesh(boxGeometry, boxMaterial);
  }

  const getDefaultMesh = () => getBoxMesh();

  const onChildLoad = (mesh: THREE.Mesh, x: number, y: number) => {
    (mesh.material as THREE.Material).opacity = 0;
  }

  // Create memoized array of boxes
  const boxes = useMemo(() => {
    const boxArray: THREE.Mesh[][] = []; // array of arrays of Mesh3D
    for (let x = 0; x < xSize; x++) {
      boxArray[x] = [];
      for (let y = 0; y < ySize; y++) {
        const staticProps = {
          onLoad: onChildLoad,
          onFrame: onChildFrame,
          key: `${x}_${y}`,
          position: [x, y, 0]
        };

        const matrixMesh = children ? children.clone() : getDefaultMesh();
        matrixMesh.position.set(staticProps.position[0], staticProps.position[1], staticProps.position[2]);
        boxArray[x].push(matrixMesh);
        scene.add(matrixMesh);
      }}
      
    return boxArray;
  }, [xSize, ySize]);

  useEffect(() => {
    let subscription: any;
    const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
    ref.current = boxMesh;

    if (Platform.OS !== "web") {
      Gyroscope.setUpdateInterval(20); // Update interval in milliseconds
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

    camera.position.set(3.5, 3, 6);

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

  return (
    <React.Fragment>
      <ambientLight />
    </React.Fragment>
  );
}
