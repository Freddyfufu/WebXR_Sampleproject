// Beispielanwendung WebXR im Rahmen der Bachelorarbeit von Freddy Oexemann

import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

export let controller1, controller2, controllerGrip1, controllerGrip2, inputSource1, inputSource2;


export function setupControllers(scene, renderer) {
    controller1 = renderer.xr.getController(0);
    controller2 = renderer.xr.getController(1);
    console.log('controller1:', controller1);
    console.log('controller2:', controller2);

// Event-Listener für das `connected`-Event hinzufügen
    controller1.addEventListener('connected', (event) => {
        inputSource1 = event.data; // Zugriff auf XRInputSource
        console.log('Controller 1 verbunden:', inputSource1);
        controller1.userData.inputSource = inputSource1; // Speichere inputSource in userData
    });

    controller2.addEventListener('connected', (event) => {
        inputSource2 = event.data; // Zugriff auf XRInputSource
        console.log('Controller 2 verbunden:', inputSource2);
        controller2.userData.inputSource = inputSource2; // Speichere inputSource in userData
    });

    scene.add(controller1);
    scene.add(controller2);

    const controllerModelFactory = new XRControllerModelFactory();

    controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controllerGrip1);

    controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip2);

    addControllerRay(controller1);
    addControllerRay(controller2);
}

function addControllerRay(controller) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1),
    ]);

    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const line = new THREE.Line(geometry, material);

    line.name = 'ray';
    line.scale.z = 10;

    controller.add(line);
}





