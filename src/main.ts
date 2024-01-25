import "./style.css";
import * as THREE from "three";
import WebGL from "three/addons/capabilities/WebGL.js";

main();

function main() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    25
  );

  const canvas = document.querySelector("#c");
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

  // Grid parameters
  const gridSize = window.innerHeight / 5;
  const aspectRatio = window.innerWidth / window.innerHeight;
  const spacing = 0.1;
  const xFactor = aspectRatio;
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

  // Points material using a Shader
  const pointsMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 },
      gridSize: { value: 100 }, // Assuming gridSize is your actual grid size
      spacing: { value: 0.2 }, // Assuming spacing is your actual spacing value
    },
    vertexShader: `
    uniform float time;
    varying float vX;
    varying float vZ;

    void main() {
        vec3 pos = position;
        pos.y += sin(time + pos.x) * 0.25;
        pos.y += sin(time * 0.5 + pos.z) * 0.15;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = 3.0;

        vX = pos.x;
        vZ = pos.z;
    }
    `,
    fragmentShader: `
    uniform float gridSize;
    uniform float spacing;
    varying float vX;
    varying float vZ;

    void main() {
        // Calculate the range of x and z
        float maxX = gridSize * spacing / 2.0;
        float maxZ = gridSize * spacing / 2.0;

        // Normalize the x and z values based on their maximum values
        float normalizedX = (vX + maxX) / (2.0 * maxX);
        float normalizedZ = (vZ + maxZ) / (2.0 * maxZ);

        // Create the diagonal gradient based on normalized x and z
        float normalizedValue = (normalizedX + normalizedZ) / 2.0;
        normalizedValue = clamp(normalizedValue, 0.0, 1.0);

        vec3 blue = vec3(0.0, 0.0, 1.0);
        vec3 green = vec3(0.0, 1.0, 0.0);

        vec3 color = mix(blue, green, normalizedValue);
        gl_FragColor = vec4(color, 1.0);
    }
    `,
  });

  // Points mesh
  const points = new THREE.Points(pointsGeometry, pointsMaterial);
  scene.add(points);

  const xRotationDeg = -55;
  camera.rotateX((xRotationDeg * Math.PI) / 180);
  camera.position.y = 3;
  camera.position.z = -2;

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
