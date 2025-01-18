// Import three
import * as THREE from 'three';
// Import the default VRButton
// import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
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
import {Vector3, WebXRManager} from "three";
import {mat4, vec3, quat} from './js/render/math/gl-matrix.js';
import fontFamily from '../assets/three-mesh-ui/assets/Roboto-msdf.json';
import fontTexture from '../assets/three-mesh-ui/assets/Roboto-msdf.png';



let dolly;
let reticleGeometry;
let reticleMaterial;
let reticle;
let groundCollider;


function onSelectStart(event) {
    referenceSpace = VRButton.referenceSpace;
    induceControllerRay(controller1);
    // induceControllerRay(controller2);

    // teleportToIntersection(controller1, event);
}
function onSessionStart(session) {
    mysession = session;
    console.log('Session started');

    reticleGeometry = new THREE.RingGeometry(0.1, 0.15, 32); // Ring für das Reticle
    reticleMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Gelbes Material
    reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    reticle.rotation.x = -Math.PI / 2; // Flach auf den Boden legen
    reticle.visible = false; // Standardmäßig unsichtbar
    scene.add(reticle);


    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
// Turn on VR support
    renderer.xr.enabled = true;
// Set animation loop
    setupControllers();
    referenceSpace = VRButton.referenceSpace;
    // mysession = btnDict.session;
    // Make a camera. note that far is set to 100, which is better for realworld sized environments
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 300, 0);
    scene.add(camera);
    // Controller initialisieren
    const controller = renderer.xr.getController(0);
    scene.add(controller);
    renderer.xr.setReferenceSpaceType('local');
    dolly = new THREE.Group();
    dolly.add(controller1);
    dolly.add(controller2);
    dolly.add(camera); // Füge die Kamera hinzu
    dolly.add(controllerGrip1);
    dolly.add(controllerGrip2);
    scene.add(dolly);  // Füge das Dolly-Objekt zur Szene hinzu

    const colliderGeometry = new THREE.PlaneGeometry(100, 100);
    const colliderMaterial = new THREE.MeshBasicMaterial({ visible: false }); // Unsichtbares Material
    groundCollider = new THREE.Mesh(colliderGeometry, colliderMaterial);

    groundCollider.rotation.x = -Math.PI / 2; // Liegt flach auf dem Boden
    scene.add(groundCollider);


    renderer.setAnimationLoop(render);
}

function onSessionEnd(ev) {
    console.log('Session ended');
}

function onSelectEnd(event) {
    isSelecting = false;
}

function teleportToIntersection(controller, event) {
    if (!controller) {
        console.error('Controller is not defined');
        return;
    }
    const line = controller.getObjectByName('ray');
    if (!line) {
        console.error('Ray is not defined');
        return;
    }

    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);

    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    // dolly.position.copy(videoMesh.position);


    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
        const intersectionPoint = intersects[0].point;
        reticle.position.copy(intersectionPoint);
        // reticle.position.y = 0.01; // Etwas über dem Boden
        reticle.visible = true; // Zeige das Reticle an

    }
    else {
        reticle.visible = false; // Verstecke das Reticle
    }
}

// webxr variables

let isSelecting = false;
let vrButton;
let referenceSpace;
let mysession;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let camera;



// Make a new scene
let scene = new THREE.Scene();

// Set background color of the scene to gray
scene.background = new THREE.Color(0x808080);


let sessionOptions = {
    requiredFeatures: ['local'],
    optionalFeatures: ['hand-tracking'],
    domOverlay: {root: document.body}
}

let renderer = new THREE.WebGLRenderer({antialias: true});
let btnDict = {};
btnDict = VRButton.createButton(renderer, sessionOptions, onSelectStart, onSelectEnd, onSessionStart, onSessionEnd);
vrButton = btnDict.button;
mysession = btnDict.session;
document.body.appendChild(vrButton);
referenceSpace = btnDict.referenceSpace;


// Create a video element
let video = document.createElement('video');
video.loop = true;
video.src = '/assets/media/video/gn.mkv';
video.crossOrigin = 'anonymous';
video.muted = false;
video.playsInline = true;
video.load();
video.name = 'video';

// Create a texture from the video
const videoTexture = new THREE.VideoTexture(video);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;
videoTexture.format = THREE.RGBFormat;



