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
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    50
  );
  camera.position.set(0, 0, 3.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

  const planeGeometry = new THREE.PlaneGeometry(16, 8, 512, 256);

  const planeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 },
      resolution: {
        value: {
          x: window.innerWidth * window.devicePixelRatio,
          y: window.innerHeight * window.devicePixelRatio,
        },
      },
      pointSize: { value: 3.0 },
      noiseAmp1: { value: 0.2 },
      noiseFreq1: { value: 3.0 },
      spdModifier1: { value: 1 },
      noiseAmp2: { value: 0.1 },
      noiseFreq2: { value: 3.0 },
      spdModifier2: { value: 1.2 },

      u_pointsize: { value: 3.0 },
      // wave 1
      u_noise_freq_1: { value: 3.0 },
      u_noise_amp_1: { value: 0.2 },
      u_spd_modifier_1: { value: 1 },
      // wave 2
      u_noise_freq_2: { value: 3.0 },
      u_noise_amp_2: { value: 0.1 },
      u_spd_modifier_2: { value: 1.2 },
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

    // 2D Random
    float random (in vec2 st) {
        return fract(sin(dot(st.xy,
                            vec2(12.9898,78.233)))
                    * 43758.5453123);
    }

    // 2D Noise
    float noise (in vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);

        // Four corners in 2D of a tile
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        // Smooth Interpolation

        // Cubic Hermine Curve.  Same as SmoothStep()
        vec2 u = f*f*(3.0-2.0*f);
        // u = smoothstep(0.,1.,f);

        // Mix 4 coorners percentages
        return mix(a, b, u.x) +
                (c - a)* u.y * (1.0 - u.x) +
                (d - b) * u.x * u.y;
    }

    mat2 rotate2d(float angle){
        return mat2(cos(angle),-sin(angle),
                  sin(angle),cos(angle));
    }

    void main() {
      gl_PointSize = pointSize;

      vec3 pos = position;

      // pos.xy is the original 2D dimension of the plane coordinates
      pos.z += noise(pos.xy * noiseFreq1 + time * spdModifier1) * noiseAmp1;
      // add noise layering
      // minus time makes the second layer of wave goes the other direction
      pos.z += noise(rotate2d(PI / 4.) * pos.yx * noiseFreq2 - time * spdModifier2 * 0.6) * noiseAmp2;

      vec4 mvm = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvm;
    }
    `,
    fragmentShader: `
    #ifdef GL_ES
    precision mediump float;
    #endif

    #define PI 3.14159265359
    #define TWO_PI 6.28318530718
    
    uniform vec2 resolution;

    void main() {
      vec2 st = gl_FragCoord.xy/resolution.xy;

      gl_FragColor = vec4(vec3(0.0, st),1.0);
    }
    `,
  });

  // Points mesh
  const points = new THREE.Points(planeGeometry, planeMaterial);
  points.rotation.x = -3.1415 / 8;
  scene.add(points);

  function animate() {
    requestAnimationFrame(animate);

    planeMaterial.uniforms.time.value = performance.now() * 0.001;

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
