import React, { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface CameraFollowProps {
  children: React.ReactNode;
  padding?: number; // Optional padding around the target
}

export default function CameraFollow({ children, padding = 1.2 }: CameraFollowProps) {
  const controlsRef = useRef<any>(null);
  const { camera, scene } = useThree();

  useEffect(() => {
    // Wait for one frame to ensure children are mounted
    requestAnimationFrame(() => {
      //const scene = camera.parent;
      if (!scene) return;

      // Calculate bounding box of all children
      const boundingBox = new THREE.Box3();
      // TODO: should traverse children only
      scene.traverse((object) => {
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

      if (controlsRef.current) {
        controlsRef.current.target.copy(center);
        controlsRef.current.update();
      }
    });
  }, [camera, padding]);


  const handleCameraMove = () => {
    // Actions to perform whenever the camera moves
  };

  const handleCameraMoveEnd = () => {
    // Actions to perform when the camera stops moving
  };

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        onChange={handleCameraMove}
        onEnd={handleCameraMoveEnd}
      />
      {children}
    </>
  );
} 