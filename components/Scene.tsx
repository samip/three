import { useThree } from '@react-three/fiber';
import { Asset } from 'expo-asset';
import { THREE } from 'expo-three';
import { MutableRefObject, useEffect, useRef } from 'react';
import { RGBELoader } from 'three-stdlib';

export default function Scene() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { camera, gl, scene } = useThree();
  const radianceTextureRef = useRef<THREE.Texture | null>(
    null,
  ) as MutableRefObject<THREE.Texture | null>;
  const irradianceTextureRef = useRef<THREE.Texture | null>(
    null,
  ) as MutableRefObject<THREE.Texture | null>;

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

      const assetRadiance = Asset.fromModule(require('../assets/lights/goegap.hdr'));
      const assetIrradiance = Asset.fromModule(require('../assets/lights/irradiance/goegap.hdr'));
      const radianceTexture = await hdrLoader.loadAsync(assetRadiance.uri);
      const irradianceTexture = await hdrLoader.loadAsync(assetIrradiance.uri);
      const processedRadiance = prepareEnvTexture(radianceTexture as THREE.Texture, capabilities);
      const processedIrradiance = prepareEnvTexture(
        irradianceTexture as THREE.Texture,
        capabilities,
      );

      radianceTextureRef.current = processedRadiance;
      irradianceTextureRef.current = processedIrradiance;
      setBackgroundTexture(radianceTexture);
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
