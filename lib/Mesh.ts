import * as THREE from 'three';

export function updateDynamicUniforms(mesh: THREE.Mesh, camera: THREE.Camera) {
  const material = mesh.material as THREE.ShaderMaterial;
  material.uniforms.modelMatrix.value.copy(mesh.matrixWorld);
  material.uniforms.viewMatrix.value.copy(camera.matrixWorldInverse);
  material.uniforms.projectionMatrix.value.copy(camera.projectionMatrix);

  // Update normal matrix
  const normalMatrix = new THREE.Matrix3();
  normalMatrix.getNormalMatrix(mesh.matrixWorld);
  material.uniforms.normalMatrix.value.copy(normalMatrix);
}

function calculateMissingGeometry(mesh: THREE.Mesh) {
  const flipV = true;
  if (!mesh.geometry.attributes.uv) {
    const posCount = mesh.geometry.attributes.position.count;
    const uvs = [];
    const pos = mesh.geometry.attributes.position.array;
    if (!mesh.geometry.boundingSphere) {
      mesh.geometry.computeBoundingSphere();
    }
    // doesn't make sense, copied from other project
    const bsphere = mesh.geometry.boundingSphere;
    if (bsphere) {
      for (let i = 0; i < posCount; i++) {
        uvs.push((pos[i * 3] - bsphere.center.x) / bsphere.radius);
        uvs.push((pos[i * 3 + 1] - bsphere.center.y) / bsphere.radius);
      }
      mesh.geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
    }
  } else if (flipV) {
    const uvCount = mesh.geometry.attributes.position.count;
    const uvs = mesh.geometry.attributes.uv.array;
    for (let i = 0; i < uvCount; i++) {
      let v = 1.0 - uvs[i * 2 + 1];
      uvs[i * 2 + 1] = v;
    }
  }

  if (!mesh.geometry.attributes.normal) {
    mesh.geometry.computeVertexNormals();
  }

  if (mesh.geometry.getIndex()) {
    if (!mesh.geometry.attributes.tangent) {
      mesh.geometry.computeTangents();
    }
  }
  // Use default MaterialX naming convention.
  // TODO: figure out what these are for (MaterialX?)
  // mesh.geometry.attributes.i_position = mesh.geometry.attributes.position;
  // mesh.geometry.attributes.i_normal = mesh.geometry.attributes.normal;
  // mesh.geometry.attributes.i_tangent = mesh.geometry.attributes.tangent;
  // mesh.geometry.attributes.i_texcoord_0 = mesh.geometry.attributes.uv;
}