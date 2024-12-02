import { getMaterialXTexture, updateDynamicUniforms } from '@/lib/MaterialX';
import { calculateMissingGeometry } from '@/lib/Mesh';
import { useThree } from '@react-three/fiber';
import { Asset } from 'expo-asset';
import { THREE } from 'expo-three';
import { MutableRefObject, useEffect, useRef } from 'react';
import { RGBELoader } from 'three-stdlib';

export default function Scene({ onControlsChange }: { onControlsChange: (e: any) => void }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { camera, gl, scene } = useThree();
  const radianceTextureRef = useRef<THREE.Texture | null>(
    null,
  ) as MutableRefObject<THREE.Texture | null>;
  const irradianceTextureRef = useRef<THREE.Texture | null>(
    null,
  ) as MutableRefObject<THREE.Texture | null>;

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
  );
  scene.add(cube);

  // Initial setup effect - runs once on mount
  useEffect(() => {
    const setBackgroundTexture = (texture: THREE.Texture) => {
      const bgTexture = new THREE.DataTexture(
        texture.image.data,
        texture.image.width,
        texture.image.height,
        THREE.RGBAFormat,
        texture.type,
      ).copy(texture);
      bgTexture.mapping = THREE.EquirectangularReflectionMapping;
      scene.background = bgTexture;
    };

    const loadEnvTextures = async () => {
      const hdrLoader = new RGBELoader();
      const capabilities = gl.capabilities;

      try {
        const assetRadiance = Asset.fromModule(
          require('../assets/lights/san_giuseppe_bridge_split.hdr'),
        );
        const assetIrradiance = Asset.fromModule(
          require('../assets/lights/irradiance/san_giuseppe_bridge_split.hdr'),
        );
        const radianceTexture = await hdrLoader.loadAsync(assetRadiance.uri);
        const irradianceTexture = await hdrLoader.loadAsync(assetIrradiance.uri);

        const processedRadiance = prepareEnvTexture(radianceTexture, capabilities);
        const processedIrradiance = prepareEnvTexture(irradianceTexture, capabilities);
        radianceTextureRef.current = processedRadiance;
        irradianceTextureRef.current = processedIrradiance;
        setBackgroundTexture(radianceTexture);
        // return;
        const cube = addCube();
        calculateMissingGeometry(cube);
        // scene.add(cube);
        const material = getMaterialXTexture(radianceTexture, irradianceTexture);
        cube.material = material;
        updateDynamicUniforms(cube, camera);
        scene.add(cube);
        gl.render(scene, camera);
      } catch (error) {
        console.error('Error loading textures:', error);
        throw error;
      }
    };

    if (!radianceTextureRef.current || !irradianceTextureRef.current) { 
      loadEnvTextures();
    }
  }, [gl.capabilities, scene]);

  const prepareEnvTexture = (texture: THREE.Texture, capabilities: THREE.WebGLCapabilities) => {
    let newTexture = new THREE.DataTexture(
      texture.image.data,
      texture.image.width,
      texture.image.height,
      THREE.RGBAFormat,
      texture.type,
    );
    newTexture.wrapS = THREE.RepeatWrapping;
    // newTexture.anisotropy = capabilities.getMaxAnisotropy();
    newTexture.minFilter = THREE.LinearMipmapLinearFilter;
    newTexture.magFilter = THREE.LinearFilter;
    newTexture.generateMipmaps = true;
    newTexture.needsUpdate = true;

    return newTexture;
  };
  return <></>;
}