// Create a material for the video plane
const videoMaterial = new THREE.MeshBasicMaterial({
    map: videoTexture,
    side: THREE.FrontSide,
});
videoMaterial.name = 'videoMaterial';

// Create a plane geometry for the video screen
const videoGeometry = new THREE.PlaneGeometry(2.1, 1.1);
const videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);
videoMesh.name = 'videoMesh';

// Position the video mesh
videoMesh.position.set(0.025, 0.275, -4.4);
scene.add(videoMesh);

// Adjust the aspect ratio of the video plane after the video loads
video.addEventListener('loadeddata', () => {
    let aspect = video.videoWidth / video.videoHeight;
    if (aspect < 2.0) {
        videoMesh.scale.set(aspect * 1.1, 2.1, 1.0);
    } else {
        videoMesh.scale.set(2.1, 2.1 / aspect, 1.0);
    }
});

// Create a play button texture
const playTexture = new THREE.TextureLoader().load('/assets/media/textures/play-button.png');

// Create a plane for the play button
const playButtonGeometry = new THREE.PlaneGeometry(0.5, 0.5);
const playButtonMaterial = new THREE.MeshBasicMaterial({
    map: playTexture,
    transparent: true,
});
const playButtonMesh = new THREE.Mesh(playButtonGeometry, playButtonMaterial);
playButtonMesh.name = 'playButton';

// Position and scale the play button
playButtonMesh.position.set(0.025, 0.275, -4.2);
playButtonMesh.scale.set(0.5, 0.5, 0.5);
scene.add(playButtonMesh);

// Add interaction for the play button
let raycaster = new THREE.Raycaster();
let isVideoPlaying = false;


function toggleVideoPlayback() {
    if (!isVideoPlaying) {
        video.play();
        playButtonMesh.visible = false;
        isVideoPlaying = true;
    } else {
        video.pause();
        playButtonMesh.visible = true;
        isVideoPlaying = false;
    }
}


// DracoLoader erstellen und konfigurieren
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('./assets/libs/draco/'); // Pfad zum Draco-Ordner setzen

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);




gltfLoader.load('assets/cinema_new.glb', (gltf) => {
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

// scene is a THREE.Scene (see three.js)
scene.add( panel_welcome );


if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-vr')
        .then((supported) => {
            if (supported) {
                console.log('VR wird unterstützt');
            }
        });
}

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
    // referenceSpace = getRefSpace(mysession, true);

    // Update the UI
    ThreeMeshUI.update();
    // Update the controllers
    updateControllerInteraction(controller1);
    updateControllerInteraction(controller2);
    // Draw everything
    renderer.render(scene, camera);


}

// Controller und Strahl hinzufügen
function setupControllers() {
    // Controller 1
    controller1 = renderer.xr.getController(0);
    scene.add(controller1);

    // Controller 2
    controller2 = renderer.xr.getController(1);
    scene.add(controller2);

    // XRControllerModelFactory für Modelle
    const controllerModelFactory = new XRControllerModelFactory();

    // Controller 1 Modell
    controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controllerGrip1);

    // Controller 2 Modell
    controllerGrip2 = renderer.xr.getControllerGrip(1);
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


function updateControllerInteraction(controller) {
    if (!controller) {
        // console.error('Controller ist nicht definiert');
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
        // console.log('Treffer:', intersects[0].object);
        line.material.color.set(0xff0000); // Strahl färben
    } else {
        line.material.color.set(0x00ff00); // Standardfarbe
    }


}

function induceControllerRay(controller) {
    if (!controller) {
        // console.error('Controller ist nicht definiert');
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
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        line.material.color.set(0xffff00); // Strahl färben
        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].object === videoMesh) {
                toggleVideoPlayback(); // Video abspielen oder pausieren
            }
            else if(intersects[i].object.name === "MyGround"){ // Wenn kein interaktives Objekt getroffen wurde zeige das Reticle an und teleportiere
            reticle.position.copy(intersects[i].point);
            reticle.position.y = 0.01; // Etwas über dem Boden
            reticle.visible = true; // Zeige das Reticle an
            dolly.position.copy(reticle.position);
            dolly.updateMatrixWorld(true);
        }}
    }
    else {
        reticle.visible = false; // Verstecke das Reticle
    }

}