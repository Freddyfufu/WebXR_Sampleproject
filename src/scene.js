// scene.js
import * as THREE from 'three';
import {camera_y_offset} from "./global config";

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x808080);

export const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, camera_y_offset, 0);
scene.add(camera);

const canvas = document.querySelector( '#c' );
export const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
renderer.xr.updateCamera(camera);

export function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);