import { useFrame, useThree } from '@react-three/fiber';
import { THREE } from 'expo-three';
import { useEffect, useRef, useState } from 'react';

export default function CursorLight() {
  const { camera, size } = useThree();
  const light = useRef<THREE.PointLight>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Convert mouse position to normalized device coordinates (-1 to +1)
      setMousePos({
        x: (event.clientX / size.width) * 2 - 1,
        y: -(event.clientY / size.height) * 2 + 1,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [size]);

  useFrame(() => {
    if (light.current) {
      // Convert mouse position to world space
      const vector = new THREE.Vector3(mousePos.x, mousePos.y, 0.5);
      vector.unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = 5; // Adjust this value to control how far the light is from the camera

      light.current.position.copy(camera.position.clone().add(dir.multiplyScalar(distance)));
      light.current.intensity = 1.5;
      light.current.distance = 10;
    }
  });

  return <pointLight ref={light} />;
}
