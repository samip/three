import { useGLTF, useTexture } from '@react-three/drei/native';
import { useThree } from '@react-three/fiber';
import { Asset } from 'expo-asset';
import { THREE } from 'expo-three';
import { useEffect, useMemo, useRef } from 'react';
import { setMaterial } from '../lib/ShaderMaterial';

export default function Pig({ onControlsChange }: { onControlsChange: (e: any) => void }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { camera, gl, scene } = useThree();
  camera.position.set(15, 0, 0);
  const asset = Asset.fromModule(require('../assets/models/shark.glb'));
  const gltf = useGLTF(asset.uri);
  const sceneRef = useRef<THREE.Object3D>(gltf.scene);
  const [_colorMap, bricksMap] = useTexture([
    '/assets/textures/netmesh.png',
    '/assets/textures/bricks.jpg',
  ]);

  const mesh = useMemo(() => {
    if (!sceneRef.current) {
      return new THREE.Mesh();
    }
    let mesh: THREE.Mesh | null = null;
    sceneRef.current.traverse((child: THREE.Object3D) => {
      if (!mesh && child instanceof THREE.Mesh) {
        mesh = child;
        console.log('Mesh found:', child);
      }
    });
    if (!mesh) {
      throw new Error('No mesh found in scene: ' + sceneRef.current);
    }
    return mesh;
  }, [sceneRef]);

  const controlsChanged = (e: any) => {
    const camera = e.target.object;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();

    if (!mesh) {
      return;
    }

    if (!(mesh.material instanceof THREE.ShaderMaterial)) {
      return;
    }
    updateDynamicUniforms(mesh, camera);
  };

  onControlsChange((e: any) => {
    controlsChanged(e);
  });

  function updateDynamicUniforms(mesh: THREE.Mesh, camera: THREE.Camera) {
    if (!(mesh?.material instanceof THREE.ShaderMaterial)) {
      return;
    }
    const material = mesh.material;
    material.uniforms.modelMatrix.value.copy(mesh.matrixWorld);
    material.uniforms.viewMatrix.value.copy(camera.matrixWorldInverse);
    material.uniforms.projectionMatrix.value.copy(camera.projectionMatrix);

    // Update normal matrix
    const normalMatrix = new THREE.Matrix3();
    normalMatrix.getNormalMatrix(mesh.matrixWorld);
    material.uniforms.normalMatrix.value.copy(normalMatrix);
  }

  useEffect(() => {
    const asyncFunc = async () => {
      await setMaterial(mesh, bricksMap, camera);
    };
    setTimeout(asyncFunc, 1000);
  });

  return sceneRef.current && <primitive object={sceneRef.current} />;
}
