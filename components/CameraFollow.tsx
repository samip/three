import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import React, { useEffect, useRef } from 'react';
import { THREE } from 'expo-three';

interface CameraFollowProps {
  children: React.ReactNode;
  padding?: number; // Optional padding around the target
}

export default function CameraFollow({ children, padding = 1.2 }: CameraFollowProps) {
  const controlsRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { camera, scene } = useThree();

  useEffect(() => {
    // Wait for one frame to ensure children are mounted
    requestAnimationFrame(() => {
      if (!groupRef.current) return;

      // Calculate bounding box of all children
      const boundingBox = new THREE.Box3();
      groupRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          boundingBox.expandByObject(object);
        }
      });

      // Calculate center and size
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);

      // Calculate optimal camera position
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      const maxDim = Math.max(size.x, size.y) * padding;
      const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
      const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

      // Position camera
      camera.position.set(center.x, center.y, cameraZ);
      camera.lookAt(center);
      scene.add(camera);
      if (controlsRef.current) {
        controlsRef.current.target.copy(center);
        controlsRef.current.update();
      }
    });
  }, [camera, padding, children, scene]);

  const handleCameraMove = () => {
    // Actions to perform whenever the camera moves
    // console.log(camera.position);
  };

  const handleCameraMoveEnd = () => {
    // Actions to perform when the camera stops moving
  };

  return (
    <>
      <OrbitControls ref={controlsRef} onChange={handleCameraMove} onEnd={handleCameraMoveEnd} />
      <group ref={groupRef}>{children}</group>
    </>
  );
}
