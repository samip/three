import React, { useRef, useEffect } from "react";
import { useFrame, useThree, MeshProps } from "@react-three/fiber";
import * as THREE from "three";
import { Gyroscope } from "expo-sensors";
import { Platform } from "react-native";
// import { Renderable } from "../types/renderable";
import Box from './Box'; // Adjust the path as necessary


interface MatrixProps {
  renderItem: MeshProps;
}

export default function Matrix() {
  const ref = useRef<THREE.Mesh>(null!);
  const rotation = useRef({ x: 0, y: 0, z: 0 });

  const { scene, camera } = useThree();

  useEffect(() => {
    let subscription: any;

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


  const onChildFrame = (mesh:THREE.Mesh, x:any, y:any) => {  
    mesh.rotation.x = rotation.current.x;
    mesh.rotation.y = rotation.current.y; 
    mesh.rotation.z = rotation.current.z;
  }

  const onChildLoad = (mesh:THREE.Mesh, x:any, y:any) => {
    const darkenColor = (color: THREE.Color, factor: number) => {
      color.offsetHSL(0, 0, factor);
      return color;
    }
  
    mesh.rotation.x = rotation.current.x;
    mesh.rotation.y = rotation.current.y; 
    mesh.rotation.z = rotation.current.z;
    const xDistanceToCenter = Math.abs(x - 3.5);
    const yDistanceToCenter = Math.abs(y - 3);

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((material) => {
        if (typeof material === "object" && material instanceof THREE.MeshStandardMaterial) {
          console.log(material.color, darkenColor(material.color, 10), material.color)
          material.color = darkenColor(material.color, 5);
          console.log(material.color.getHexString(),darkenColor(material.color, 100).getHexString());
        }
      })
    }
  }
    

  return (
    <React.Fragment>
      <ambientLight />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((x) => (
        <React.Fragment key={x}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((y) => (
            <Box onLoad={onChildLoad} onFrame={onChildFrame} key={`${x}_${y}`} position={[x, y, 0]} />
          ))}
        </React.Fragment>
      ))}
    </React.Fragment>
  );
}
