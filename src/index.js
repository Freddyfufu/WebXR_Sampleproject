// Beispielanwendung WebXR im Rahmen der Bachelorarbeit von Freddy Oexemann

import * as THREE from 'three';
import * as ThreeMeshUI from 'three-mesh-ui';
import {VideoNode} from './js/render/nodes/video.js';
import fontFamily from '../assets/three-mesh-ui/assets/Roboto-msdf.json';
import fontTexture from '../assets/three-mesh-ui/assets/Roboto-msdf.png';
import { scene, camera, renderer } from './scene.js';
import { initXR } from './vrSession.js';
import {loadModels} from "./models";

initXR();

loadModels();



const axesHelper = new THREE.AxesHelper(5); // 5 = Länge der Achsen
scene.add(axesHelper);

// Add some lights
var light = new THREE.DirectionalLight(0xffffff,0.5);
light.position.set(1, 1, 1).normalize();
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff,0.5))

// Make a red cube
let cube = new THREE.Mesh(
    new THREE.BoxGeometry(1,1,1),
    new THREE.MeshLambertMaterial({color:'red'})
);
cube.position.set(0, 3.5, -5);
scene.add(cube);

document.body.appendChild(renderer.domElement);

const panel_welcome = new ThreeMeshUI.Block({
    width: 1.2,
    height: 0.7,
    padding: 0.2,
    fontFamily: fontFamily,
    fontTexture: fontTexture,
});

panel_welcome.position.set(0, 3, -3);
panel_welcome.rotation.x = 20;

const text_welcome = new ThreeMeshUI.Text({
    content: "Willkommen im virtuellen Museum",

});
panel_welcome.add( text_welcome );
scene.add( panel_welcome );



