/*
All the THREEJS boilerplate to set up the app and rendering
*/

import * as THREE from "three";
import { OrbitControls } from "threeModules/controls/OrbitControls.js";
import { TGALoader } from "threeModules/loaders/TGALoader.js";
import { RGBELoader } from "threeModules/loaders/RGBELoader.js";
import { GLTFLoader } from "threeModules/loaders/GLTFLoader.js";
import * as BufferGeometryUtils from "threeModules/utils/BufferGeometryUtils.js";
import { GUI } from "threeModules/libs/lil-gui.module.min.js";

let {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  Mesh,
  BufferGeometry,
  CircleGeometry,
  BoxGeometry,
  MeshBasicMaterial,
  Vector3,
  AnimationMixer,
  Object3D,
  TextureLoader,
  Sprite,
  SpriteMaterial,
  RepeatWrapping,
} = THREE;
let vec3 = Vector3;
let { random, abs, sin, cos, min, max } = Math;
let rnd = (rng = 1) => random() * rng;
let srnd = (rng = 1) => random() * rng * 2 - rng;
console.log("Hello 🌎");

let renderer = new WebGLRenderer({
  antialias: true,
  alpha:true
});
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingEnabled = true;
renderer.setClearColor(0xcccccc);

let stl = renderer.domElement.style;
stl.position = "absolute";
stl.left = stl.top = "0px";

document.body.appendChild(renderer.domElement);

let scene = new Scene();
let camera = new PerspectiveCamera();
scene.add(camera);
let controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(-3,2,6);
controls.target.set(0.36,  -0.23,  1.4);
controls.maxPolarAngle = Math.PI * 0.5;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

//Create a DirectionalLight and turn on shadows for the light
const dlight = new THREE.DirectionalLight(0xffffff, 0.9);
dlight.position.set(0, 0, -25); //default; light shining from top
dlight.castShadow = true; // default false
scene.add(dlight);
//Set up shadow properties for the light
dlight.shadow.mapSize.width = 1024; // default
dlight.shadow.mapSize.height = 1024; // default
dlight.shadow.camera.near = 0.5; // default
dlight.shadow.camera.far = 50; // default
dlight.shadow.camera.left = dlight.shadow.camera.bottom = -8;
dlight.shadow.camera.top = dlight.shadow.camera.right = 8;
dlight.shadow.bias = 0.001;

let dlh;

let lightParam = {
  pitch: -0.13,
  yaw: -2.2,
};
dlight.target.position.set(0, 0.0, 0);
scene.add(dlight.target);
let repoLight = () => {
  let { pitch, yaw } = lightParam;
  let lpitch = Math.sin(pitch);
  dlight.position.set(
    Math.sin(yaw) * lpitch,
    Math.cos(pitch),
    Math.cos(yaw) * lpitch
  );
  dlight.position.multiplyScalar(5.5);
  dlight.lookAt(dlight.target.position);
  dlight.updateMatrix();
  dlight.updateMatrixWorld();
  dlh && dlh.update();
};
//repoLight()
//scene.add(new THREE.AmbientLight("white", 1.));

let gui;
if(1)gui = new GUI({
  width: 200,
  visible: false,
});

gui&&gui
  .add(lightParam, "pitch", -Math.PI * 0.5, 0)
  .name("LightPitch")
  .onChange((val) => {
    repoLight();
  });
gui&&gui
  .add(lightParam, "yaw", -Math.PI, Math.PI)
  .name("LightYaw")
  .onChange((val) => {
    repoLight();
  });

//SET UP THE ENVIRONMENT MAP
//camera.add(new THREE.PointLight("white", 10.01));
scene.add(camera)
let pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();
let envMap;
if(1)new RGBELoader()
  .setPath("")
  .load(
    "https://cdn.glitch.global/364206c7-9713-48db-9215-72a591a6a9bd/pretville_street_1k.hdr?v=1658931258610",
    function (texture) {
      envMap = pmremGenerator.fromEquirectangular(texture).texture;

     // scene.background = envMap;
      scene.environment = envMap;

      texture.dispose();
      pmremGenerator.dispose();
    }
  );

let v0 = new vec3();
let v1 = new vec3();
let v2 = new vec3();
let v3 = new vec3();

controls.enableDamping = true;


let onWindowResize = (event) => {
  let width = window.innerWidth;
  let height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};

onWindowResize();
window.addEventListener("resize", onWindowResize, false);

/** PUT YOUR THREEJS CODE YOU NEED HELP WITH HERE!!! **/


import Test from "./test.js"
let test = new Test({THREE,scene,camera,renderer,controls,gltfLoader:new GLTFLoader(),gui})
//Render the stuff...
renderer.setAnimationLoop((dt) => {
  let time = (performance.now() / 100) | 0;
  test&&test.update&&test.update();
  controls.update();  
  renderer.render(scene, camera);
});
