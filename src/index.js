import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {VRButton} from "three/examples/jsm/webxr/VRButton";
// require('three/examples/jsm/webxr/VRButton.js');
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import {MTLLoader} from "three/examples/jsm/loaders/MTLLoader";
import {FBXLoader} from "three/examples/jsm/loaders/FBXLoader";
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader";
import { Text } from 'troika-three-text';
import * as ThreeMeshUI from 'three-mesh-ui';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import {VideoNode} from './js/render/nodes/video.js';
import fontFamily from '../assets/three-mesh-ui/assets/Roboto-msdf.json';
import fontTexture from '../assets/three-mesh-ui/assets/Roboto-msdf.png';
import { scene, camera, renderer } from './scene.js';
import { initVR } from './vrSession.js';

initVR();



// DracoLoader erstellen und konfigurieren
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('./assets/libs/draco/'); // Pfad zum Draco-Ordner setzen

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);


gltfLoader.load('assets/home-theater-new2.glb', (gltf) => {
    const model = gltf.scene; // Das geladene Modell
    scene.add(model); // Modell zur Szene hinzufügen
}, undefined, function (error) {
        console.error('An error happened:', error);
    });

// Koordinatensystem hinzufügen
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

const panel_enter_name = new ThreeMeshUI.Block({
    width: 1.2,
    height: 0.7,
    padding: 0.2,
    fontFamily: fontFamily,
    fontTexture: fontTexture,
});


const text_enter_name = new ThreeMeshUI.Text({
    content: "Benuztername eingeben",
});

panel_enter_name.add( text_enter_name );
panel_enter_name.position.set(3, 3, -3);
panel_enter_name.rotation.x = 20;
panel_enter_name.rotation.y = 20;


panel_welcome.add( text_welcome );

scene.add( panel_welcome );



