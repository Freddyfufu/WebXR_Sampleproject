


import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader";
import { scene, camera, renderer } from './scene.js';
import {Object3D} from "three";
import * as ThreeMeshUI from "three-mesh-ui";
import { Text } from 'troika-three-text';
import fontFamily from "../assets/three-mesh-ui/assets/Roboto-msdf.json";
import fontTexture from "../assets/three-mesh-ui/assets/Roboto-msdf.png";

export let interactableObjects = [];

export function loadModels() {

// DracoLoader erstellen und konfigurieren
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./assets/libs/draco/'); // Pfad zum Draco-Ordner setzen

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.load('assets/hall_empty.glb', (gltf) => {
        const model = gltf.scene; // Das geladene Modell
        model.position.set(7, 0, 0);
        scene.add(model); // Modell zur Szene hinzufügen
        console.log('Hall loaded');
    }, undefined, function (error) {
        console.error('An error happened:', error);
    });

    gltfLoader.load('assets/exponat/lambo.glb', (gltf) => {
        const model = gltf.scene; // Das geladene Modell
        model.name = 'lambo';

        model.position.set(5, 0.5, -5);
        // model.scale.set(3, 3, 3);
        model.rotation.y = Math.PI / 3;
        const textMesh = new Text();
        textMesh.text = 'Quiz starten!';
        textMesh.fontSize = 0.3;
        textMesh.color = 0x000000;
        model.myText = textMesh;
        scene.add(model); // Modell zur Szene hinzufügen
        console.log('Car loaded');
        interactableObjects.push(model);
    }, undefined, function (error) {
        console.error('An error happened:', error);
    });

    gltfLoader.load('assets/exponat/sci_fi_space_helmet.glb', (gltf) => {
        const model = gltf.scene; // Das geladene Modell
        model.name = 'helmet';

        model.position.set(12, 0, -5);
        // model.scale.set(3, 3, 3);
        setInterval(() => {
            model.rotation.y += 0.01;
        }, 50);
        const textMesh = new Text();
        textMesh.text = 'Quiz starten!';
        textMesh.fontSize = 0.3;
        textMesh.color = 0x000000;
        model.myText = textMesh;
        scene.add(model); // Modell zur Szene hinzufügen
        console.log('Helmet loaded');
        interactableObjects.push(model);
    }, undefined, function (error) {
        console.error('An error happened:', error);
    });

    interactableObjects.forEach(obj => obj.updateMatrixWorld());

}