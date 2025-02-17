// Beispielanwendung WebXR im Rahmen der Bachelorarbeit von Freddy Oexemann


// Modelle von sketchfab.com


import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader";
import {scene} from './scene.js';
import {Text} from 'troika-three-text';

export let interactableObjects = [];
export let moveableObjects = [];

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
    // loadGoat();
    // loadHighResHelmet();
    // loadHighResSubmarine();
}

export function loadGoat(pos, scale, rot) {
    console.log('Loading MOVEABLE OBJECT');
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./assets/libs/draco/'); // Pfad zum Draco-Ordner setzen
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.load('assets/exponat/truck.glb', (gltf) => {
        const model = gltf.scene; // Das geladene Modell
        model.name = 'moveableObject';
        model.position.set(pos[0], pos[1], pos[2]);
        model.scale.set(scale[0], scale[1], scale[2]);
        model.rotation.y = rot;
        const textMesh = new Text();
        textMesh.text = 'Quiz starten!';
        textMesh.fontSize = 0.3;
        textMesh.color = 0x000000;
        model.myText = textMesh;
        scene.add(model); // Modell zur Szene hinzufügen
        console.log('Goat loaded');
        interactableObjects.push(model);
        moveableObjects.push(model);
    }, undefined, function (error) {
        console.error('An error happened:', error);
    });
    moveableObjects.forEach(obj => obj.updateMatrixWorld());
    interactableObjects.forEach(obj => obj.updateMatrixWorld());
}

export function loadHighResSubmarine() {
    console.log('Loading high res submarine');
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./assets/libs/draco/'); // Pfad zum Draco-Ordner setzen
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.load('assets/exponat/submarine1.glb', (gltf) => {
        const model = gltf.scene; // Das geladene Modell
        model.name = 'submarine';
        model.position.set(5, 0.5, 1);
        model.scale.set(0.006, 0.006, 0.006);
        model.rotation.y = Math.PI / 2;
        const textMesh = new Text();
        textMesh.text = 'Quiz starten!';
        textMesh.fontSize = 0.3;
        textMesh.color = 0x000000;
        model.myText = textMesh;
        scene.add(model); // Modell zur Szene hinzufügen
        console.log('Submarine loaded');
        interactableObjects.push(model);
    }, undefined, function (error) {
        console.error('An error happened:', error);
    });
    interactableObjects.forEach(obj => obj.updateMatrixWorld());

}

export function loadHighResHelmet() {
    console.log('Loading high res helmet');
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./assets/libs/draco/'); // Pfad zum Draco-Ordner setzen
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
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
        console.log('High res helmet loaded');
        interactableObjects.push(model);
    }, undefined, function (error) {
        console.error('An error happened:', error);
    });

    interactableObjects.forEach(obj => obj.updateMatrixWorld());
}