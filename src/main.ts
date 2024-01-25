import "./style.css";
import * as THREE from "three";
import WebGL from "three/addons/capabilities/WebGL.js";

main();

function main() {
  const canvas = document.querySelector("#c");
  if (!canvas) return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Camera setup
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    25
  );

  const xRotationDeg = -65;
  const xRotationRad = (xRotationDeg * Math.PI) / 180;
  camera.rotateX(xRotationRad);
  camera.position.y = 4;
  camera.position.z = -1;

  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

  // Grid parameters
  const gridSize = window.innerHeight / 4;
  const aspectRatio = window.innerWidth / window.innerHeight;
  const xFactor = (aspectRatio / Math.sin(-xRotationRad)) * 1.5;
  const spacing = 0.05;
  const offset = -gridSize * spacing * xFactor * 0.5;

  // Points geometry
  const pointsGeometry = new THREE.BufferGeometry();
  const positions = [];
  for (let i = 0; i < gridSize * xFactor; i++) {
    for (let j = 0; j < gridSize; j++) {
      positions.push(i * spacing + offset, 0, -j * spacing);
    }
  }
  pointsGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );

  const pointsMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 },
      pointSize: { value: 2.0 },
      noiseAmp1: { value: 0.35 }, // Adjust as needed
      noiseFreq1: { value: 1.0 }, // Adjust as needed
      spdModifier1: { value: 0.5 }, // Adjust as needed
      noiseAmp2: { value: 0.25 }, // Adjust as needed
      noiseFreq2: { value: 1.0 }, // Adjust as needed
      spdModifier2: { value: 0.5 }, // Adjust as needed
      gridSize: { value: gridSize },
      spacing: { value: spacing },
      aspectRatio: { value: aspectRatio },
    },
    vertexShader: `
    #define PI 3.14159265359

    uniform float time;
    uniform float pointSize;
    uniform float noiseAmp1;
    uniform float noiseFreq1;
    uniform float spdModifier1;
    uniform float noiseAmp2;
    uniform float noiseFreq2;
    uniform float spdModifier2;

    varying float vX;
    varying float vZ;

    float random (in vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    float noise (in vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);

        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        vec2 u = f*f*(3.0-2.0*f);

        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    mat2 rotate2d(float angle){
        return mat2(cos(angle),-sin(angle), sin(angle),cos(angle));
    }

    void main() {
        gl_PointSize = pointSize;

        vec3 pos = position;
        pos.y += noise(pos.xz * noiseFreq1 + time * spdModifier1) * noiseAmp1;
        pos.y += noise(rotate2d(PI / 4.) * pos.zx * noiseFreq2 - time * spdModifier2 * 0.6) * noiseAmp2;

        vec4 mvm = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvm;

        vX = pos.x;
        vZ = pos.z;
    }
    `,
    // fragmentShader: `
    // uniform float gridSize;
    // uniform float spacing;
    // uniform float aspectRatio;

    // varying float vX;
    // varying float vZ;

    // void main() {
    //     // Calculate the range of x and z
    //     float maxX = gridSize * spacing / 2.0;
    //     float maxZ = gridSize * aspectRatio * spacing / 2.0;

    //     // Normalize the x and z values based on their maximum values
    //     float normalizedX = (vX + maxX) / (2.0 * maxX);
    //     float normalizedZ = (vZ + maxZ) / (2.0 * maxZ);

    //     // Create the diagonal gradient based on normalized x and z
    //     float normalizedValue = (normalizedX + normalizedZ) / 2.0;
    //     normalizedValue = clamp(normalizedValue, 0.0, 1.0);

    //     vec3 blue = vec3(0.0, 0.0, 1.0);
    //     vec3 teal = vec3(0.0, 1.0, 1.0);

    //     vec3 color = mix(blue, teal, normalizedValue);
    //     gl_FragColor = vec4(color, 1.0);
    // }
    // `,
    fragmentShader: `
    void main() {
        gl_FragColor = vec4(0, 0.2, 1, 1.0);
    }
    `,
  });

  // Points mesh
  const points = new THREE.Points(pointsGeometry, pointsMaterial);
  scene.add(points);

  function animate() {
    requestAnimationFrame(animate);

    // Update time uniform
    pointsMaterial.uniforms.time.value = performance.now() * 0.002;

    renderer.render(scene, camera);

    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
  }

  function resizeRendererToDisplaySize(renderer: THREE.WebGLRenderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  if (WebGL.isWebGLAvailable()) {
    animate();
  } else {
    const warning = WebGL.getWebGLErrorMessage();
    document.body.appendChild(warning);
  }
}
