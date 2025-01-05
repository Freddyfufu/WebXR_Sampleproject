// Import three
import * as THREE from 'three';
// Import the default VRButton
import { VRButton } from 'three/addons/webxr/VRButton.js';
import {WebXRButton} from '../src/utils/webxr-button.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import {MTLLoader} from "three/examples/jsm/loaders/MTLLoader";
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader";
import { Text } from 'troika-three-text';
import * as ThreeMeshUI from 'three-mesh-ui';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';







function onSessionStarted(session) {

    // xrButton.setSession(session);
    scene.add(camera);
    // session.addEventListener('end', onSessionEnded);
    // session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });

}

function onRequestSession() {

        return navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'hand-tracking'] }).then(onSessionStarted);

}

function onEndSession(session) {
    session.end();
}

// webxr variables
let BoundedReferenceSpace;
let updateBoundary = false;

let reticle = null;
let controller1, controller2;
let controllerGrip1, controllerGrip2;

// Make a new scene
let scene = new THREE.Scene();
// Set background color of the scene to gray
scene.background = new THREE.Color(0x808080);



// DracoLoader erstellen und konfigurieren
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('./assets/libs/draco/'); // Pfad zum Draco-Ordner setzen

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);



gltfLoader.load('assets/shuttle/shuttle.glb', (gltf) => {
    const model = gltf.scene; // Das geladene Modell
    scene.add(model); // Modell zur Szene hinzufügen
    model.position.set(0, 0, -30);
    // model.scale.set(2, 2, 2);
    model.rotation.set(0.3, 0.4, 0);
}, undefined, function (error) {
        console.error('An error happened:', error);
    });
// Koordinatensystem hinzufügen
const axesHelper = new THREE.AxesHelper(5); // 5 = Länge der Achsen
scene.add(axesHelper);

// Make a camera. note that far is set to 100, which is better for realworld sized environments
let camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 0);
scene.add(camera);

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


// Make a renderer that fills the screen
let renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
// Turn on VR support
renderer.xr.enabled = true;
// Set animation loop
renderer.setAnimationLoop(render);
// Add canvas to the page
document.body.appendChild(renderer.domElement);

// Add a button to enter/exit vr to the page

// document.body.appendChild(VRButton.createButton(renderer));
// Add a button to enter/exit xr to the page

import fontFamily from './assets/three-mesh-ui/assets/Roboto-msdf.json';
import fontTexture from './assets/three-mesh-ui/assets/Roboto-msdf.png';

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

// Controller initialisieren
const controller = renderer.xr.getController(0);
scene.add(controller);



let xrHitTestSource = null;



const text_enter_name = new ThreeMeshUI.Text({
    content: "Benuztername eingeben",
});



panel_enter_name.add( text_enter_name );
panel_enter_name.position.set(3, 3, -3);
panel_enter_name.rotation.x = 20;
panel_enter_name.rotation.y = 20;


panel_welcome.add( text_welcome );

// scene is a THREE.Scene (see three.js)
scene.add( panel_welcome );





if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-vr')
        .then((supported) => {
            if (supported) {
                setupControllers();

            }
        });
}


 document.body.appendChild(VRButton.createButton(renderer));

// Handle browser resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function render(time) {
    // Rotate the cube
    cube.rotation.y = time / 1000;
    // Draw everything
    renderer.render(scene, camera);

    // Update the UI
    ThreeMeshUI.update();
    // Update the controllers
    updateControllerInteraction(controller1);
    updateControllerInteraction(controller2);

}







// Controller und Strahl hinzufügen
function setupControllers() {
    // Controller 1
    const controller1 = renderer.xr.getController(0);
    scene.add(controller1);

    // Controller 2
    const controller2 = renderer.xr.getController(1);
    scene.add(controller2);

    // XRControllerModelFactory für Modelle
    const controllerModelFactory = new XRControllerModelFactory();

    // Controller 1 Modell
    const controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controllerGrip1);

    // Controller 2 Modell
    const controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip2);

    // Strahlen hinzufügen
    addControllerRay(controller1);
    addControllerRay(controller2);
}

// Funktion für einen Strahl
function addControllerRay(controller) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1), // Länge des Strahls
    ]);

    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const line = new THREE.Line(geometry, material);

    line.name = 'ray';
    line.scale.z = 10; // Länge des Strahls
    controller.add(line);
}
const raycaster = new THREE.Raycaster();

function updateControllerInteraction(controller) {
    if (!controller) {
        console.error('Controller ist nicht definiert');
        return;
    }
    const line = controller.getObjectByName('ray');
    if (!line) {
        console.error('Ray ist nicht definiert');
        return;
    }
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);

    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    // Prüfe auf Treffer
    const intersects = raycaster.intersectObjects(scene.children, false);

    if (intersects.length > 0) {
        console.log('Treffer:', intersects[0].object);
        line.material.color.set(0xff0000); // Strahl färben
    } else {
        line.material.color.set(0x00ff00); // Standardfarbe
    }
}